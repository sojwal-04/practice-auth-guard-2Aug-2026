import { redis } from "../config/redis";
import { readFileSync } from "fs";
import { join } from "path";
import { logger } from "../config/logger";

// Load Lua script once at startup
const luaScriptPath = join(process.cwd(), "src/redis/setWithConditionalTTL.lua");

const luaScript = readFileSync(luaScriptPath, "utf-8");

// Cache for script SHA (Redis caches scripts by SHA1 hash)
let scriptSHA: string | null = null;

/**
 * Initialize Lua script cache
 * Call this once when Redis connects
 */
export async function initializeLuaScripts() {
    try {
        // Pre-load the script so Redis Caches it
        scriptSHA = await redis.scriptLoad(luaScript);
        logger.info("Lua Script Loaded. SHA " + scriptSHA);
    } catch (err) {
        logger.error("Error: " + err);
        // Script will be loaded on-demand if needed
    }
}

/**
 * Set a key with conditional TTL preservation
 *
 * Behavior:
 *   - If key doesn't exist: create with defaultTTL
 *   - If key exists: update value, preserve existing TTL
 *
 * Why this is production-safe:
 *   The entire operation (check existence + set value + handle TTL)
 *   happens atomically in Lua. No race conditions possible.
 *
 * @param key - Redis key name
 * @param value - Value to set
 * @param defaultTTL - TTL in seconds if creating new key (default: 30)
 * @returns 1 if created, 2 if updated (TTL preserved)
 */
export async function setWithConditionalTTL(
    key: string,
    value: string,
    defaultTTL = 30 // in seconds
): Promise<1 | 2> {
    try {
        // Try using cached script SHA first (faster, no network overhead)
        if (scriptSHA) {
            try {
                const result = await redis.evalSha(scriptSHA, {
                    keys: [key],
                    arguments: [value, defaultTTL.toString()],
                });

                return result as 1 | 2;
            } catch (err) {
                if ((err as Error).message?.includes("NOSCRIPT")) {
                    console.warn(`Script Cache Miss, Reloading...`);
                    scriptSHA = null;
                    // Fall through to full script execution
                } else {
                    throw err;
                }
            }
        }

        // Fallback: Execute full script if SHA not available
        const result = await redis.eval(luaScript, {
            keys: [key],
            arguments: [value, defaultTTL.toString()],
        });

        return result as 1 | 2;
    } catch (err) {
        console.error(`Redis Lua Operation Failed`, err);
        throw err;
    }
}

/**
 * Example usage for a rate limiter
 *
 * Why atomic operations matter in rate limiting:
 *   Without atomicity, two concurrent requests could both see count=0
 *   and both proceed, allowing 2x the limit through.
 *
 * With Lua atomicity:
 *   Request 1: PTTL -> get TTL -> SET -> return 1 ✓ (all atomic)
 *   Request 2: PTTL -> get TTL -> SET -> return 2 ✓ (all atomic)
 *   No interleaving possible
 */
export async function exampleRateLimiterUsage(userId: string) {
    const key = `rate:${userId}`;
    const result = await setWithConditionalTTL(key, "1", 60);

    if (result === 1) {
        console.log(`First request from ${userId}, TTL: 60s`);
    } else {
        console.log(`Subsequent request from ${userId}, TTL: preserved`);
    }
}
