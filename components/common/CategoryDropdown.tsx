"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SubCategory = {
  id: string;
  label: string;
};

type CategoryGroup = {
  id: string;
  label: string;
  children?: SubCategory[];
};

const DEFAULT_CATEGORIES: CategoryGroup[] = [
  {
    id: "all",
    label: "전체상품",
    children: [
      { id: "new", label: "신상품 (NEW)" },
      { id: "best", label: "베스트셀러" },
      { id: "sale", label: "특가/할인" },
    ],
  },
  {
    id: "clothing",
    label: "의류",
    children: [
      { id: "outer", label: "아우터" },
      { id: "top", label: "상의" },
      { id: "pants", label: "팬츠" },
      { id: "skirt-dress", label: "스커트/원피스" },
    ],
  },
  {
    id: "shoes",
    label: "신발",
    children: [
      { id: "sneakers", label: "스니커즈" },
      { id: "loafer-shoes", label: "로퍼/구두" },
      { id: "sandal-slippers", label: "샌들/슬리퍼" },
    ],
  },
  {
    id: "bag",
    label: "가방",
    children: [
      { id: "backpack", label: "백팩" },
      { id: "cross-bag", label: "크로스백" },
      { id: "tote-bag", label: "토트백" },
    ],
  },
  {
    id: "accessory",
    label: "액세서리",
    children: [
      { id: "cap-hat", label: "모자" },
      { id: "jewelry", label: "주얼리" },
      { id: "scarf-belt", label: "머플러/벨트" },
    ],
  },
];

interface CategoryDropdownProps {
  categories?: CategoryGroup[];
}

export default function CategoryDropdown({
  categories = DEFAULT_CATEGORIES,
}: CategoryDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // "신상품 (NEW)"/"베스트셀러"는 실제 subcategory가 아니라 가상 메뉴라
  // /category로 보내면 매칭되는 상품이 없음 - 전용 페이지로 연결
  const DEDICATED_PAGE_LINKS: Record<string, string> = {
    "신상품 (NEW)": "/new-arrivals",
    베스트셀러: "/best-sellers",
  };

  const goToSearch = (parentLabel: string, subLabel?: string) => {
    setIsOpen(false);

    if (subLabel && DEDICATED_PAGE_LINKS[subLabel]) {
      router.push(DEDICATED_PAGE_LINKS[subLabel]);
      return;
    }

    const params = new URLSearchParams();

    const typeValue = parentLabel === "전체상품" ? "전체" : parentLabel;
    params.set("type", typeValue);

    if (subLabel) {
      params.set("sub", subLabel);
    }

    params.set("page", "1");

    router.push(`/category?${params.toString()}`);
  };

  return (
    <div className="hidden sm:inline-block group">
      <button
        type="button"
        aria-label="카테고리 열기"
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-full gap-1.5 items-center justify-center font-bold px-4 pr-2 py-2 hover:bg-gray-100 cursor-pointer hover:text-gray-600 transition-all duration-500"
      >
        카테고리
        <ChevronDown size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          absolute left-1/2 top-full z-20 w-screen -translate-x-1/2
          border-t border-b border-gray-200 bg-white shadow-lg
          transition-all duration-200
          group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
          ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"}
        `}
      >
        <nav className="mx-auto flex max-w-6xl items-start justify-between gap-6 py-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex-1 text-center flex flex-col items-center"
            >
              <button
                type="button"
                className="text-base font-extrabold text-gray-900 hover:text-green-600 transition-colors cursor-pointer pb-2 border-b-2 border-green-500 w-fit"
                onClick={() => goToSearch(cat.label)}
              >
                {cat.label}
              </button>

              {cat.children && cat.children.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {cat.children.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        className="w-full rounded text-sm text-gray-500 hover:text-green-600 hover:bg-green-50 p-1.5 hover:font-medium transition-colors cursor-pointer"
                        onClick={() => goToSearch(cat.label, sub.label)}
                      >
                        {sub.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
