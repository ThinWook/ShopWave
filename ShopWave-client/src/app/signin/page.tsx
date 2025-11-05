import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/components/auth/AuthLayout";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <>
      <PageMeta title={"Đăng nhập | ShopWave"} description={"Đăng nhập để mua sắm cùng ShopWave."} />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
