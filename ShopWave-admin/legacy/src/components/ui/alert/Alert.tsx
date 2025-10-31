// Minimal alert component

type AlertProps = {
  title?: string;
  message?: string;
  variant?: "success" | "warning" | "error" | "info";
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
};

const styles: Record<NonNullable<AlertProps["variant"]>, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-800",
  error: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-800",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-800",
};

export default function Alert({ title, message, variant = "info", showLink, linkHref = "#", linkText = "" }: AlertProps) {
  return (
    <div className={`mb-4 rounded-xl border p-4 ${styles[variant]}`}>
      {title ? <div className="mb-1 font-semibold">{title}</div> : null}
      {message ? <div className="text-sm opacity-90">{message}</div> : null}
      {showLink && linkText ? (
        <a href={linkHref} className="mt-2 inline-flex text-sm underline opacity-90 hover:opacity-100">
          {linkText}
        </a>
      ) : null}
    </div>
  );
}
