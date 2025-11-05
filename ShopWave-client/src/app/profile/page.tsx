"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserIcon, Settings, LogOut, ShoppingBag, Heart, Mail, Phone, Shield } from "lucide-react";
import { api, type UserDto } from "@/lib/api";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  useRequireAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.auth.me();
        if (!alive) return;
        setUser(me);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message || "Không thể tải thông tin người dùng";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const initials = useMemo(() => {
    const name = user?.fullName?.trim() || user?.email || "U";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  }, [user]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "";
    try {
      return new Date(user.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return user.createdAt;
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      // Best-effort clear any auxiliary cookie the app might use
      fetch("/api/logout").catch(() => {});
      router.replace("/signin");
    } catch (e: any) {
      toast({ title: "Đăng xuất thất bại", description: e?.message || "Vui lòng thử lại.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Hồ sơ</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="shadow-md">
              <CardHeader className="items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="text-center">
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-10 w-full mt-6" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-2">Không thể tải hồ sơ</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => {
          setLoading(true);
          setError(null);
          // retry
          api.auth.me()
            .then((me) => setUser(me))
            .catch((e: any) => setError(e?.message || "Lỗi không xác định"))
            .finally(() => setLoading(false));
        }}>Thử lại</Button>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will redirect if cần
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Hồ sơ</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="shadow-md">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || user.email} data-ai-hint="avatar person" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.fullName || "Người dùng"}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" /> {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center space-y-2">
              <p className="flex items-center justify-center gap-2"><Shield className="h-4 w-4" /> Vai trò: <span className="font-medium text-foreground">{user.role}</span></p>
              {user.phone && (
                <p className="flex items-center justify-center gap-2"><Phone className="h-4 w-4" /> {user.phone}</p>
              )}
              <p>Thành viên từ: {memberSince}</p>
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full mt-2">Chỉnh sửa hồ sơ</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Tổng quan tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/orders" className="block">
                <Button variant="outline" className="w-full justify-start py-6 text-left">
                  <ShoppingBag className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Đơn hàng của tôi</p>
                    <p className="text-xs text-muted-foreground">Xem lịch sử đơn hàng và theo dõi vận chuyển.</p>
                  </div>
                </Button>
              </Link>
              {/* Wishlist section removed */}
              <Link href="/settings" className="block">
                <Button variant="outline" className="w-full justify-start py-6 text-left">
                  <Settings className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Cài đặt tài khoản</p>
                    <p className="text-xs text-muted-foreground">Cập nhật thông tin và tùy chọn cá nhân.</p>
                  </div>
                </Button>
              </Link>
              <Button variant="destructive" className="w-full justify-start py-6 text-left mt-6" onClick={handleLogout}>
                <LogOut className="mr-3 h-5 w-5" />
                <div>
                  <p className="font-semibold">Đăng xuất</p>
                  <p className="text-xs text-destructive-foreground/80">Thoát khỏi tài khoản của bạn.</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
