const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";

const SAFE_AUTH_ERROR_MESSAGES = [
  "An account with this email already exists.",
  "Invalid email or password.",
  "Please use the original sign-in method for this account.",
  "Unable to create your account right now.",
  "Your session is invalid or expired. Please sign in again.",
] as const;

export function getSafeAuthErrorMessage(error: unknown, fallback = GENERIC_AUTH_ERROR) {
  const message = error instanceof Error ? error.message : "";

  return SAFE_AUTH_ERROR_MESSAGES.find((safeMessage) => message.includes(safeMessage)) ?? fallback;
}
