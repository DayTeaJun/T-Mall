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

export function useProductFormFields(initialProduct?: InitialProduct) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );

  const [price, setPrice] = useState(
    initialProduct
      ? String(initialProduct.original_price ?? initialProduct.price)
      : "",
  );

  const [discountType, setDiscountType] = useState<
    "" | "percentage" | "fixed"
  >((initialProduct?.discount_type as "" | "percentage" | "fixed") || "");

  const [discountValue, setDiscountValue] = useState(
    initialProduct?.discount_value != null
      ? String(initialProduct.discount_value)
      : "",
  );

  const [tags, setTags] = useState((initialProduct?.tags ?? []).join(", "));
  const [category, setCategory] = useState(initialProduct?.category ?? "");
  const [subcategory, setSubcategory] = useState(
    initialProduct?.subcategory ?? "",
  );
  const [gender, setGender] = useState(initialProduct?.gender ?? "");
  const [color, setColor] = useState(initialProduct?.color ?? "");

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
    setSubcategory("");
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
    name,
    setName,
    description,
    setDescription,
    price,
    setPrice,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    tags,
    setTags,
    category,
    handleCategoryClick,
    subcategory,
    setSubcategory,
    gender,
    setGender,
    color,
    setColor,
    selectedSizes,
    handleSizeToggle,
    stockBySize,
    handleStockChange,
    singleStock,
    setSingleStock,
  };
}
