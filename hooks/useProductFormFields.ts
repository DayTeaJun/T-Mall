import { useState } from "react";
import { Json } from "@/lib/config/supabase/types_db";
import { SIZE_OPTIONS_MAP } from "@/lib/constants/categories";

// ProductForm.tsx(등록)/EditProductForm.tsx(수정)가 거의 그대로 중복해서
// 들고 있던 기본정보/재고 state + 핸들러 3개를 뽑아낸 공용 훅.
// initialProduct가 있으면 그 값으로, 없으면 빈 값으로 초기화한다.
interface InitialProduct {
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
  tags: string[] | null;
  category: string | null;
  subcategory: string | null;
  gender: string | null;
  color: string | null;
  stock_by_size: Json | null;
  total_stock: number | null;
}

interface Fields {
  name: string;
  description: string;
  price: string;
  discountType: "" | "percentage" | "fixed";
  discountValue: string;
  tags: string;
  subcategory: string;
  gender: string;
  color: string;
}

export function useProductFormFields(initialProduct?: InitialProduct) {
  const [fields, setFields] = useState<Fields>({
    name: initialProduct?.name ?? "",
    description: initialProduct?.description ?? "",
    price: initialProduct
      ? String(initialProduct.original_price ?? initialProduct.price)
      : "",
    discountType:
      (initialProduct?.discount_type as "" | "percentage" | "fixed") || "",
    discountValue:
      initialProduct?.discount_value != null
        ? String(initialProduct.discount_value)
        : "",
    tags: (initialProduct?.tags ?? []).join(", "),
    subcategory: initialProduct?.subcategory ?? "",
    gender: initialProduct?.gender ?? "",
    color: initialProduct?.color ?? "",
  });

  const onChange = <K extends keyof Fields>(field: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const [category, setCategory] = useState(initialProduct?.category ?? "");

  const initialStock =
    (initialProduct?.stock_by_size as Record<string, number>) || {};
  const initialHasSizes = initialProduct?.category
    ? (SIZE_OPTIONS_MAP[initialProduct.category]?.length || 0) > 0
    : Object.keys(initialStock).length > 0 && !initialStock["FREE"];

  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialHasSizes ? Object.keys(initialStock) : [],
  );
  const [stockBySize, setStockBySize] = useState<Record<string, number>>(
    initialHasSizes ? initialStock : {},
  );
  const [singleStock, setSingleStock] = useState<number>(
    initialHasSizes
      ? 0
      : initialStock["FREE"] || initialProduct?.total_stock || 0,
  );

  const handleCategoryClick = (newCategory: string) => {
    setCategory(newCategory);
    setFields((prev) => ({ ...prev, subcategory: "" }));
    setSelectedSizes([]);
    setStockBySize({});
    setSingleStock(0);
  };

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
      const newStock = { ...stockBySize };
      delete newStock[size];
      setStockBySize(newStock);
    } else {
      setSelectedSizes([...selectedSizes, size]);
      setStockBySize({ ...stockBySize, [size]: 0 });
    }
  };

  const handleStockChange = (size: string, value: number) => {
    setStockBySize({ ...stockBySize, [size]: value });
  };

  return {
    fields,
    onChange,
    category,
    handleCategoryClick,
    selectedSizes,
    handleSizeToggle,
    stockBySize,
    handleStockChange,
    singleStock,
    setSingleStock,
  };
}
