import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// The login page is a Client Component and cannot export metadata itself, so
// its title and canonical live in this server-component layout.
export const metadata: Metadata = pageMetadata({
  title: "Sign In",
  description:
    "Sign in to Kakaw AI with Google or GitHub to start querying your database in plain English.",
  path: "/login",
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
