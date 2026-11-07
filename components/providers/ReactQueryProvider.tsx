"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 너무 실패를 무시하지 않게 1회 정도 재시도
      staleTime: 5 * 60 * 1000, // 데이터는 5분 정도 fresh
      gcTime: 10 * 60 * 1000, // 메모리 캐시는 10분 정도 유지
      refetchOnWindowFocus: false, // 창 전환시 refetch 비활성화
    },
  },

  // 전역 에러 관리
  queryCache: new QueryCache({
    onError: (_, query) => {
      if (query.meta && query.meta.errorMessage) {
        toast.error(query.meta.errorMessage as string);
      }
    },
  }),
});

export default function ReactQueryClientProvider({
  children,
}: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
