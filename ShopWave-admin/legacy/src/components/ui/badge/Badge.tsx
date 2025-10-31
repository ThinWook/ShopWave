import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  color?: "success" | "warning" | "error" | "info" | "primary";
  size?: "sm" | "md";
  className?: string;
};

const colorMap: Record<NonNullable<BadgeProps["color"]>, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  primary: "bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
};

const Badge: React.FC<BadgeProps> = ({ children, color = "primary", size = "md", className = "" }) => {
  const sizeCls = size === "sm" ? " px-2 py-0.5 text-xs" : " px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex items-center rounded-full ${colorMap[color]}${sizeCls} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
