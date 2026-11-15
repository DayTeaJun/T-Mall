import React from "react";
import PasswordForm from "./_components/PasswordForm";

function ResetPasswordPage() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">비밀번호 재설정</h2>
      <PasswordForm />
    </section>
  );
}

export default ResetPasswordPage;
