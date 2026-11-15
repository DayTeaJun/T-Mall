"use client";

import { useGetDashboardStatusQuery } from "@/lib/queries/admin";
import {
  HandCoins,
  ShoppingBag,
  TriangleAlert,
  UserPlus,
  Loader2,
} from "lucide-react";
import React from "react";

interface DashboardStats {
  totalSales: number;
  orderCount: number;
  lowStockCount: number;
  newUserCount?: number;
}

function SalesStatus() {
  const { data, isLoading } = useGetDashboardStatusQuery();

  if (isLoading) {
    return (
      <div className="min-h-[520px] sm:min-h-[110px] col-span-4 flex justify-center items-center bg-white border border-gray-100">
        <Loader2 className="animate-spin text-gray-300" size={32} />
      </div>
    );
  }

  const stats: DashboardStats = data || {
    totalSales: 0,
    orderCount: 0,
    lowStockCount: 0,
    newUserCount: 0,
  };

  return (
    <>
      <div className="min-h-[110px] col-span-1 bg-white p-4 flex flex-col gap-1 rounded border border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-400">누적 매출</p>
          <div className="p-1 bg-gray-100 rounded-full">
            <HandCoins className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <p className="text-[17px] font-bold text-gray-900">
          ₩ {stats.totalSales.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-gray-400">전체 결제 완료 기준</p>
        </div>
      </div>

      <div className="col-span-1 bg-white p-4 flex flex-col gap-1 rounded border border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-400">전체 주문</p>
          <div className="p-1 bg-gray-100 rounded-full">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <p className="text-[17px] font-bold text-gray-900">
          {stats.orderCount.toLocaleString()}건
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-gray-400">누적 주문 데이터</p>
        </div>
      </div>

      <div className="col-span-1 bg-white p-4 flex flex-col gap-1 rounded border border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-400">신규 고객</p>
          <div className="p-1 bg-gray-100 rounded-full">
            <UserPlus className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <p className="text-[17px] font-bold text-gray-900">
          {stats.newUserCount?.toLocaleString() || "0"}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-gray-400">최근 24시간 기준</p>
        </div>
      </div>

      <div className="col-span-1 bg-white p-4 flex flex-col gap-1 rounded border border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-400">재고 부족</p>
          <div className="p-1 bg-gray-100 rounded-full">
            <TriangleAlert className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <p className="text-[17px] font-bold text-red-500">
          {stats.lowStockCount.toLocaleString()}개
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-gray-400">재고 5개 미만 품목</p>
        </div>
      </div>
    </>
  );
}

export default SalesStatus;
