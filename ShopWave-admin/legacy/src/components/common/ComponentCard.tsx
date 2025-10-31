import React from "react";

type ComponentCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function ComponentCard({ title, children, className = "" }: ComponentCardProps) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 ${className}`}>
      {title ? (
        <div className="mb-4 border-b border-gray-100 pb-3 dark:border-gray-800">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h4>
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
