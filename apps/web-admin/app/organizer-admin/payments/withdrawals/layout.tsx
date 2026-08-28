import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Withdrawal Requests",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
