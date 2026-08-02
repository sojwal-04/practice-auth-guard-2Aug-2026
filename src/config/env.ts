import dotenv from "dotenv";
import { envSchema } from "./env.schema";

dotenv.config();

export const env = envSchema.parse(process.env);

export type Env = typeof env;
