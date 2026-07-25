import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Organizer",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
