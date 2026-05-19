"use client";

import { useParams } from "next/navigation";
import { CreateTournamentForm } from "@/components/tournaments/CreateTournamentForm";

export default function EditTournamentPage() {
  const { id } = useParams() as { id: string };
  return <CreateTournamentForm redirectPath="/organizer-admin/tournaments" tournamentId={id} />;
}
