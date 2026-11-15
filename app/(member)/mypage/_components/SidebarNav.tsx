"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, UserCog, Menu, MonitorCog } from "lucide-react";
import { UserType } from "@/types/user";

interface Props {
  user: UserType | null;
}

const menuGroups = [
  {
    label: "내 정보",
    items: [
      {
        name: "내 정보",
        currentPage: "/mypage/profile",
        href: "/mypage/profile",
      },
      {
        name: "배송지 관리",
        currentPage: "/mypage/delivery",
        href: "/mypage/delivery",
      },
    ],
  },
  {
    label: "주문·쇼핑",
    items: [
      {
        name: "장바구니",
        currentPage: "/mypage/my-cart",
        href: "/mypage/my-cart",
      },
      {
        name: "주문 내역",
        currentPage: "/mypage/order-list",
        href: "/mypage/order-list?page=1",
      },
    ],
  },
  {
    label: "혜택",
    items: [
      {
        name: "쿠폰함",
        currentPage: "/mypage/coupon",
        href: "/mypage/coupon",
      },
    ],
  },
  {
    label: "활동",
    items: [
      {
        name: "찜 목록",
        currentPage: "/mypage/bookmark",
        href: "/mypage/bookmark",
      },
      {
        name: "리뷰 관리",
        currentPage: "/mypage/review",
        href: "/mypage/review",
      },
    ],
  },
  {
    label: "문의",
    items: [
      {
        name: "문의 관리",
        currentPage: "/mypage/inquiry",
        href: "/mypage/inquiry",
      },
    ],
  },
];

const menu = menuGroups.flatMap((group) => group.items);

export default function SidebarNav({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

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

            {user ? (
              <p className="text-xs text-gray-500 px-1 flex items-center gap-2 font-bold">
                <User size={14} />
                <span className="text-green-600">{user.user_name}</span> 님
              </p>
            ) : (
              <div className="h-[6px] mt-2" />
            )}
          </div>
        </div>

        <ul
          id="mypage-nav-list"
          className={`absolute mt-2 w-full bg-white z-50 overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            open ? "border-b border-t" : "max-h-0"
          }`}
        >
          {menu.map(({ name, href, currentPage }) => {
            const isActive = pathname.startsWith(currentPage);
            return (
              <li key={href} className="border-b last:border-b-0">
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 transition-colors duration-150 ${
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

          {user?.level === 3 && (
            <div className="border-b last:border-b-0 py-3">
              <Link
                href="/manage/dashboard"
                className="text-xs text-gray-500 flex items-center gap-2 hover:text-red-400 px-1"
              >
                <UserCog size={14} />
                관리자 메뉴 이동
              </Link>
            </div>
          )}
        </ul>
      </div>

      <div className="hidden md:block">
        {user ? (
          <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2 border-b-2 border-gray-400 pb-2 pr-2 w-fit font-bold">
            <User size={16} />
            <span className="text-green-600">{user.user_name}</span> 님
          </p>
        ) : (
          <div className="h-[12px] pb-2" />
        )}

        <ul className="flex flex-col gap-1.5 mt-5">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.label} className="contents">
              <span
                className={`text-[13px] font-semibold text-gray-500 px-2 mb-1 ${
                  groupIndex > 0 ? "mt-4" : "mt-1"
                }`}
              >
                {group.label}
              </span>
              {group.items.map(({ name, href, currentPage }) => {
                const isActive = pathname.startsWith(currentPage);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block px-4 py-2 transition-colors duration-150 ${
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
            </div>
          ))}
        </ul>

        {user?.level === 3 ? (
          <div className="mt-6 pt-4 border-t">
            <Link
              href="/manage/dashboard"
              className="text-xs text-gray-500 uppercase flex items-center gap-2 hover:text-red-400 px-2"
            >
              <UserCog size={14} />
              관리자 메뉴 이동
            </Link>
          </div>
        ) : user?.level === 2 ? (
          <div className="mt-6 pt-4 border-t">
            <Link
              href="/manage/dashboard"
              className="text-xs text-gray-500 uppercase flex items-center gap-2 hover:text-red-400 px-2"
            >
              <MonitorCog size={14} />
              판매자 메뉴 이동
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
