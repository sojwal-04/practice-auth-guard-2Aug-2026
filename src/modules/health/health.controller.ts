import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { healthService } from "./health.service";

export const getHealth = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const health = await healthService.checkHealth();
    const statusCode = health.status === "ok" ? 200 : 503;
    successResponse(res, "Health check successful", { health }, statusCode);
  }
);
