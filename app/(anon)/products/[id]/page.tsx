import { notFound } from "next/navigation";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import ProductImageSection from "./_components/section/ProductImageSection";
import ShareButton from "@/components/common/buttons/ShareBtn";
import ProductPurchaseSection from "./_components/section/ProductPurchaseSection";
import RecommendProductsCarousel from "./_components/section/RecommendProductsCarousel";
import { publicSupabase } from "@/lib/config/supabase/publicClient";
import Image from "next/image";
import BookmarkBtn from "@/components/common/buttons/BookmarkBtn";
import ProductTabs from "./_components/ProductTabs";
import ProductInquiry from "./_components/inquiry/ProductInquiry";
import ProductViewLog from "./_components/ProductViewLog";
import ReviewsSection from "./_components/review/ReviewsSection";

// ReviewsSection.tsx / ProductInquiry.tsx의 PRODUCT_REVIEWS_PAGE_SIZE,
// PRODUCT_INQUIRY_PAGE_SIZE와 반드시 같은 값으로 유지
// ("use client" 모듈의 값은 서버 컴포넌트에서 직접 import해 쓰면 런타임에
// 실제 값이 아닌 참조 placeholder로 치환되어 NaN이 되는 문제가 있어 분리함)
const REVIEW_PAGE_SIZE = 5;
const INQUIRY_PAGE_SIZE = 5;

// 상품/상세이미지/리뷰·문의 1페이지 — 전부 로그인 여부와 무관한 공개 데이터라
// unstable_cache로 60초간 재사용. 이 라우트 자체는 더 이상 정적 생성되지 않으므로
// (generateStaticParams 없음) 매 요청마다 실행되지만, DB는 60초에 한 번만 탄다.
const getCachedProductDetail = unstable_cache(
  async (id: string) => {
    const { data: product, error } = await publicSupabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("deleted", false)
      .single();

    if (!product || error) return null;

    const { data: detailImages } = await publicSupabase
      .from("product_images")
      .select("image_url, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true });

    const {
      data: initialReviews,
      count: initialReviewCount,
      error: initialReviewsError,
    } = await publicSupabase
      .from("reviews")
      .select(
        `
        id,
        user_id,
        user_name,
        rating,
        created_at,
        images,
        content,
        product_id,
        updated_at,
        public_profiles ( profile_image_url ),
        helpful_count,
        review_helpfuls ( user_id )
      `,
        { count: "exact" },
      )
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .range(0, REVIEW_PAGE_SIZE - 1);

    if (initialReviewsError) {
      console.error("리뷰 초기 데이터 조회 오류:", initialReviewsError);
    }

    const {
      data: initialInquiries,
      count: initialInquiryCount,
      error: initialInquiriesError,
    } = await publicSupabase
      .from("product_inquiry")
      .select(
        `
        id,
        user_id,
        user_name,
        created_at,
        content,
        answer_content,
        answered_at,
        admin_id
      `,
        { count: "exact" },
      )
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .range(0, INQUIRY_PAGE_SIZE - 1);

    if (initialInquiriesError) {
      console.error("문의 초기 데이터 조회 오류:", initialInquiriesError);
    }

    return {
      product,
      detailImages: detailImages ?? [],
      initialReviews: initialReviews ?? [],
      initialReviewCount: initialReviewCount ?? 0,
      initialInquiries: initialInquiries ?? [],
      initialInquiryCount: initialInquiryCount ?? 0,
    };
  },
  ["product-detail"],
  { revalidate: 60 },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const detail = await getCachedProductDetail(id);
  const product = detail?.product;

  if (!product) {
    return {
      title: "상품을 찾을 수 없습니다",
      description: "존재하지 않거나 삭제된 상품입니다.",
    };
  }

  return {
    title: `T-Mall | ${product.name}`,
    description: product.description?.slice(0, 100) || "상품 상세 정보",
    openGraph: {
      title: `T-Mall | ${product.name}`,
      description: product.description?.slice(0, 100) || "상품 상세 정보",
      images: product.image_url
        ? [
            {
              url: product.image_url,
              width: 800,
              height: 600,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `T-Mall | ${product.name}`,
      description: product.description?.slice(0, 100) || "상품 상세 정보",
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  // 이 라우트는 더 이상 정적 생성되지 않는다(generateStaticParams 없음).
  // 매 요청마다 실제 요청 쿠키 기준으로 렌더링되므로, 캐시된 HTML에 다른
  // 방문자의 로그인 정보가 섞여 나가는 문제가 없다. 공개 데이터 조회
  // 자체는 getCachedProductDetail 안에서 60초짜리 캐시로 처리한다.
  const detail = await getCachedProductDetail(id);
  if (!detail) return notFound();

  const {
    product,
    detailImages,
    initialReviews,
    initialReviewCount,
    initialInquiries,
    initialInquiryCount,
  } = detail;

  const hasDiscount =
    product.original_price && product.original_price > product.price;

  let discountPercent = 0;
  if (hasDiscount && product.original_price) {
    if (product.discount_type === "percentage" && product.discount_value) {
      discountPercent = product.discount_value;
    } else {
      discountPercent = Math.round(
        ((product.original_price - product.price) / product.original_price) *
          100,
      );
    }
  }

  const isSoldOut =
    product.total_stock === 0 ||
    product.total_stock === null ||
    product.total_stock === undefined;

  return (
    <main className="max-w-7xl mt-12 mx-auto p-4 sm:p-8 sm:py-12 flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className="col-span-1">
          <ProductImageSection
            mainImage={product.image_url ?? ""}
            detailImages={detailImages}
          />
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col justify-between w-full">
          <div>
            <p className="text-sm text-gray-500 mb-1">티몰 공식 판매처</p>

            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {isSoldOut && (
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">
                    Sold out
                  </span>
                )}
              </div>
              <div className="flex gap-1 items-center">
                <BookmarkBtn productId={id} />
                <ShareButton />
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              {product.category && (
                <>
                  <span className="hidden sm:inline">
                    카테고리: {product.category}
                  </span>

                  <div className="sm:hidden w-full flex items-center mb-1">
                    <span className="block basis-1/2 text-left">카테고리</span>
                    <span className="block basis-1/2 px-3 py-2 rounded bg-gray-100 text-gray-800 text-center">
                      {product.category}
                    </span>
                  </div>
                </>
              )}

              {product.subcategory && (
                <>
                  <span className="hidden sm:inline ml-2">
                    · 서브 카테고리: {product.subcategory}
                  </span>

                  <div className="sm:hidden w-full flex items-center mb-1">
                    <span className="block basis-1/2 text-left">
                      서브카테고리
                    </span>
                    <span className="block basis-1/2 px-3 py-2 rounded bg-gray-100 text-gray-800 text-center">
                      {product.subcategory}
                    </span>
                  </div>
                </>
              )}

              {product.gender && (
                <>
                  <span className="hidden sm:inline ml-2">
                    · 성별: {product.gender}
                  </span>

                  <div className="sm:hidden w-full flex items-center mb-1">
                    <span className="block basis-1/2 text-left">성별</span>
                    <span className="block basis-1/2 px-3 py-2 rounded bg-gray-100 text-gray-800 text-center">
                      {product.gender}
                    </span>
                  </div>
                </>
              )}

              {product.color && (
                <>
                  <span className="hidden sm:inline ml-2">
                    · 색상: {product.color}
                  </span>

                  <div className="sm:hidden w-full flex items-center mb-1">
                    <span className="block basis-1/2 text-left">색상</span>
                    <span className="block basis-1/2 px-3 py-2 rounded bg-gray-100 text-gray-800 text-center">
                      {product.color}
                    </span>
                  </div>
                </>
              )}
            </div>

            <hr className="my-2" />

            <div className="flex flex-col gap-2">
              {hasDiscount && (
                <div className="flex gap-1.5 items-center">
                  <span className="text-[14px] sm:text-[15px] font-bold tracking-tight">
                    {discountPercent}%
                  </span>
                  <span className="text-[13px] text-gray-400 line-through">
                    {product.original_price?.toLocaleString()}원
                  </span>
                </div>
              )}

              <div className="text-2xl font-bold text-green-700 -mt-2.5">
                {product.price.toLocaleString()}원
              </div>

              <p className="text-sm text-gray-500">
                배송비 3,000원 (20,000원 이상 구매 시 무료)
              </p>

              {isSoldOut ? (
                <p className="text-sm font-semibold text-red-600">
                  현재 재고가 없습니다 (Sold out)
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  총 재고: {product.total_stock}개
                </p>
              )}
            </div>

            <hr className="my-2" />

            <p className="text-gray-700 mb-4 whitespace-pre-line overflow-hidden text-ellipsis line-clamp-5">
              {product.description}
            </p>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <hr className="my-4" />

          {isSoldOut ? (
            <div className="p-4 border rounded bg-gray-50 text-sm text-gray-600">
              이 상품은 현재 품절되었습니다. 재입고 시 알림받기를 이용해 주세요.
            </div>
          ) : (
            <ProductPurchaseSection
              productId={product.id}
              stockBySize={product.stock_by_size as Record<string, number>}
              category={product.category}
            />
          )}
        </div>
      </div>

      <ProductTabs />

      <div id="product-detail-section" className="mt-10 scroll-mt-[146px]">
        {detailImages.map((image) => (
          <div key={image.sort_order} className="mb-4 w-full">
            <Image
              width={1200}
              height={1800}
              src={image.image_url}
              alt={`Product detail ${image.sort_order}`}
              className="w-full h-auto"
            />
          </div>
        ))}
      </div>

      <ReviewsSection
        productId={id}
        initialReviews={initialReviews}
        initialTotalCount={initialReviewCount}
      />

      <ProductInquiry
        productId={id}
        initialInquiries={initialInquiries}
        initialTotalCount={initialInquiryCount}
      />

      <RecommendProductsCarousel
        currentProductId={id}
        category={product.category}
      />

      <ProductViewLog
        productId={id}
        productImg={product.image_url || ""}
        productName={product.name}
      />
    </main>
  );
}
