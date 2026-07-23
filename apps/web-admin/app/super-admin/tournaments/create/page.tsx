import { CreateTournamentForm } from "@/components/tournaments/CreateTournamentForm";

export const metadata = {
  title: "Create",
};


export default function CreateTournamentPage() {
  return <CreateTournamentForm redirectPath="/super-admin/tournaments" />;
}
