import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { policyService } from "./policy.service";
import { HttpMethod, PolicyLookupRequest } from "./types/policy.types";

class PolicyController {
    /**
     * POST /policies/check
     * Body: { route, method, userId?, apiKey?, tenant?, role? }
     *
     * A real policy lookup needs more than a route — method, user,
     * API key, tenant, and role can all change which policy applies.
     * A body-based POST expresses that multi-attribute lookup better
     * than a single :route path param.
     */
    public checkPolicy = asyncHandler(async (req: Request, res: Response) => {
        const { route, method, userId, apiKey, tenant, role } = req.body;

        if (!route || typeof route !== "string") {
            throw AppError.badRequest("`route` is required");
        }
        if (!method || !Object.values(HttpMethod).includes(method)) {
            throw AppError.badRequest("`method` is required and must be a valid HTTP method");
        }

        const lookup: PolicyLookupRequest = {
            route,
            method,
            userId,
            apiKey,
            tenant,
            role,
        };

        const policy = await policyService.matchPolicy(lookup);

        successResponse(res, "Policy resolved successfully", { policy });
    });

    public getAllPolicies = asyncHandler(async (_req: Request, res: Response) => {
        const policies = await policyService.getAllPolicies();

        successResponse(res, "All policies fetched", { policies });
    });
}

export const policyController = new PolicyController();
