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
        <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
        <p className="text-xs text-muted-foreground">Reduce eye strain in low light conditions.</p>
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
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <div className="space-y-8">
        {/* Personal Information Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <UserCircle className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Personal Information</CardTitle>
            </div>
            <CardDescription>Update your personal details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Alex Johnson" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="" />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" type="tel" placeholder="" />
            </div>
            <Button className="mt-2">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Security</CardTitle>
            </div>
            <CardDescription>Manage your password and account security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button className="mt-2">Change Password</Button>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Notifications</CardTitle>
            </div>
            <CardDescription>Control how you receive notifications from ShopWave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-promotions" className="font-medium">Email Promotions</Label>
                <p className="text-xs text-muted-foreground">Receive emails about new products and special offers.</p>
              </div>
              <Switch id="email-promotions" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
               <div>
                <Label htmlFor="order-updates" className="font-medium">Order Updates</Label>
                <p className="text-xs text-muted-foreground">Get notified about your order status via email.</p>
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
                <CardTitle className="text-xl">Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look and feel of the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AppearanceSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
