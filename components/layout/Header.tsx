import { Headset, Settings, SquareUserRound, Store, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import SignOutBtn from "../common/buttons/SignOutBtn";
import { UserType } from "@/types/user";
import CartLinkBtn from "../common/buttons/CartLinkBtn";
import SearchInput from "../common/SearchInput";
import SearchInput_M from "../common/SearchInput_M";
import CategoryDropdown_M from "../common/CategoryDropdown_M";
import CategoryDropdown from "../common/CategoryDropdown";
import SignInBtn from "../common/buttons/SignInBtn";

async function Header({ user }: { user: UserType | null }) {
  return (
    <header className="w-full fixed top-0 left-0 border-b-2 border-gray-100 bg-white z-50">
      <div className="w-full flex flex-col">
        <div className="w-full bg-gray-100 pr-4 sm:px-0">
          <div className="w-full max-w-7xl mx-auto flex items-center gap-4 h-10 justify-end sm:px-8">
            <CategoryDropdown_M />
            <h1 className="mr-auto text-green-600 text-[14px] sm:hidden">
              <Link href="/" className="text-green-600 font-bold">
                T-Mall
              </Link>
            </h1>

            {user ? (
              <>
                <SignOutBtn />

                <Link
                  href={`/mypage`}
                  className="text-black sm:flex gap-1 items-center hidden"
                >
                  <p className="text-[12px] sm:text-[14px]">마이페이지</p>
                  <User size={16} />
                </Link>

                {user.level === 3 && (
                  <Link
                    href="/manage/dashboard"
                    className="text-black sm:flex gap-1 items-center hidden"
                  >
                    <p className="text-[12px] sm:text-[14px]">관리자</p>
                    <Settings size={16} />
                  </Link>
                )}

                {user.level === 2 && (
                  <Link
                    href="/manage/dashboard"
                    className="text-black sm:flex gap-1 items-center hidden"
                  >
                    <p className="text-[12px] sm:text-[14px]">판매자</p>
                    <Store size={16} />
                  </Link>
                )}
              </>
            ) : (
              <>
                <SignInBtn />
                <Link
                  href="/signup"
                  className="text-black flex gap-1 items-center"
                >
                  <p className="text-[12px] sm:text-[14px]">회원가입</p>
                  <SquareUserRound size={16} className="hidden sm:block" />
                </Link>
              </>
            )}

            <Link
              href="/inquiry"
              className="text-black flex gap-1 items-center"
            >
              <p className="text-[12px] sm:text-[14px]">고객센터</p>
              <Headset size={16} className="hidden sm:block" />
            </Link>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto py-2 px-4 sm:px-8 flex items-center h-14 justify-between bg-white">
          <div className="flex gap-5 items-center">
            <h1 className="text-green-600 text-2xl sm:block hidden">
              <Link href="/" className="text-green-600 font-bold">
                T-Mall
              </Link>
            </h1>
            <CategoryDropdown />
          </div>
          <nav className="flex gap-4 items-center justify-between w-full sm:w-auto sm:ml-auto">
            <div className="sm:hidden w-full">
              <SearchInput_M />
            </div>
            <div className="hidden sm:block">
              <SearchInput />
            </div>

            <div className="hidden sm:block flex-shrink-0">
              <CartLinkBtn />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
