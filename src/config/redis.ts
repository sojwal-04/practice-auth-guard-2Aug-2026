import { createClient } from "redis";
import { logger } from "./logger";
import { env } from "./env";

const redisClient = createClient({
    url: env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger.error("Redis max reconnection attempts reached");
                return new Error("Redis Max Retries");
            }

            return retries * 100;
        },
        connectTimeout: 5000,
    },
});

redisClient.on("connect", () => {
    logger.info("Redis connected");
});

redisClient.on("ready", () => {
    logger.info("Redis ready");
});

redisClient.on("error", (err) => {
    logger.error(`Redis error: ${err.message}`);
});

redisClient.on("reconnecting", () => {
    logger.warn("Redis reconnecting");
});

redisClient.on("end", () => {
    logger.info("Redis connection closed");
});

export const redis = redisClient;
