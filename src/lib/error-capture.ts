export function captureException(error: Error, context?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.error("Error:", error, context);
  }
}
