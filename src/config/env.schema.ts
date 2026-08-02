import { z } from "zod";

export const envSchema = z.object({
    PORT: z.coerce.number().default(20101),
    DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().optional(),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
});
