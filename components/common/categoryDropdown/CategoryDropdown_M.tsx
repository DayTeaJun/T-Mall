"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDownIcon } from "lucide-react";

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
    label: "전체",
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

// "신상품 (NEW)"/"베스트셀러"는 실제 subcategory가 아니라 가상 메뉴라
// /category로 보내면 매칭되는 상품이 없음 - 전용 페이지로 연결
const DEDICATED_PAGE_LINKS: Record<string, string> = {
  "신상품 (NEW)": "/new-arrivals",
  베스트셀러: "/best-sellers",
};

const getSubHref = (catLabel: string, subLabel: string) =>
  DEDICATED_PAGE_LINKS[subLabel] ??
  `/category?type=${encodeURIComponent(catLabel)}&sub=${encodeURIComponent(subLabel)}&page=1`;

export default function CategoryDropdown_M({
  categories = DEFAULT_CATEGORIES,
}: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = () => setOpen((v) => !v);
  const close = () => {
    setOpen(false);
    setExpanded(null);
  };

  return (
    <>
      <div className="flex sm:hidden">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="카테고리 열기"
          className="flex pl-4 h-full flex-col items-center justify-center"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <button
          type="button"
          onClick={close}
          aria-label="카테고리 닫기"
          className="fixed inset-0 z-30 sm:hidden"
        />
      )}

      <div
        className={`fixed left-0 top-[40px] bottom-0 z-40 w-56 bg-white shadow-xl transition-transform duration-200 sm:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col">
          {categories.map((cat) => {
            const hasChildren = !!cat.children?.length;
            const isOpen = expanded === cat.label;

            return (
              <div key={cat.id} className="border-b">
                {hasChildren ? (
                  <div className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-800">
                    <Link
                      className="flex-1 text-left"
                      href={`/category?type=${encodeURIComponent(cat.label)}&page=1`}
                    >
                      <span>{cat.label}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : cat.label)}
                    >
                      <ChevronDownIcon size={16} className="shrink-0" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/category?type=${encodeURIComponent(cat.label)}&page=1`}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-800"
                  >
                    {cat.label}
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div className="flex flex-col bg-gray-50">
                    {cat.children!.map((sub) => (
                      <Link
                        key={sub.id}
                        href={getSubHref(cat.label, sub.label)}
                        onClick={close}
                        className="px-6 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
