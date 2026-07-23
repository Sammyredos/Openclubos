import { redirect } from "next/navigation";

export const metadata = {
  title: "Users",
};


export default function UsersRedirectPage() {
  redirect("/super-admin/users/players");
}
