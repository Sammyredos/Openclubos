import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Details",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
