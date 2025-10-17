import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/profile";
import { API_BASE_URL } from "@/lib/config/api";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const jwt = await supabase.auth.getSession().then(res => res.data.session?.access_token);

  let profile = null;

  if (data.claims) {
    const profileRes = await fetch(
      `${API_BASE_URL}/profile/${data.claims.sub}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (profileRes.ok) profile = await profileRes.json();
  }

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-0">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsForm initialProfile={profile} />
    </div>
  );
}