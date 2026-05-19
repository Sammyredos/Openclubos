"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateUserWizard } from "@/components/users/CreateUserWizard";

export default function EditUserPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  return (
    <CreateUserWizard
      isPageMode={true}
      userId={id}
      onClose={() => router.push("/super-admin/users")}
      onSuccess={() => router.push("/super-admin/users")}
    />
  );
}
