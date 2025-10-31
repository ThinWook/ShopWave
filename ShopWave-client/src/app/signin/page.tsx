import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/components/auth/AuthLayout";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <>
      <PageMeta title={"Đăng nhập | Bảng điều khiển quản trị"} description={"Đăng nhập để truy cập bảng điều khiển quản trị."} />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
