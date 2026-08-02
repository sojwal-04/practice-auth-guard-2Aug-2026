import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/response";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        logger.warn(`AppError: ${err.message}`);
        return errorResponse(res, err.message, err.statusCode);
    }

    if (err instanceof Error) {
        logger.error(`Unexpected error: ${err.message}`);
        return errorResponse(res, "Internal Server Error", 500);
    }

    logger.error("Unknown error occurred");
    errorResponse(res, "Internal Server Error", 500);
};
