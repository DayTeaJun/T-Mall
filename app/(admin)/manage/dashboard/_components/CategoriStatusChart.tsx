"use client";

import { useGetCategorySales } from "@/lib/queries/admin";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  LegendItem,
  TooltipItem,
} from "chart.js";
import { Loader2 } from "lucide-react";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDataItem {
  label: string;
  value: number;
}

export default function CategoryPieChart() {
  const { data: salesData, isLoading } = useGetCategorySales();

  // 데이터 추출
  const labels = salesData?.map((item: CategoryDataItem) => item.label) || [];
  const values = salesData?.map((item: CategoryDataItem) => item.value) || [];
  const totalSum = values.reduce((a, b) => a + b, 0);

  const data: ChartData<"doughnut"> = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#1e293b",
          "#334155",
          "#475569",
          "#64748b",
          "#94a3b8",
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          generateLabels: (chart): LegendItem[] => {
            const chartData = chart.data;
            return (
              chartData.labels?.map((label, i): LegendItem => {
                const val = chartData.datasets[0].data[i] as number;
                const pct =
                  totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : "0";
                return {
                  text: `${label} (${pct}%)`,
                  fillStyle: (
                    chartData.datasets[0].backgroundColor as string[]
                  )[i],
                  index: i,
                  hidden: !chart.isDatasetVisible(0),
                };
              }) || []
            );
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"doughnut">) => {
            const val = context.raw as number;
            const pct =
              totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : "0";
            return ` ${context.label}: ${val.toLocaleString()}원 (${pct}%)`;
          },
        },
      },
    },
    cutout: "70%",
  };

  return (
    <div className="w-full sm:w-[30%] h-max-[344px] bg-white p-4 flex flex-col gap-4">
      <p className="text-[16px] font-bold text-slate-800">
        카테고리별 판매 비율
      </p>
      <div className="h-[250px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-300" size={32} />
          </div>
        ) : salesData && salesData.length > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            판매 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
