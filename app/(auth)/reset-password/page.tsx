import Link from "next/link";
import ResetPasswordForm from "./_components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <>
      <p className="text-[32px] font-bold">Reset your password</p>

      <p className="text-[13px] text-gray-500">
        변경할 비밀번호를 입력해주세요.
      </p>

      <ResetPasswordForm />

      <Link href="/signin" className="text-[14px] cursor-pointer underline">
        Cancel
      </Link>
    </>
  );
}

export default ResetPasswordPage;
