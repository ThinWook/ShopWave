"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

// Lazy-load Google OAuth button to keep @react-oauth/google out of non-auth bundles
const GoogleButton = dynamic(() => import("./GoogleButton"), {
  ssr: false,
  loading: () => <div className="h-10 w-full" />,
});

const schema = z.object({
  fname: z.string().min(1, "Vui lòng nhập họ").max(255),
  lname: z.string().min(1, "Vui lòng nhập tên").max(255),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ").max(255),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  agree: z.boolean().refine(v => v === true, { message: "Bạn cần đồng ý Điều khoản & Chính sách" }),
  phone: z.string().max(20).optional().or(z.literal("")).transform(v => v || undefined),
});

type FormValues = z.infer<typeof schema>;

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { control, register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { fname: "", lname: "", email: "", password: "", agree: false, phone: "" },
  });

  const onSubmit = async (v: FormValues) => {
    try {
      const fullName = `${v.fname} ${v.lname}`.trim();
      const { user } = await api.auth.register({ email: v.email, fullName, phone: v.phone, password: v.password });

      // Chính sách: không tự động đăng nhập sau khi đăng ký. Yêu cầu đăng nhập lại thủ công.
      await api.auth.logout().catch(() => {});
      router.replace("/signin");
    } catch (e: any) {
      const fe = e?.fieldErrors?.[0];
      if (fe?.field === 'email') setError('email', { message: fe.message });
      else setError('password', { message: e?.message || 'Đăng ký thất bại' });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-5 sm:mb-8">
        <h1 className="auth-title">Đăng ký</h1>
        <p className="auth-subtitle">Nhập email và mật khẩu để đăng ký!</p>
      </div>

      <div className="auth-space-y-lg">
        <GoogleButton />

        <div className="relative">
          <div className="auth-divider" />
          <span className="auth-divider-text">Hoặc</span>
        </div>

        <form className="auth-space-y-lg" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fname">Họ <span className="text-destructive">*</span></Label>
              <Input id="fname" placeholder="Nhập họ của bạn" className="auth-input mt-2" aria-invalid={!!errors.fname || undefined} {...register("fname")} />
              {errors.fname && <div className="auth-error">{errors.fname.message}</div>}
            </div>
            <div>
              <Label htmlFor="lname">Tên <span className="text-destructive">*</span></Label>
              <Input id="lname" placeholder="Nhập tên của bạn" className="auth-input mt-2" aria-invalid={!!errors.lname || undefined} {...register("lname")} />
              {errors.lname && <div className="auth-error">{errors.lname.message}</div>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="Nhập email của bạn" className="auth-input mt-2" aria-invalid={!!errors.email || undefined} {...register("email")} />
            {errors.email && <div className="auth-error">{errors.email.message}</div>}
          </div>

          <div className="relative">
            <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu của bạn" className="auth-input mt-2 pr-10" aria-invalid={!!errors.password || undefined} {...register("password")} />
            <button type="button" aria-label="Toggle password" className="auth-input-icon" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.31 18.31 0 0 1 5.06-6.94"/><path d="M1 1l22 22"/><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/><path d="M14.12 9.88A3 3 0 0 0 9.88 14.12"/></svg>
              )}
            </button>
            {errors.password && <div className="auth-error mt-2">{errors.password.message}</div>}
            {!errors.password && (
              <p className="text-xs text-muted-foreground mt-2">Mật khẩu tối thiểu 8 ký tự.</p>
            )}
          </div>

          <label className="auth-check">
            <Controller
              name="agree"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
              )}
            />
            <span>
              Việc tạo tài khoản đồng nghĩa bạn đồng ý với <span className="font-medium">Điều khoản & Điều kiện</span>, và <span className="font-medium">Chính sách bảo mật</span>
            </span>
          </label>
          {errors.agree && <div className="auth-error">{errors.agree.message as string}</div>}

          <button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang xử lý…" : "Đăng ký"}</button>
        </form>

        <p className="text-sm text-muted-foreground mt-3 text-center sm:text-left">
          Đã có tài khoản? <Link className="auth-link" href="/signin">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
