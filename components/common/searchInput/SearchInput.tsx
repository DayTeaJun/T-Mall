"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function SearchInput() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      toast.info("검색어를 입력해주세요.");
      return;
    }
    router.push(`/search?query=${encodeURIComponent(searchQuery)}&page=1`);
  };

  return (
    <div
      className={`flex items-center h-10 rounded-2xl ring-1 transition-all duration-300 ease-in-out bg-transparent ${
        isOpen ? "ring-gray-300 px-3 pl-1 w-100" : "ring-transparent px-1 w-10"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
          } else if (searchQuery.trim() !== "") {
            handleSearch();
          }
        }}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition cursor-pointer shrink-0"
        aria-label="검색"
      >
        <Search className="w-5 h-5 text-gray-700" />
      </button>

      <div
        className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 w-full ml-2"
            : "opacity-0 w-0 pointer-events-none"
        }`}
      >
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          type="text"
          placeholder="검색어를 입력해주세요."
          className="bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm w-full"
          autoFocus={isOpen}
        />

        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setIsOpen(false);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-1 shrink-0"
          aria-label="검색 닫기"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default SearchInput;
