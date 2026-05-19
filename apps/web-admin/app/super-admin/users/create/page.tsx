"use client";

import { CreateUserWizard } from "@/components/users/CreateUserWizard";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();
  return (
    <CreateUserWizard
      isPageMode={true}
      onClose={() => router.push("/super-admin/users")}
      onSuccess={() => router.push("/super-admin/users")}
    />
  );
}
