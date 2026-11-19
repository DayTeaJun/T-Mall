"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import ChattingBtn from "./ChattingBtn";
import TopBtn from "./TopBtn";

function FloatingToolWidget() {
  const { user } = useAuthStore();

  return (
    <div className="hidden sm:flex fixed bottom-5 right-5 z-50 items-center gap-4">
      <TopBtn />
      {user && <ChattingBtn />}
    </div>
  );
}

export default FloatingToolWidget;
