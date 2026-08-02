export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "AppError";
    }

    static badRequest(message: string) {
        return new AppError(message, 400);
    }

    static unauthorized(message = "Unauthorized") {
        return new AppError(message, 401);
    }

    static forbidden(message = "Forbidden") {
        return new AppError(message, 403);
    }

    static notFound(message = "Not Found") {
        return new AppError(message, 404);
    }

    static conflict(message: string) {
        return new AppError(message, 409);
    }

    static internal(message = "Internal Server Error") {
        return new AppError(message, 500);
    }
}

// export class AppError2 extends Error {
//     constructor(
//         public message: string,
//         public statusCode: number
//     ) {
//         super(message);
//         this.name = "AppError";
//     }

//     static badRequest(message: string) {
//         return new AppError(message, 400);
//     }
// }
