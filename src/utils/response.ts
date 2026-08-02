import { Response } from "express";

export interface ApiResponse<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string | undefined;
    data: T;
}

export const sendResponse = <T>(res: Response, statusCode: number, message: string, data?: T) => {
    res.status(statusCode).json({
        success: statusCode < 400,
        statusCode,
        message,
        data: data || null,
    } as ApiResponse<T>);
};

export const successResponse = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
    sendResponse(res, statusCode, message, data);
};

export const errorResponse = (res: Response, message: string, statusCode = 500) => {
    sendResponse(res, statusCode, message);
};
