import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open in App",
};

export default function AppRedirectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
