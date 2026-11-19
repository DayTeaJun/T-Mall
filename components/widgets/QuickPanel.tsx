"use client";

import { usePathname } from "next/navigation";
import SideQuickMenu from "@/app/_components/SideQuickMenu";

function QuickPanel() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "") return null;

  return (
    <aside className="hidden 2xl:block fixed top-50 right-[calc((100vw-80rem)/2-7rem)] w-28 z-40">
      <SideQuickMenu />
    </aside>
  );
}

export default QuickPanel;
