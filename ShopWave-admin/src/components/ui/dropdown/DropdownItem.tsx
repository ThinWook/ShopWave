import React from "react";
import { Link } from "react-router";

type DropdownItemProps = {
  tag?: "a" | "button";
  to?: string;
  onItemClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  to,
  onItemClick,
  className = "",
  children,
}) => {
  const base = "w-full text-left";
  if (tag === "a" && to) {
    return (
      <Link to={to} onClick={onItemClick} className={className + " " + base}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onItemClick} className={className + " " + base}>
      {children}
    </button>
  );
};

export default DropdownItem;
