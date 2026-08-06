import { logger } from "../../config/logger";
import { AppError } from "../../utils/AppError";
import { policyRepository } from "./policy.repository";
import { Policy, PolicyLookupRequest } from "./types/policy.types";

class PolicyService {
    /**
     * Resolve the applicable policy for a request, matched by
     * route + method + optional userId/apiKey/tenant/role.
     */
    public async matchPolicy(request: PolicyLookupRequest): Promise<Policy> {
        logger.debug(`Resolving policy for ${request.method} ${request.route}`);
        const policy = await policyRepository.findPolicyForRequest(request);

        if (!policy) {
            logger.warn("No policy matched this request");
            throw AppError.notFound(`No policy found for ${request.method} ${request.route}`);
        }

        return policy;
    }

    public async getAllPolicies(): Promise<Policy[]> {
        logger.debug("Fetching all rate limit policies");
        return await policyRepository.getAllPolicies();
    }
}

export const policyService = new PolicyService();
