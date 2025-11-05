import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/components/auth/AuthLayout";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <>
      <PageMeta title={"Đăng ký | ShopWave"} description={"Tạo tài khoản để mua sắm cùng ShopWave."} />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
