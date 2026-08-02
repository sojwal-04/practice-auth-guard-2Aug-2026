import { env } from "./env";
import pino from "pino";

const transport =
    env.NODE_ENV === "development"
        ? pino.transport({
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
              },
          })
        : undefined;

export const logger = pino(
    {
        level: process.env.LOG_LEVEL ?? "info",
    },
    transport
);
