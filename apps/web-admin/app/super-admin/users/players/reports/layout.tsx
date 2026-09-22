import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Reports",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
