import { Router } from "express";
import { policyController } from "./policy.controller";

const router = Router();

// POST /policies/check - Resolve the policy for a request (route, method, userId, apiKey, tenant, role)
router.post("/check", policyController.checkPolicy);

// GET /policies - List all policies
router.get("/", policyController.getAllPolicies);

export default router;
