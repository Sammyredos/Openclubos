import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signup Organisation",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
