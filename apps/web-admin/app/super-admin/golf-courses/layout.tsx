import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Courses",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
