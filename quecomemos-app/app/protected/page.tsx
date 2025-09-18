import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProfileSection } from "@/components/user-profile-section";


export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  return <UserProfileSection />;
}
