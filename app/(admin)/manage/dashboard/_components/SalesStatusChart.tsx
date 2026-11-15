"use client";

import { useGetWeekSalesAction } from "@/lib/queries/admin";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  ChartOptions,
} from "chart.js";
import { Loader2 } from "lucide-react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
);

interface SalesDataItem {
  label: string;
  value: number;
}

export default function SimpleLineChart() {
  const { data: salesData, isLoading } = useGetWeekSalesAction();

  const labels = salesData?.map((item: SalesDataItem) => item.label) || [];
  const dataPoints = salesData?.map((item: SalesDataItem) => item.value) || [];

  const chartData = {
    labels,
    datasets: [
      {
        label: "매출액",
        data: dataPoints,
        borderColor: "#000000",
        borderWidth: 1.5,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "#000000",
        fill: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `매출: ${context.parsed.y?.toLocaleString()}원`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#64748b",
          callback: (value) => `${Number(value).toLocaleString()}원`,
        },
      },
    },
  };

  return (
    <div className="w-full sm:w-[calc(70%-16px)] bg-white p-4 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <p className="text-16 font-bold">최근 매출 추이</p>
        <span className="text-xs text-slate-400">최근 7건 기준</span>
      </div>
      <div className="min-h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-300" size={32} />
          </div>
        ) : !isLoading && (!salesData || salesData.length === 0) ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p>최근 주문 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="h-64">
            <Line key={labels.length} data={chartData} options={options} />
          </div>
        )}
      </div>
    </div>
  );
}
