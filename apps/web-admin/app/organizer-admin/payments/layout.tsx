import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Wallet",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
