import React from "react";
import SalesLineChart from "./_components/SalesStatusChart";
import CategoryPieChart from "./_components/CategoriStatusChart";
import LatestOrderLists from "./_components/LatestOrderLists";
import SalesStatus from "./_components/SalesStatus";

function page() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">대시보드</h2>

      <div className="w-full min-h-screen bg-gray-50">
        <section className="w-full flex flex-col sm:grid grid-cols-4 gap-4 p-4">
          <SalesStatus />
        </section>

        <section className="w-full flex sm:flex-row flex-col gap-4 p-4">
          <SalesLineChart />

          <CategoryPieChart />
        </section>

        <section className="w-full p-4">
          <LatestOrderLists />
        </section>
      </div>
    </div>
  );
}

export default page;
