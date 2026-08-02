import { Router } from "express";
import { logger } from "./config/logger";
import healthRoutes from "./modules/health/health.routes";

const routes = Router();

routes.use("/health", healthRoutes);

routes.get("/", (_, res) => {
    return res.json({
        success: true,
        message: "RateGuard API",
    });
});

routes.get("/users", (_, res) => {
    logger.info("hiiii");
    return res.json({
        success: true,
        data: {
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
