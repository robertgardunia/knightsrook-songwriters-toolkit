import { clerkMiddleware, requireAuth } from "@clerk/express";

export const clerk = clerkMiddleware();
export const requireUser = requireAuth();
