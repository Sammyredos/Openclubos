import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Tournament Details | Openclub",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
