"use client";

import useDebounce from "@/hooks/useDebounce";
import { User } from "lucide-react";
import React, { useEffect } from "react";
import { USERNAME_REGEX } from "../../constants";

interface Props {
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setUsernameValid: React.Dispatch<React.SetStateAction<string>>;
}

function ValidUsername({ username, setUsername, setUsernameValid }: Props) {
  const debounceUsername = useDebounce<string>(username);

  useEffect(() => {
    const validateUsername = async () => {
      if (debounceUsername.length === 0) {
        setUsernameValid("");
        return;
      }

      if (!USERNAME_REGEX.test(debounceUsername)) {
        setUsernameValid("최소 2글자 이상 20자 미만의 닉네임을 입력해주세요.");
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/check-username?name=${encodeURIComponent(
            debounceUsername.trim(),
          )}`,
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("닉네임 확인 실패:", res.status, text);
          setUsernameValid(
            "닉네임 확인 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          );
          return;
        }

        const { exists } = await res.json();

        if (exists) {
          setUsernameValid("중복된 사용자명입니다.");
        } else {
          setUsernameValid("사용 가능한 사용자명입니다.");
        }
      } catch (error) {
        console.error("닉네임 확인 중 오류:", error);
        setUsernameValid(
          "닉네임 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        );
      }
    };

    validateUsername();
  }, [debounceUsername, setUsernameValid]);

  return (
    <div className="flex gap-2 items-center border border-gray-100">
      <label htmlFor="username" className="bg-gray-50 p-3">
        <User size={20} className="text-gray-400" />
      </label>
      <input
        id="username"
        placeholder="사용자명"
        className="border-none outline-0 px-2 w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
    </div>
  );
}

export default ValidUsername;
