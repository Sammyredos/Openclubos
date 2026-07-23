import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Tournament Registration | Openclub",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
