import { createServerSupabaseClient } from "@/lib/config/supabase/server/server";
import { notFound } from "next/navigation";
import OrderList from "./_components/OrderList";

export default async function OrderListPage() {
  const supabase = await createServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user?.user?.id;
  if (!userId) return notFound();

  return <OrderList />;
}
