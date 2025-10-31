import React, { useEffect, useRef } from "react";

type DropdownProps = {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
};

export const Dropdown: React.FC<DropdownProps> = ({ isOpen, onClose, className = "", children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={
        "absolute right-0 z-50 mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 " +
        className
      }
      role="menu"
    >
      {children}
    </div>
  );
};

export default Dropdown;
