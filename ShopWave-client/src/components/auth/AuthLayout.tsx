import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}
