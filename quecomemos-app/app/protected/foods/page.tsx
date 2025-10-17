import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserFoodsPage } from "@/components/food";

export default async function FoodsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  
  return <UserFoodsPage />;
}