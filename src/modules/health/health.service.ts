import { logger } from "../../config/logger";

export interface HealthStatus {
    status: "ok" | "degraded" | "unhealthy";
    timestamp: string;
    checks: {
        app: "ok" | "down";
        database?: "ok" | "down";
        redis?: "ok" | "down";
    };
}

export class HealthService {
    async checkHealth(): Promise<HealthStatus> {
        const checks = {
            app: "ok" as const,
            database: await this.checkDatabase(),
            redis: await this.checkRedis(),
        };

        const allHealthy = Object.values(checks).every((c) => c === "ok");
        const status: "ok" | "degraded" | "unhealthy" = allHealthy
            ? "ok"
            : Object.values(checks).every((c) => c === "ok" || c === undefined)
              ? "degraded"
              : "unhealthy";

        return {
            status,
            timestamp: new Date().toISOString(),
            checks,
        };
    }

    private async checkDatabase(): Promise<"ok" | "down"> {
        try {
            // TODO: Add actual database connection check when Prisma is set up
            return "ok";
        } catch (error) {
            logger.error("Database health check failed");
            return "down";
        }
    }

    private async checkRedis(): Promise<"ok" | "down"> {
        try {
            // TODO: Add actual Redis connection check when client is initialized
            return "ok";
        } catch (error) {
            logger.error("Redis health check failed");
            return "down";
        }
    }
}

export const healthService = new HealthService();
