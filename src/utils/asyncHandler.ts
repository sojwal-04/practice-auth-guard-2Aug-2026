import { Request, Response, NextFunction } from "express";

// Overload: Handler with next parameter
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void;

// Overload: Handler without next parameter (most common for routes)
export function asyncHandler(
    fn: (req: Request, res: Response) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void;

// Implementation
export function asyncHandler(
    fn:
        | ((req: Request, res: Response, next: NextFunction) => Promise<void>)
        | ((req: Request, res: Response) => Promise<void>)
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve((fn as any)(req, res, next)).catch(next);
    };
}
