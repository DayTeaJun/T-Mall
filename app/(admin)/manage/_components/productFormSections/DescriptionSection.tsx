"use client";

import { Fields, FieldsOnChange } from "@/hooks/useProductFormFields";

interface Props {
  fields: Fields;
  onChange: FieldsOnChange;
}

export default function DescriptionSection({ fields, onChange }: Props) {
  return (
    <div className="bg-white p-6 border border-gray-200 flex flex-col flex-1 space-y-4">
      <h3 className="font-semibold text-gray-800 border-b pb-2">
        상세 설명
        <span className="text-red-500 pl-1">*</span>
      </h3>
      <textarea
        value={fields.description}
        onChange={(e) => onChange("description", e.target.value)}
        className="w-full flex-1 border border-gray-300 p-3 text-sm focus:outline-none resize-none"
        placeholder="상품 상세 설명을 입력하세요."
      />
    </div>
  );
}
