import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournaments",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
