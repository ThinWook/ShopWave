import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors";
  const sizeCls = size === "sm" ? " px-4 py-2.5 text-sm" : " px-5 py-3 text-sm";
  const variantCls =
    variant === "outline"
      ? " border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      : " bg-brand-500 text-white hover:bg-brand-600";
  const disabledCls = disabled ? " opacity-60 cursor-not-allowed" : "";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base}${sizeCls}${variantCls}${disabledCls} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
