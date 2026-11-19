import React, { useState } from "react";
import PrivacyComponent from "../../../../app/(anon)/policy/_components/PrivacyComponent";

const PrivacyModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <div className="text-14 border-b border-solid border-gray-300">
      <button className="" onClick={openModal} type="button">
        (보기)
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black/50 z-50"
          onClick={closeModal}
        >
          <div
            className="flex flex-col justify-between bg-white rounded-lg shadow-lg w-[90%] lg:w-[50%] h-[60%] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">개인정보처리방침</h2>
            <div className="overflow-y-auto h-[80%] p-3 mb-4 text-sm text-gray-700 border-t border-solid border-gray-200">
              <PrivacyComponent />
            </div>
            <div className="flex justify-end mt-2 border-t border-solid border-gray-200">
              <button
                className="py-2 text-16 sm:text-20 text-black hover:bg-gray-100 px-4 rounded"
                onClick={closeModal}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyModal;
