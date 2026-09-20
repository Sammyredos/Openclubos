import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Member Invitation",
};

export default function InviteSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
