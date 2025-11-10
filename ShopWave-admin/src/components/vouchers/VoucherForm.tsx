import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Voucher } from '../../types/voucher';
import { CreateVoucherDto, UpdateVoucherDto } from '../../services/voucherService';
import { generateRandomCode } from '../../utils/random';
import Modal from '../common/Modal';
import Label from '../form/Label';
import { RefreshCw, Plus } from 'lucide-react';
import Button from '../ui/button/Button';
// utils
import { parseAmountString } from '../../utils/format';
import { format, parse, isValid } from 'date-fns';
import { useToast } from '../../context/ToastContext';
// removed Popover/Calendar -- using plain inputs for dates
import Switch from '../form/switch/Switch';

interface VoucherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: CreateVoucherDto | UpdateVoucherDto) => Promise<void>;
  voucher: Voucher | null;
  isLoading: boolean;
}

const voucherSchema = z.object({
  code: z.string().min(1, 'Mã voucher là bắt buộc'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  discountType: z.enum(['FIXED_AMOUNT', 'PERCENTAGE']),
  discountValue: z.number().min(0, 'Giá trị phải lớn hơn hoặc bằng 0'),
  minOrderAmount: z.number().min(0, 'Giá trị phải lớn hơn hoặc bằng 0').optional(),
  usageLimit: z.number().min(0, 'Giá trị phải lớn hơn hoặc bằng 0').optional(),
  isActive: z.boolean().optional(),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date().optional(),
    })
    .optional(),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

const VoucherForm: React.FC<VoucherFormProps> = ({ isOpen, onClose, onSave, voucher, isLoading }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'FIXED_AMOUNT',
      discountValue: 0,
      minOrderAmount: 0,
      usageLimit: 100,
      isActive: true,
      dateRange: { from: new Date() },
    },
  });

  const discountType = watch('discountType');
  const dateRange = watch('dateRange');
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  useEffect(() => {
    if (dateRange?.from) {
      setStartInput(format(dateRange.from, 'dd/MM/yyyy'));
      setEndInput(dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : '');
    } else {
      setStartInput('');
      setEndInput('');
    }
  }, [dateRange]);

  const tryParseDate = (s: string) => {
    if (!s) return null;
    // try multiple formats: 'LLL dd, y' (e.g., Nov 06, 2025), 'dd/MM/yyyy', 'yyyy-MM-dd'
    const fmts = ['LLL dd, y', 'dd/MM/yyyy', 'yyyy-MM-dd'];
    for (const f of fmts) {
      try {
        const p = parse(s, f, new Date());
        if (isValid(p)) return p;
      } catch (e) {
        // continue
      }
    }
    // fallback to Date.parse
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  useEffect(() => {
    if (voucher) {
      reset({
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderAmount: voucher.minOrderAmount,
        usageLimit: voucher.usageLimit,
        isActive: voucher.isActive,
        dateRange: {
          from: voucher.startDate ? new Date(voucher.startDate) : new Date(),
          to: voucher.endDate ? new Date(voucher.endDate) : undefined,
        },
      });
    } else {
      reset({
        code: generateRandomCode(),
        description: '',
        discountType: 'FIXED_AMOUNT',
        discountValue: 0,
        minOrderAmount: 0,
        usageLimit: 100,
        isActive: true,
        dateRange: { from: new Date() },
      });
    }
  }, [voucher, reset]);

  const { show: showToast } = useToast();

  const handleFormSubmit: SubmitHandler<VoucherFormData> = async (data) => {
    const submissionData: CreateVoucherDto | UpdateVoucherDto = {
      ...(voucher ? { id: voucher.id } : {}),
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      usageLimit: data.usageLimit,
      isActive: data.isActive,
      startDate: data.dateRange?.from?.toISOString() ?? null,
      endDate: data.dateRange?.to?.toISOString() ?? null,
    };
    try {
      // clear any previous server-side field errors
      // Note: setError will overwrite existing errors
      await onSave(submissionData);
      // on success, close modal
      onClose();
    } catch (err: any) {
      const body = err?.body;
      let handled = false;

      // EnvelopeBuilder.Fail style: errors: [ { field, message } ]
      if (body?.errors && Array.isArray(body.errors)) {
        for (const e of body.errors) {
          const raw = String(e.field || '');
          const msg = String(e.message || e.detail || 'Lỗi hợp lệ');
          const field = mapServerFieldToForm(raw);
          // map date field errors to specific inputs
          if (field === 'dateRange') {
            const key = raw.toLowerCase();
            if (key.includes('start')) setStartError(msg);
            else if (key.includes('end')) setEndError(msg);
            else setError('dateRange' as any, { type: 'server', message: msg });
          } else {
            setError(field as any, { type: 'server', message: msg });
          }
          handled = true;
        }
      }

      // ASP.NET ProblemDetails: errors: { field: [msgs] }
      if (body?.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
        for (const [k, v] of Object.entries(body.errors)) {
          const messages = Array.isArray(v) ? v : [String(v)];
          const msg = messages.join(' ');
          const field = mapServerFieldToForm(k);
          if (field === 'dateRange') {
            const key = k.toLowerCase();
            if (key.includes('start')) setStartError(msg);
            else if (key.includes('end')) setEndError(msg);
            else setError('dateRange' as any, { type: 'server', message: msg });
          } else {
            setError(field as any, { type: 'server', message: msg });
          }
          handled = true;
        }
      }

      if (!handled) {
        const serverMsg = body?.message ?? err?.message ?? 'Lỗi server';
        showToast({ message: serverMsg, type: 'error' });
        console.error('Server error', err);
      }
    }
  };

  function mapServerFieldToForm(raw: string) {
    if (!raw) return raw;
    const key = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (key.includes('code')) return 'code';
    if (key.includes('description')) return 'description';
    if (key.includes('discountvalue')) return 'discountValue';
    if (key.includes('discounttype')) return 'discountType';
    if (key.includes('minorder')) return 'minOrderAmount';
    if (key.includes('usagelimit')) return 'usageLimit';
    if (key.includes('startdate') || key.includes('enddate')) return 'dateRange';
    if (key.includes('isactive')) return 'isActive';
    // default: camel-case the raw
    return raw.charAt(0).toLowerCase() + raw.slice(1);
  }

  const handleGenerateCode = () => {
    setValue('code', generateRandomCode());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={voucher ? 'Sửa Voucher' : 'Tạo Voucher Mới'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div>
          <Label htmlFor="code">Mã Voucher</Label>
          <div className="relative">
            <input
              id="code"
              {...register('code')}
              className="w-full rounded border-[1.5px] border-gray-200 dark:border-white/[0.03] bg-transparent py-3 pl-4 pr-10 font-medium outline-none transition focus:border-primary active:border-primary"
            />
      <button type="button" onClick={handleGenerateCode} className="absolute top-1/2 right-3 -translate-y-1/2">
        <RefreshCw className="h-5 w-5 text-gray-500 dark:text-gray-300" />
      </button>
          </div>
          {errors.code && <p className="text-danger mt-1">{errors.code.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <input
            id="description"
            {...register('description')}
            className="w-full rounded border-[1.5px] border-gray-200 dark:border-white/[0.03] bg-transparent py-3 px-4 font-medium outline-none transition focus:border-primary active:border-primary"
          />
          {errors.description && <p className="text-danger mt-1">{errors.description.message}</p>}
        </div>

        {/* Discount Config */}
  <div className="rounded-md border border-gray-200 dark:border-white/[0.03] p-4">
            <h3 className="font-medium mb-3">Cấu hình Giá trị</h3>
            <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                    <input type="radio" {...register('discountType')} value="FIXED_AMOUNT" className="form-radio"/>
                    Tiền cố định
                </label>
                <label className="flex items-center gap-2">
                    <input type="radio" {...register('discountType')} value="PERCENTAGE" className="form-radio"/>
                    Phần trăm
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountValue">Giá trị giảm</Label>
          <div className="relative">
            <input
              id="discountValue"
              type="text"
              {...register('discountValue', { setValueAs: v => parseAmountString(String(v)) })}
              className="w-full rounded border-[1.5px] border-gray-200 dark:border-white/[0.03] bg-transparent py-3 pl-4 pr-10 font-medium outline-none transition focus:border-primary active:border-primary"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
              {discountType === 'FIXED_AMOUNT' ? '₫' : '%'}
            </span>
          </div>
          {errors.discountValue && <p className="text-danger mt-1">{errors.discountValue.message}</p>}
        </div>
        <div>
          <Label htmlFor="minOrderAmount">Đơn hàng tối thiểu</Label>
           <div className="relative">
            <input
              id="minOrderAmount"
              type="text"
              {...register('minOrderAmount', { setValueAs: v => parseAmountString(String(v)) })}
              className="w-full rounded border-[1.5px] border-gray-200 dark:border-white/[0.03] bg-transparent py-3 pl-4 pr-10 font-medium outline-none transition focus:border-primary active:border-primary"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">₫</span>
          </div>
          {errors.minOrderAmount && <p className="text-danger mt-1">{errors.minOrderAmount.message}</p>}
        </div>
            </div>
        </div>

        {/* Conditions Config */}
  <div className="rounded-md border border-gray-200 dark:border-white/[0.03] p-4">
            <h3 className="font-medium mb-3">Cấu hình Điều kiện</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Thời gian hiệu lực</Label>
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="startDate">Ngày bắt đầu</Label>
                          <input
                            id="startDate"
                            type="text"
                            value={startInput}
                            onChange={(e) => {
                              const v = e.target.value;
                              setStartInput(v);
                              if (v.trim() === '') {
                                // clear entire dateRange
                                setStartError(null);
                                setEndError(null);
                                setValue('dateRange', undefined as any);
                                return;
                              }
                              const parsed = tryParseDate(v);
                              if (parsed) {
                                const currentTo = dateRange?.to;
                                setValue('dateRange', { from: parsed, to: currentTo } as any);
                                setStartError(null);
                              } else {
                                setStartError('Định dạng ngày không hợp lệ. Dùng dd/MM/yyyy hoặc yyyy-MM-dd.');
                              }
                            }}
                            placeholder="dd/MM/yyyy"
                            className={`inline-flex items-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-10 px-4 py-2 w-full justify-start text-left font-normal ${startError ? 'border-red-500 dark:border-red-400' : ''}`}
                          />
                          {startError && <p className="text-danger mt-1 text-sm">{startError}</p>}
                        </div>
                        <div>
                          <Label htmlFor="endDate">Ngày kết thúc</Label>
                          <input
                            id="endDate"
                            type="text"
                            value={endInput}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEndInput(v);
                              if (v.trim() === '') {
                                // remove end date only
                                setEndError(null);
                                if (dateRange?.from) setValue('dateRange', { from: dateRange.from } as any);
                                else setValue('dateRange', undefined as any);
                                return;
                              }
                              const parsed = tryParseDate(v);
                              if (parsed) {
                                const currentFrom = dateRange?.from ?? parsed;
                                setValue('dateRange', { from: currentFrom, to: parsed } as any);
                                setEndError(null);
                              } else {
                                setEndError('Định dạng ngày không hợp lệ. Dùng dd/MM/yyyy hoặc yyyy-MM-dd.');
                              }
                            }}
                            placeholder="dd/MM/yyyy"
                            className={`inline-flex items-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-10 px-4 py-2 w-full justify-start text-left font-normal ${endError ? 'border-red-500 dark:border-red-400' : ''}`}
                          />
                          {endError && <p className="text-danger mt-1 text-sm">{endError}</p>}
                        </div>
                      </div>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="usageLimit">Giới hạn sử dụng</Label>
          <input
            id="usageLimit"
            type="number"
            {...register('usageLimit', { valueAsNumber: true })}
            placeholder="0 nếu không giới hạn"
            className="w-full rounded border-[1.5px] border-gray-200 dark:border-white/[0.03] bg-transparent py-3 px-4 font-medium outline-none transition focus:border-primary active:border-primary"
          />
                    {errors.usageLimit && <p className="text-danger mt-1">{errors.usageLimit.message}</p>}
                </div>
            </div>
             <div className="mt-4 flex items-center gap-4">
                <Label>Kích hoạt</Label>
                <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                        <Switch
                            enabled={field.value ?? false}
                            onChange={field.onChange}
                        />
                    )}
                />
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-black dark:bg-gray-800 dark:text-white">
            Hủy
          </button>
          <Button type="submit" disabled={isLoading} className="rounded-full px-6 py-3 shadow-md flex items-center gap-2">
            {isLoading ? (
              'Đang lưu...'
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Lưu Voucher
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VoucherForm;
