import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/components/auth/AuthLayout";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <>
      <PageMeta title={"Đăng ký | Bảng điều khiển quản trị"} description={"Tạo tài khoản để bắt đầu sử dụng bảng điều khiển quản trị."} />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
