import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile App Preview",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
