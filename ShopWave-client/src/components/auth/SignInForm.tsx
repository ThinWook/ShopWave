"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const GoogleButton = dynamic(() => import("./GoogleButton"), {
  ssr: false,
  loading: () => <div className="h-10 w-full" />,
});

const schema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ").max(255),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const search = useSearchParams();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: "", password: "", remember: false }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { user } = await api.auth.login(values.email, values.password);
      const from = search.get("from");
      if (from) {
        router.replace(from);
        return;
      }
  router.replace("/profile");
    } catch (e: any) {
      const fe = e?.fieldErrors?.[0];
      const code = (fe?.code || e?.code || "").toString().toUpperCase();
      let msg = fe?.message || e?.message || "Đăng nhập thất bại";
      if (e?.status === 401 || code.includes("INVALID_CREDENTIALS")) {
        msg = "Email hoặc mật khẩu không đúng";
      } else if (code.includes("EMAIL_NOT_VERIFIED") || code.includes("USER_NOT_ACTIVE")) {
        msg = "Tài khoản chưa được xác minh hoặc đang bị khóa";
      }
      setError("password", { message: msg });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-5 sm:mb-8">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Nhập email và mật khẩu để đăng nhập!</p>
      </div>

      <div className="auth-space-y">
        <GoogleButton />

        <div className="relative">
          <div className="auth-divider" />
          <span className="auth-divider-text">Hoặc</span>
        </div>

        <form className="auth-space-y" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="info@gmail.com" className="auth-input mt-2" aria-invalid={!!errors.email || undefined} {...register("email")} />
            {errors.email && <div className="auth-error">{errors.email.message}</div>}
          </div>

          <div className="relative">
            <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu của bạn" className="auth-input mt-2 pr-10" aria-invalid={!!errors.password || undefined} {...register("password")} />
            <button type="button" aria-label="Toggle password" className="auth-input-icon" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                // eye open
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                // eye off
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.31 18.31 0 0 1 5.06-6.94"/><path d="M1 1l22 22"/><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/><path d="M14.12 9.88A3 3 0 0 0 9.88 14.12"/></svg>
              )}
            </button>
            {errors.password && <div className="auth-error mt-2">{errors.password.message}</div>}
          </div>

          <div className="flex items-center justify-between">
            <label className="auth-check">
              <Checkbox {...register("remember")} />
              <span>Duy trì đăng nhập</span>
            </label>
            <Link href="/reset-password" className="auth-link">Quên mật khẩu?</Link>
          </div>

          <Button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang xử lý…" : "Đăng nhập"}</Button>
        </form>

        <p className="text-sm text-muted-foreground mt-3 text-center sm:text-left">
          Chưa có tài khoản? <Link className="auth-link" href="/signup">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}
