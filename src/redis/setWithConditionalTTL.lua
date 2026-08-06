-- Redis Lua Script: Atomic SET with Conditional TTL Preservation
--
-- Problem: Set a value and either:
--   - Create with default TTL (if key doesn't exist)
--   - Preserve existing TTL (if key exists)
--
-- Why Lua is necessary:
--   Without Lua, checking existence and then setting requires 2 commands.
--   Between those commands, another client could modify the key.
--   Lua executes atomically - no interleaving possible.
--
-- Arguments:
--   KEYS[1]  = the Redis key name
--   ARGV[1]  = new value to set
--   ARGV[2]  = default TTL in seconds (if creating new key)
--
-- Return values:
--   1 = key didn't exist, created with default TTL
--   2 = key existed, TTL was preserved
--   -1 = error

-- Get the remaining TTL of the key in milliseconds
-- PTTL returns:
--   -2 if key doesn't exist
--   -1 if key exists but has no expiration
--   n  milliseconds until key expires
local pttl = redis.call('PTTL', KEYS[1])

if pttl == -2 then
    -- Key doesn't exist: Create it with default TTL
    -- SET key value EX seconds
    redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
    return 1
else
    -- Key exists (with or without TTL): Preserve its current TTL
    -- KEEPTTL flag tells Redis: "Update the value but keep the existing expiration"
    redis.call('SET', KEYS[1], ARGV[1], 'KEEPTTL')
    return 2
end