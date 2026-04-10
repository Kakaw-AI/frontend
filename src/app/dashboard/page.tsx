import type { Metadata } from "next";
import ChatPage from "../chat/page";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <ChatPage />;
}
