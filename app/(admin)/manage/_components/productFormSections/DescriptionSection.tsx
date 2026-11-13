"use client";

interface Props {
  description: string;
  onDescriptionChange: (value: string) => void;
}

export default function DescriptionSection({
  description,
  onDescriptionChange,
}: Props) {
  return (
    <div className="bg-white p-6 border border-gray-200 flex flex-col flex-1 space-y-4">
      <h3 className="font-semibold text-gray-800 border-b pb-2">
        상세 설명
        <span className="text-red-500 pl-1">*</span>
      </h3>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="w-full flex-1 border border-gray-300 p-3 text-sm focus:outline-none resize-none"
        placeholder="상품 상세 설명을 입력하세요."
      />
    </div>
  );
}
