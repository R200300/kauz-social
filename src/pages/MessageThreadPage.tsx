import { useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function MessageThreadPage() {
  const { threadId } = useParams();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-md flex flex-col h-screen">
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Conversation</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages will go here */}
      </div>
      <div className="border-t border-border p-4">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}