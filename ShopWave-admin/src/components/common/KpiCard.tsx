import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string; // small helper text like +5%
  variant?: "default" | "accent";
  children?: ReactNode;
};

export default function KpiCard({ title, value, subtitle, trend, variant = "default", children }: Props) {
  return (
    <div className={clsx("rounded-lg p-4 shadow-sm bg-white dark:bg-slate-800", {
      "border border-slate-100": variant === "default",
    })}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
          {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
        </div>
        {trend ? (
          <div className="text-sm font-medium text-green-600 dark:text-green-400">{trend}</div>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
