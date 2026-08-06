import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { redis } from "./config/redis";
import { initializeLuaScripts } from "./utils/redisLua";

const PORT = env.PORT;

const startServer = async () => {
    try {
        await Promise.race([
            redis.connect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Redis Connection Timeout")), 10000)
            ),
        ]);
        logger.info("Redis connected successfully");

        // Pre-load Lua scripts into Redis cache for faster execution
        await initializeLuaScripts();
    } catch (err) {
        logger.warn("Redis not available, continuing without it");
    }

    app.listen(PORT, () => {
        logger.info(`Server Running on port ${PORT}`);
    });
};

startServer();
