import { Router } from "express";
import { logger } from "./config/logger";
import healthRoutes from "./modules/health/health.routes";
import policyRoutes from "./modules/policy/policy.routes";
import { setWithConditionalTTL } from "./utils/redisLua";

const routes = Router();

routes.use("/health", healthRoutes);
routes.use("/policies", policyRoutes);

routes.get("/", (_, res) => {
    return res.json({
        success: true,
        message: "RateGuard API",
    });
});

routes.get("/users", async (req, res) => {
    const value = String(req.query.value || "default");
    logger.info(`User request with value: ${value}`);

    // Atomic operation: Set value, conditionally preserve or create TTL
    // This is production-safe because it's implemented as a Lua script
    const result = await setWithConditionalTTL("user:data", value, 60);

    logger.info(
        result === 1 ? "Created new key with 60s TTL" : "Updated existing key, TTL preserved"
    );

    return res.json({
        success: true,
        data: {
            message: result === 1 ? "Created" : "Updated",
            users: [
                { id: 1, name: "Sojwal Gosavi" },
                { id: 2, name: "Shruti Gosavi" },
                { id: 3, name: "Shubham Pagar" },
                { id: 4, name: "Lalita Routh" },
                { id: 6, name: "Rakesh Joshi" },
            ],
        },
    });
});

export default routes;
