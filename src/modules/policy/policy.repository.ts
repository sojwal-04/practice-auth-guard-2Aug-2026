import {
    Policy,
    RateLimitAlgorithm,
    HttpMethod,
    PolicyMatcher,
    PolicyLookupRequest,
} from "./types/policy.types";

/**
 * Policy Matching Precedence (highest priority first).
 *
 * This is the single source of truth for "which policy wins when several
 * match the same request." Each field maps to one comparison step below —
 * to add a new dimension (e.g. organizationId), decide where it belongs in
 * this list and slot it into the same position in `comparePrecedence`.
 *
 *   1. userId        - policy pinned to one specific user
 *   2. apiKey         - policy pinned to one specific API key
 *   3. role           - policy scoped to a role (e.g. "premium")
 *   4. tenant         - policy scoped to a tenant/customer
 *   5. method         - policy scoped to one HTTP method
 *   6. exact route    - matcher route equals the request route exactly
 *   7. wildcard route - matcher route matches via a "/*" prefix
 *   8. default policy - no route constraint at all (catch-all)
 */
class PolicyRepository {
    private readonly policies: Policy[] = [
        {
            id: "1",
            name: "Login - Rate Limit",
            matcher: {
                route: "/login",
                method: HttpMethod.POST,
            },
            algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
            capacity: 5,
            refillRate: 1,
            refillInterval: 60,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: "2",
            name: "Payments - Premium",
            matcher: {
                route: "/payments",
                method: HttpMethod.POST,
                role: "premium",
            },
            algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
            capacity: 100,
            refillRate: 10,
            refillInterval: 60,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: "3",
            name: "Payments - Free Tier",
            matcher: {
                route: "/payments",
                method: HttpMethod.POST,
                role: "free",
            },
            algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
            capacity: 10,
            refillRate: 1,
            refillInterval: 60,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: "4",
            name: "API Default",
            matcher: {
                route: "/api/*",
            },
            algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
            capacity: 1000,
            refillRate: 100,
            refillInterval: 60,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    /**
     * Find all policies that match the given request attributes
     * Returns policies sorted by precedence (higher priority first)
     */
    public async findMatchingPolicies(request: PolicyLookupRequest): Promise<Policy[]> {
        const matches = this.policies.filter((policy) =>
            this.policyMatches(policy.matcher, request)
        );

        return matches.sort((a, b) => this.comparePrecedence(a.matcher, b.matcher));
    }

    /**
     * Find the most specific (highest priority) policy for a request
     */
    public async findPolicyForRequest(request: PolicyLookupRequest): Promise<Policy | undefined> {
        const matches = await this.findMatchingPolicies(request);
        return matches[0];
    }

    /**
     * Check if a policy matcher matches a request
     * Omitted matcher fields act as wildcards (match any)
     */
    private policyMatches(matcher: PolicyMatcher, request: PolicyLookupRequest): boolean {
        if (matcher.route && !this.routeMatches(matcher.route, request.route)) {
            return false;
        }
        if (matcher.method && matcher.method !== request.method) {
            return false;
        }
        if (matcher.userId && matcher.userId !== request.userId) {
            return false;
        }
        if (matcher.apiKey && matcher.apiKey !== request.apiKey) {
            return false;
        }
        if (matcher.tenant && matcher.tenant !== request.tenant) {
            return false;
        }
        if (matcher.role && matcher.role !== request.role) {
            return false;
        }
        return true;
    }

    /**
     * Check if a route pattern matches a request route
     * Supports wildcard matching: "/api/*" matches "/api/users", "/api/posts", etc.
     */
    private routeMatches(pattern: string, route: string): boolean {
        if (pattern === route) return true;
        if (pattern.endsWith("/*")) {
            const prefix = pattern.slice(0, -2);
            return route.startsWith(prefix + "/") || route === prefix;
        }
        return false;
    }

    /**
     * Compare two matchers by the precedence order documented above the
     * class, step by step (not summed into a single score). This avoids the
     * classic flaw of additive specificity scoring, where several weaker
     * signals (e.g. tenant + method) can outrank one stronger signal
     * (e.g. userId) just because their weights happen to add up higher.
     *
     * Returns a negative number if `a` should come before `b`, positive if
     * `b` should come before `a`, matching Array.sort's comparator contract.
     */
    private comparePrecedence(a: PolicyMatcher, b: PolicyMatcher): number {
        const aTuple = this.getPrecedenceTuple(a);
        const bTuple = this.getPrecedenceTuple(b);

        for (const [i, aValue] of aTuple.entries()) {
            const bValue = bTuple[i] ?? 0;
            if (aValue !== bValue) {
                // Higher tuple value = higher precedence = sorts first
                return bValue - aValue;
            }
        }
        return 0;
    }

    /**
     * Build a matcher's precedence tuple: one slot per rule in the
     * "Policy Matching Precedence" list above, in the same order.
     * Each slot is 1 if that dimension is present on the matcher (i.e. it
     * narrows the match), 0 otherwise — except route, which has three
     * levels (exact / wildcard / absent) instead of just present/absent.
     */
    private getPrecedenceTuple(matcher: PolicyMatcher): number[] {
        return [
            matcher.userId ? 1 : 0, // 1. userId
            matcher.apiKey ? 1 : 0, // 2. apiKey
            matcher.role ? 1 : 0, // 3. role
            matcher.tenant ? 1 : 0, // 4. tenant
            matcher.method ? 1 : 0, // 5. method
            this.getRouteSpecificity(matcher.route), // 6/7/8. route: exact > wildcard > none
        ];
    }

    /**
     * Rank a matcher's route constraint: exact match beats wildcard match
     * beats no route constraint at all (the catch-all/default case).
     */
    private getRouteSpecificity(route?: string): number {
        if (!route) return 0; // 8. default policy (no route constraint)
        if (route.endsWith("/*")) return 1; // 7. wildcard route
        return 2; // 6. exact route
    }

    public async getAllPolicies(): Promise<Policy[]> {
        return this.policies;
    }
}

export const policyRepository = new PolicyRepository();
