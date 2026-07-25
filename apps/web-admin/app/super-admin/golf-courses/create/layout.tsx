import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Golf Course",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
