export function getErrorPageContent(error: Error) {
  return {
    title: "Something went wrong",
    description: error.message || "An unexpected error occurred",
    suggestion: "Please try refreshing the page or contact support if the problem persists",
  };
}
