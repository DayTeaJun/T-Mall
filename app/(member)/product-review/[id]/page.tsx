import { createServerSupabaseClient } from "@/lib/config/supabase/server/server";
import { notFound } from "next/navigation";
import ReviewForm from "./_components/ReviewForm";
import ReviewEditForm from "./_components/ReviewEditForm";

export default async function ProductReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const id = (await params).id;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) return notFound();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (!product || productError) return notFound();

  const { data: existingReview, error: reviewError } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", id)
    .maybeSingle();

  if (reviewError) return notFound();

  return (
    <div className="max-w-2xl mx-auto p-6 sm:my-5 bg-white sm:shadow rounded-md">
      <h2 className="text-xl font-semibold mb-4">상품 품질 리뷰</h2>

      {existingReview ? (
        <>
          <p className="text-sm text-gray-600 mb-6">
            이미 이 상품에 대한 리뷰를 작성하셨습니다. 이 상품에 대해 작성한
            리뷰를 수정할 수 있습니다.
          </p>
          <ReviewEditForm product={product} userId={user.id} />
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-6">
            이 상품의 품질에 만족하셨다면 리뷰를 작성해주세요.
          </p>
          <ReviewForm product={product} />
        </>
      )}
    </div>
  );
}
