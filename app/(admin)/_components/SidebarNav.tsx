"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, User, UserCog } from "lucide-react";
import { useState } from "react";

const menu = [
  {
    name: "대시보드",
    currentPage: "/manage/dashboard",
    href: "/manage/dashboard",
  },
  {
    name: "등록 상품 관리",
    currentPage: "/manage/product-list",
    href: "/manage/product-list",
  },
  {
    name: "상품 등록",
    currentPage: "/manage/regist",
    href: "/manage/regist",
  },
  {
    name: "주문 상태 관리",
    currentPage: "/manage/order-list",
    href: "/manage/order-list?query=&page=1",
  },
  {
    name: "고객 관리",
    currentPage: "/manage/user",
    href: "/manage/user",
  },
];

export default function SidebarNav({ level }: { level?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  const isAdmin = level === 3;
  const isSeller = level === 2;

  const visibleMenu =
    level === 3 ? menu : menu.filter((m) => m.href !== "/manage/user");

  return (
    <nav className="flex flex-col h-full bg-white text-sm">
      <div className="md:hidden relative pb-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls="mypage-nav-list"
              className="flex items-center justify-between active:scale-[0.99] transition"
            >
              <Menu size={18} />
            </button>

            <p className="text-xs uppercase flex items-center gap-2 w-fit font-bold text-gray-500">
              <UserCog size={16} />
              {isAdmin && "관리자 전용"}
              {isSeller && "판매자 전용"}
            </p>
          </div>
        </div>

        <ul
          id="mypage-nav-list"
          className={`absolute mt-2 w-full bg-white z-50 overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            open ? "border-b border-t" : "max-h-0"
          }`}
        >
          {visibleMenu.map(({ name, href, currentPage }) => {
            const isActive = pathname.startsWith(currentPage);

            return (
              <li key={href} className="border-b last:border-b-0">
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 transition-colors duration-150 ${
                    isActive
                      ? "bg-gray-800 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {name}
                </Link>
              </li>
            );
          })}

          <div className="border-b last:border-b-0 py-3">
            <Link
              href="/mypage/profile"
              className="text-xs text-gray-500 flex items-center gap-2 hover:text-red-400 px-1"
            >
              <User size={14} />내 정보 메뉴 이동
            </Link>
          </div>
        </ul>
      </div>

      <div className="hidden md:block">
        <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2 border-b-2 border-gray-400 pb-2 pr-2 w-fit font-bold">
          <UserCog size={16} />
          {isAdmin && "관리자 전용"}
          {isSeller && "판매자 전용"}
        </p>

        <ul className="flex flex-col gap-1.5 mt-5">
          <span className="text-[13px] font-semibold text-gray-500 px-2 mt-1 mb-1">
            상품 관리
          </span>
          {visibleMenu.slice(0, 3).map(({ name, href, currentPage }) => {
            const isActive = pathname.startsWith(currentPage);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`block px-4 py-2 transition-colors duration-150  ${
                    isActive
                      ? "bg-gray-600 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {name}
                </Link>
              </li>
            );
          })}

          <div className="my-3 px-2">
            <div className="w-full border-t border-dashed border-gray-300" />
          </div>

          <span className="text-[13px] font-semibold text-gray-500 px-2 mt-1 mb-1">
            고객 및 주문
          </span>
          {visibleMenu.slice(3).map(({ name, href, currentPage }) => {
            const isActive = pathname.startsWith(currentPage);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`block px-4 py-2 transition-colors duration-150  ${
                    isActive
                      ? "bg-gray-600 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 pt-4 border-t">
          <Link
            href="/mypage/profile"
            className="text-xs text-gray-500 uppercase flex items-center gap-2 hover:text-red-400 px-2"
          >
            <User size={14} />내 정보 메뉴 이동
          </Link>
        </div>
      </div>
    </nav>
  );
}
