export default function Loading() {
  return (
    <main className="max-w-7xl mt-12 mx-auto p-4 sm:p-8 sm:py-12 flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className="col-span-1">
          <div className="aspect-square w-full rounded-sm bg-[#f4f4f4] animate-pulse" />
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col justify-between w-full">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-24 rounded-sm bg-gray-100 animate-pulse" />

            <div className="flex items-center justify-between gap-4">
              <div className="h-8 w-2/3 rounded-sm bg-gray-200 animate-pulse" />
              <div className="flex gap-2 shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
              </div>
            </div>

            <hr className="my-2" />

            <div className="flex flex-col gap-2">
              <div className="h-7 w-32 rounded-sm bg-gray-200 animate-pulse" />
              <div className="h-4 w-48 rounded-sm bg-gray-100 animate-pulse" />
            </div>

            <hr className="my-2" />

            <div className="flex flex-col gap-2">
              <div className="h-4 w-full rounded-sm bg-gray-100 animate-pulse" />
              <div className="h-4 w-full rounded-sm bg-gray-100 animate-pulse" />
              <div className="h-4 w-3/4 rounded-sm bg-gray-100 animate-pulse" />
            </div>
          </div>

          <hr className="my-4" />

          <div className="flex flex-col gap-4">
            {/* 사이즈 선택 */}
            <div className="flex flex-col gap-2">
              <div className="h-4 w-16 rounded-sm bg-gray-100 animate-pulse" />
              <div className="h-10 w-full rounded-sm bg-gray-100 animate-pulse" />
            </div>

            {/* 수량 + 장바구니/바로구매 */}
            <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row justify-between items-end">
              <div className="w-full sm:w-1/3 flex flex-col gap-2">
                <div className="h-4 w-10 rounded-sm bg-gray-100 animate-pulse" />
                <div className="h-10 w-full rounded-sm bg-gray-100 animate-pulse" />
              </div>

              <div className="flex gap-2 w-full sm:w-2/3">
                <div className="flex-1 h-10 rounded-sm bg-gray-200 animate-pulse" />
                <div className="flex-1 h-10 rounded-sm bg-gray-200 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-around border-b border-gray-100 pb-3">
        <div className="h-6 w-20 rounded-sm bg-gray-200 animate-pulse" />
        <div className="h-6 w-20 rounded-sm bg-gray-100 animate-pulse" />
        <div className="h-6 w-20 rounded-sm bg-gray-100 animate-pulse" />
      </div>

      <div className="h-[420px] w-full rounded-sm bg-[#f4f4f4] animate-pulse" />
    </main>
  );
}
