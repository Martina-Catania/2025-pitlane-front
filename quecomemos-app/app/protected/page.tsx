import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleGate } from "@/components/ui/role-based";
import { AdminFoodForm } from "@/components/ui/AdminFoodForm";
import { UserFoods } from "@/components/ui/UserFoods";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const jwt = await supabase.auth.getSession().then(res => res.data.session?.access_token);

  let profile = null;
  let foods: any[] = [];

  if (data.claims) {
    const profileRes = await fetch(
      `http://localhost:3005/profile/${data.claims.sub}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (profileRes.ok) profile = await profileRes.json();

    // Traigo comidas si es usuario normal o admin
    if (profile?.role === "user" || profile?.role === "admin") {
      const foodsRes = await fetch("http://localhost:3005/foods");
      if (foodsRes.ok) foods = await foodsRes.json();
    }
  }

  console.log("profile:", profile);
  console.log("foods:", foods);

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      {profile && (
        <>
          <div className="mb-4">
            <div className="font-bold text-lg">{profile.username || profile.email}</div>
            <div className="text-sm text-gray-500 capitalize">{profile.role}</div>
          </div>

          {/* UI solo para admin */}
          <RoleGate role="admin" userRole={profile.role}>
            <AdminFoodForm />     
            <div className="mt-6">
              <UserFoods foods={foods} />
            </div>
          </RoleGate>

          {/* UI solo para user */}
          <RoleGate role="user" userRole={profile.role}>
            <UserFoods foods={foods} />
          </RoleGate>
        </>
      )}
    </div>
  );
}