import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import PageBreadCrumb from '../components/common/PageBreadCrumb';
import VouchersTable from '../components/vouchers/VouchersTable';
import VoucherForm from '../components/vouchers/VoucherForm';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { Voucher } from '../types/voucher';
import { getVouchers, createVoucher, updateVoucher, deleteVoucher, CreateVoucherDto, UpdateVoucherDto } from '../services/voucherService';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/common/ConfirmationModal';

const Vouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { show: showToast } = useToast();

  // Track whether we've already shown the fetch error toast to avoid spamming
  const fetchErrorShownRef = useRef(false);

  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getVouchers({
        search: debouncedSearchTerm,
        status: statusFilter,
        type: typeFilter,
      });
      setVouchers(data.vouchers);
      // Clear any previous fetch error flag so next error will show again
      fetchErrorShownRef.current = false;
    } catch (error) {
      // Avoid showing the same toast repeatedly when repeated fetches fail
      if (!fetchErrorShownRef.current) {
        showToast({ message: 'Không thể tải danh sách voucher.', type: 'error' });
        fetchErrorShownRef.current = true;
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, typeFilter, showToast]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleOpenModal = (voucher: Voucher | null = null) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVoucher(null);
  };

  const handleSaveVoucher = async (voucherData: CreateVoucherDto | UpdateVoucherDto) => {
    setIsSubmitting(true);
    try {
      if ('id' in voucherData && voucherData.id) {
        await updateVoucher(voucherData.id as number, voucherData as UpdateVoucherDto);
        showToast({ message: 'Cập nhật voucher thành công!', type: 'success' });
      } else {
        await createVoucher(voucherData as CreateVoucherDto);
        showToast({ message: 'Tạo voucher mới thành công!', type: 'success' });
      }
      fetchVouchers();
      // Do NOT close modal here: let the form call onClose after a successful save so it can manage UI focus/animation.
      return;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (voucherToDelete) {
      try {
        await deleteVoucher(voucherToDelete.id);
        showToast({ message: `Đã xóa voucher ${voucherToDelete.code}`, type: 'success' });
        fetchVouchers();
      } catch (error) {
        showToast({ message: 'Xóa voucher thất bại.', type: 'error' });
      } finally {
        setConfirmDeleteOpen(false);
        setVoucherToDelete(null);
      }
    }
  };


  return (
    <>
      <PageBreadCrumb pageTitle="Quản lý Voucher" />
      <div className="flex flex-col gap-10">
  <div className="rounded-sm border border-gray-200 bg-white p-4 shadow-default dark:border-white/[0.03] dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    {/* Search */}
                    <input 
                        type="text"
                        placeholder="Tìm theo mã..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary"
                    />
                    {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-56 rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary"
          >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="scheduled">Sắp diễn ra</option>
                        <option value="expired">Đã hết hạn</option>
                        <option value="disabled">Đã tắt</option>
                        <option value="out_of_stock">Hết lượt</option>
                    </select>
                    {/* Type Filter */}
           <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-56 rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary"
          >
                        <option value="">Tất cả loại</option>
                        <option value="FIXED_AMOUNT">Tiền cố định</option>
                        <option value="PERCENTAGE">Phần trăm</option>
                    </select>
                </div>
        <Button
          onClick={() => handleOpenModal()}
          className="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm whitespace-nowrap bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-500"
          aria-label="Tạo voucher mới"
          title="Tạo voucher mới"
        >
          <Plus className="w-4 h-4" />
          Thêm Voucher
        </Button>
            </div>
            <VouchersTable vouchers={vouchers} onEdit={handleOpenModal} onDelete={handleDeleteClick} isLoading={isLoading} />
        </div>
      </div>

      <VoucherForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveVoucher}
        voucher={selectedVoucher}
        isLoading={isSubmitting}
      />
      
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận Xóa"
        message={`Bạn có chắc chắn muốn xóa voucher "${voucherToDelete?.code}" không? Hành động này không thể hoàn tác.`}
      />
    </>
  );
};

export default Vouchers;
