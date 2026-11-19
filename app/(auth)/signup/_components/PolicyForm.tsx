import PrivacyModal from "@/components/common/modal/policy/PrivacyModal";
import TermsModal from "@/components/common/modal/policy/TermsModal";
import React, { useState } from "react";

function PolicyForm({
  agreements,
  setAgreements,
}: {
  agreements: { terms: boolean; privacy: boolean };
  setAgreements: React.Dispatch<
    React.SetStateAction<{ terms: boolean; privacy: boolean }>
  >;
}) {
  const [allChecked, setAllChecked] = useState(false);

  const handleAllCheck = () => {
    const newState = !allChecked;
    setAllChecked(newState);
    setAgreements({
      terms: newState,
      privacy: newState,
    });
  };
  const handleIndividualCheck = (key: keyof typeof agreements) => {
    const updatedState = {
      ...agreements,
      [key]: !agreements[key],
    };
    setAgreements(updatedState);
    setAllChecked(Object.values(updatedState).every((v) => v));
  };

  return (
    <div className="flex flex-col my-6 gap-6 font-medium">
      <p className="text-[18px] flex gap-2 items-center">
        <span className="w-2 h-2 bg-green-600 rounded-full" />
        약관 동의
      </p>
      <label className="flex gap-2 items-center cursor-pointer">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={handleAllCheck}
          className="cursor-pointer"
        />
        <p>전체동의</p>
      </label>
      <div className="w-full h-[1px] bg-gray-300 -mt-3" />

      <div className="flex gap-2 items-center">
        <label className="flex gap-2 items-center cursor-pointer">
          <input
            type="checkbox"
            checked={agreements.terms}
            onChange={() => handleIndividualCheck("terms")}
            className="cursor-pointer"
          />
          <p className="flex gap-2">
            이용약관 <span className="text-green-600">(필수)</span>
          </p>
        </label>
        <TermsModal />
      </div>

      {/* 개인정보처리방침 동의 */}
      <div className="flex gap-2 items-center">
        <label className="flex gap-2 items-center cursor-pointer">
          <input
            type="checkbox"
            checked={agreements.privacy}
            onChange={() => handleIndividualCheck("privacy")}
            className="cursor-pointer"
          />
          <p className="flex gap-2">
            개인정보처리방침 <span className="text-green-600">(필수)</span>
          </p>
        </label>
        <PrivacyModal />
      </div>
    </div>
  );
}

export default PolicyForm;
