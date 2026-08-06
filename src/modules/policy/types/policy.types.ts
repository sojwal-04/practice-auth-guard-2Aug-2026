export enum RateLimitAlgorithm {
    TOKEN_BUCKET = "TOKEN_BUCKET",
    SLIDING_WINDOW = "SLIDING_WINDOW",
    FIXED_WINDOW = "FIXED_WINDOW",
    LEAKY_BUCKET = "LEAKY_BUCKET",
}

export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS",
}

/**
 * Policy matcher: Describes which requests this policy applies to.
 * All specified conditions are AND'd together.
 * Omitted fields act as wildcards (match any).
 */
export interface PolicyMatcher {
    route?: string; // e.g., "/login", "/api/*"
    method?: HttpMethod;
    userId?: string;
    apiKey?: string;
    tenant?: string;
    role?: string;
}

export interface Policy {
    id: string;
    name: string;
    description?: string;
    matcher: PolicyMatcher;
    algorithm: RateLimitAlgorithm;
    capacity: number;
    refillRate: number;
    refillInterval: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * What a caller provides to look up which policy applies to a request.
 */
export interface PolicyLookupRequest {
    route: string;
    method: HttpMethod;
    userId?: string;
    apiKey?: string;
    tenant?: string;
    role?: string;
}
