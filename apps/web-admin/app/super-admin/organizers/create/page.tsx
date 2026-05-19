"use client";

import { CreateOrganiserWizard } from "@/components/organizers/CreateOrganiserWizard";
import { useRouter } from "next/navigation";

export default function CreateOrganizerPage() {
  const router = useRouter();
  return (
    <CreateOrganiserWizard
      isPageMode={true}
      onClose={() => router.push("/super-admin/organizers")}
      onSuccess={() => router.push("/super-admin/organizers")}
    />
  );
}
