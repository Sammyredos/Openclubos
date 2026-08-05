
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
