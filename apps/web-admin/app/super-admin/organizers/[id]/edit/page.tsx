"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateOrganiserWizard } from "@/components/organizers/CreateOrganiserWizard";

export default function EditOrganizerPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  return (
    <CreateOrganiserWizard
      isPageMode={true}
      organizerId={id}
      onClose={() => router.push("/super-admin/organizers")}
      onSuccess={() => {
        router.refresh();
        router.push("/super-admin/organizers");
      }}
    />
  );
}
