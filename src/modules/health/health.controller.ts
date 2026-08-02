import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { healthService } from "./health.service";

export const getHealth = asyncHandler(async (_req, res) => {
    const health = await healthService.checkHealth();
    const statusCode = health.status === "ok" ? 200 : 503;
    successResponse(res, "Health check successful", { health }, statusCode);
});
