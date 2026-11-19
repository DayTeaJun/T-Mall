"use client";

import { ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";

const SCROLL_SHOW_THRESHOLD = 300; // 이 정도(px) 이상 스크롤해야 버튼이 보임

function TopBtn({ compact = false }: { compact?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_SHOW_THRESHOLD);
    };
    handleScroll(); // 마운트 시점 스크롤 위치 반영
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo(0, 0)}
      type="button"
      className={`bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center ${
        compact ? "p-1.5" : "p-3 shadow-md"
      }`}
    >
      <ChevronUp size={compact ? 16 : 22} strokeWidth="2.5px" />
    </button>
  );
}

export default TopBtn;
