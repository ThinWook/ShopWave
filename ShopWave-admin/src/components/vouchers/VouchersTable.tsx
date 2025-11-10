import React from 'react';
import { Voucher, VoucherStatus } from '../../types/voucher';
import { formatCurrencyVi, formatDateRange } from '../../utils/format';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';

interface VouchersTableProps {
  vouchers: Voucher[];
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  isLoading: boolean;
}

const getStatusInfo = (voucher: Voucher): { text: string; className: string; status: VoucherStatus } => {
    const now = new Date();
    const startDate = voucher.startDate ? new Date(voucher.startDate) : null;
    const endDate = voucher.endDate ? new Date(voucher.endDate) : null;

    if (!voucher.isActive) {
    return {
      text: 'Đã tắt',
      // light: subtle gray pill; dark: darker gray with white text
      className: 'bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-white',
      status: 'disabled',
    };
    }
    if (voucher.usageLimit > 0 && voucher.usageCount >= voucher.usageLimit) {
    return {
      text: 'Hết lượt',
      // light: red tint; dark: solid red with white text
      className: 'bg-red-100 text-red-700 dark:bg-red-500 dark:text-white',
      status: 'out_of_stock',
    };
    }
    if (endDate && now > endDate) {
    return {
      text: 'Đã hết hạn',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-500 dark:text-white',
      status: 'expired',
    };
    }
    if (startDate && now < startDate) {
    return {
      text: 'Sắp diễn ra',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-500 dark:text-white',
      status: 'scheduled',
    };
    }
  return {
    text: 'Đang hoạt động',
    className: 'bg-green-100 text-green-700 dark:bg-green-500 dark:text-white',
    status: 'active',
  };
};


const VouchersTable: React.FC<VouchersTableProps> = ({ vouchers, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  if (!vouchers.length) {
    return <div className="text-center py-10">Không tìm thấy voucher nào.</div>;
  }

  return (
  <div className="rounded-sm border border-gray-200 bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-white/[0.03] dark:bg-gray-900 sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 dark:bg-meta-4">
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white text-center">Mã</th>
              <th className="min-w-[200px] py-4 px-4 font-medium text-black dark:text-white text-center">Mô tả</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white text-center">Giá trị</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Đơn tối thiểu</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Sử dụng</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Trạng thái</th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white text-center">Ngày hiệu lực</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => {
              const statusInfo = getStatusInfo(voucher);
              return (
                <tr key={voucher.id}>
                  <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
                    <p className="font-medium text-black dark:text-white">{voucher.code}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
                    <p className="text-black dark:text-white">{voucher.description}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
                    <p className="text-black dark:text-white">
                      {voucher.discountType === 'FIXED_AMOUNT'
                        ? formatCurrencyVi(voucher.discountValue)
                        : `${voucher.discountValue}%`}
                    </p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
                    <p className="text-black dark:text-white">{formatCurrencyVi(voucher.minOrderAmount || 0)}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
                    <p className="text-black dark:text-white">{`${voucher.usageCount} / ${voucher.usageLimit && voucher.usageLimit > 0 ? voucher.usageLimit : '∞'}`}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
                    <p className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${statusInfo.className}`}>
                      {statusInfo.text}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark text-center">
                    <p className="text-black dark:text-white">{formatDateRange(voucher.startDate, voucher.endDate)}</p>
                  </td>
            <td className="border-b border-gray-200 py-5 px-4 dark:border-white/[0.03] text-center">
              <Dropdown>
                        <DropdownTrigger>
                           <button className="hover:text-primary">
                                <MoreVertical />
                           </button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Hành động">
                            <DropdownItem key="edit" onClick={() => onEdit(voucher)} startContent={<Edit className="w-4 h-4" />}>
                                Sửa
                            </DropdownItem>
                            <DropdownItem key="delete" className="text-danger" color="danger" onClick={() => onDelete(voucher)} startContent={<Trash2 className="w-4 h-4" />}>
                                Xóa
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VouchersTable;
