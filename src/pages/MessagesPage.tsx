import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);

  return (
    <div className="mx-auto max-w-md pb-20 pt-4">
      <div className="mb-4 flex items-center gap-2 px-4">
        <MessageCircle size={24} />
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No messages yet. Start a conversation!
        </p>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className="w-full border-b border-border px-4 py-3 text-left hover:bg-muted"
            >
              <p className="font-semibold">{conv.name}</p>
              <p className="text-xs text-muted-foreground">{conv.lastMessage}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}