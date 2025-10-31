import React from "react";

type WithChildren<T = {}> = T & { children?: React.ReactNode; className?: string };

export const Table: React.FC<WithChildren> = ({ children, className = "" }) => (
  <table className={`w-full text-left ${className}`}>{children}</table>
);

export const TableHeader: React.FC<WithChildren> = ({ children, className = "" }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody: React.FC<WithChildren> = ({ children, className = "" }) => (
  <tbody className={className}>{children}</tbody>
);

type CellProps = WithChildren<{
  isHeader?: boolean;
}>;

export const TableRow: React.FC<WithChildren> = ({ children, className = "" }) => (
  <tr className={className}>{children}</tr>
);

export const TableCell: React.FC<CellProps> = ({ children, className = "", isHeader = false }) => {
  const Tag: any = isHeader ? "th" : "td";
  return <Tag className={className}>{children}</Tag>;
};

export default Table;
