import { apiFetch } from "@/lib/api";
import { readApiErrorResponse } from "@/lib/api-error";

/**
 * Permanently deletes the signed-in account and everything it owns:
 * conversations, data sources and their stored credentials, uploaded files and
 * saved LLM keys. The session ends with it.
 */
export async function deleteAccount(): Promise<void> {
  const response = await apiFetch("/api/me", { method: "DELETE" });

  if (!response.ok) {
    const error = await readApiErrorResponse(
      response,
      "Unable to delete your account.",
    );
    throw new Error(error.message);
  }
}
