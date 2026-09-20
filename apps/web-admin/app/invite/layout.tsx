import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join OpenclubOS",
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
