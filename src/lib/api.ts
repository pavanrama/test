import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, requireUser } from "./auth";
import { AccountingError } from "./accounting";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps an authenticated route handler, injecting the session and converting
 * known error types into structured JSON responses.
 */
export function route<T>(
  handler: (ctx: {
    session: Awaited<ReturnType<typeof requireUser>>;
  }) => Promise<T>,
) {
  return async (): Promise<T | NextResponse> => {
    try {
      const session = await requireUser();
      return await handler({ session });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) return fail(err.message || "Unauthorized", 401);
  if (err instanceof AccountingError) return fail(err.message, 422);
  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
      .join("; ");
    return fail(message || "Validation failed", 422);
  }
  console.error("[api] unexpected error", err);
  const message =
    err instanceof Error ? err.message : "Something went wrong.";
  return fail(message, 500);
}
