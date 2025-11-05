"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UserCircle, Lock, Bell, Palette } from "lucide-react";

function AppearanceSettings() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="dark-mode" className="font-medium">Chế độ tối</Label>
        <p className="text-xs text-muted-foreground">Giảm mỏi mắt trong điều kiện ánh sáng yếu.</p>
      </div>
      {/* Basic switch, full theme switching would require more logic */}
      <Switch id="dark-mode" onCheckedChange={(checked) => {
        if (checked) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Cài đặt tài khoản</h1>
      <div className="space-y-8">
        {/* Personal Information Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <UserCircle className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Thông tin cá nhân</CardTitle>
            </div>
            <CardDescription>Cập nhật chi tiết cá nhân và thông tin liên hệ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" defaultValue="Alex Johnson" />
              </div>
              <div>
                <Label htmlFor="email">Địa chỉ email</Label>
                <Input id="email" type="email" defaultValue="" />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại (tuỳ chọn)</Label>
              <Input id="phone" type="tel" placeholder="" />
            </div>
            <Button className="mt-2">Lưu thay đổi</Button>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Bảo mật</CardTitle>
            </div>
            <CardDescription>Quản lý mật khẩu và các thiết lập bảo mật tài khoản.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <Input id="current-password" type="password" />
            </div>
            <div>
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input id="new-password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button className="mt-2">Đổi mật khẩu</Button>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Thông báo</CardTitle>
            </div>
            <CardDescription>Tuỳ chỉnh cách bạn nhận thông báo từ ShopWave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-promotions" className="font-medium">Khuyến mãi qua email</Label>
                <p className="text-xs text-muted-foreground">Nhận email về sản phẩm mới và ưu đãi đặc biệt.</p>
              </div>
              <Switch id="email-promotions" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
               <div>
                <Label htmlFor="order-updates" className="font-medium">Cập nhật đơn hàng</Label>
                <p className="text-xs text-muted-foreground">Nhận thông báo trạng thái đơn hàng qua email.</p>
              </div>
              <Switch id="order-updates" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Giao diện</CardTitle>
            </div>
            <CardDescription>Tuỳ chỉnh giao diện hiển thị của ứng dụng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AppearanceSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
