import type { Metadata } from "next";
import { ChatPageClient } from "@/components/chat/ChatPageClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ChatConversationPage() {
  return <ChatPageClient />;
}
