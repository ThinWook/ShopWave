import React from 'react';

type SkeletonBlockProps = {
  className?: string;
  'aria-hidden'?: boolean;
};

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden
      className={`rounded bg-gray-200 dark:bg-gray-800 animate-pulse ${className}`}
    />
  );
};

type SkeletonTableRowsProps = {
  count?: number;
  /** optional extra classes for the row */
  rowClassName?: string;
};

/**
 * Render table-aligned skeleton rows used by product variants master/detail table.
 * Returns an array of <tr> elements that can be rendered inside a <tbody>.
 */
export const SkeletonTableRows: React.FC<SkeletonTableRowsProps> = ({ count = 2, rowClassName = '' }) => {
  return <>
    {Array.from({ length: count }).map((_, i) => (
      <tr key={`skeleton-row-${i}`} className={`bg-white/50 even:bg-gray-50 dark:even:bg-gray-900 ${rowClassName}`}>
        <td />
        <td className="px-5 py-3 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-md" />
            <div className="flex-1">
              <SkeletonBlock className="h-3 w-3/4 mb-2" />
              <SkeletonBlock className="h-3 w-1/2" />
            </div>
          </div>
        </td>
        <td className="px-5 py-3 whitespace-nowrap">
          <SkeletonBlock className="h-6 w-14 rounded-full" />
        </td>
        <td className="px-5 py-3 whitespace-nowrap">
          <SkeletonBlock className="h-3 w-8" />
        </td>
        <td className="px-5 py-3 whitespace-nowrap">
          <SkeletonBlock className="h-3 w-12" />
        </td>
        <td className="px-5 py-3 whitespace-nowrap">
          <SkeletonBlock className="h-3 w-20" />
        </td>
        <td className="px-5 py-3 whitespace-nowrap">&nbsp;</td>
      </tr>
    ))}
  </>;
};

export default SkeletonBlock;
