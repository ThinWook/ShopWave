import { useEffect, useState } from 'react';
import Modal from '../components/ui/modal';
import { useToast } from '../context/ToastContext';
import CategoryForm from '../components/categories/CategoryForm';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryDto,
  type CreateCategoryRequest,
} from '../services/categoryService';

type NodeProps = {
  node: CategoryDto;
  level?: number;
  childrenMap: Record<string, CategoryDto[]>;
  onEdit: (item: CategoryDto) => void;
  onDelete: (id: string) => void;
};

function CategoryNode({ node, level = 0, childrenMap, onEdit, onDelete }: NodeProps) {
  const [open, setOpen] = useState(level === 0);
  const children = childrenMap[node.id] || [];

  return (
    <>
      <tr className="border-t">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {children.length > 0 ? (
              <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="text-sm text-gray-500 px-2 py-1 border rounded"
              >
                {open ? '−' : '+'}
              </button>
            ) : (
              <span className="inline-block w-8" />
            )}

            <div className="text-sm font-medium text-gray-800" style={{ marginLeft: level * 12 }}>
              {node.name}
            </div>
          </div>
        </td>

        <td className="px-4 py-3 text-center">
          {(node.isActive ?? true) ? <span className="text-green-600">Hoạt động</span> : <span className="text-gray-500">Ẩn</span>}
        </td>

        <td className="px-4 py-3 text-sm text-gray-600 text-center">{(node as any).createdAt ? new Date((node as any).createdAt).toLocaleString() : '-'}</td>
        <td className="px-4 py-3 text-sm text-gray-600 text-center">{(node as any).updatedAt ? new Date((node as any).updatedAt).toLocaleString() : '-'}</td>

        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => onEdit(node)} title="Sửa" className="p-2 rounded border hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>

            <button onClick={() => onDelete(node.id)} title="Xóa" className="p-2 rounded border hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {open && children.map((child) => (
        <CategoryNode key={child.id} node={child} level={(level || 0) + 1} childrenMap={childrenMap} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

export default function Categories() {
  const { show } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<{ open: boolean; item?: CategoryDto }>({ open: false });

  const load = async () => {
    try {
      setLoading(true);
      const cats = await getCategories(true);
      setCategories(cats);
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload: CreateCategoryRequest) => {
    try {
      await createCategory(payload);
      show({ type: 'success', message: 'Đã tạo danh mục' });
      setAddOpen(false);
      await load();
    } catch (e: any) {
      show({ type: 'error', message: e?.message || 'Tạo thất bại' });
    }
  };

  const handleUpdate = async (id: string, payload: Partial<CreateCategoryRequest>) => {
    try {
      await updateCategory(id, payload);
      show({ type: 'success', message: 'Đã cập nhật danh mục' });
      setEditOpen({ open: false });
      await load();
    } catch (e: any) {
      show({ type: 'error', message: e?.message || 'Cập nhật thất bại' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await deleteCategory(id);
      show({ type: 'success', message: 'Đã xóa danh mục' });
      await load();
    } catch (e: any) {
      show({ type: 'error', message: e?.message || 'Xóa thất bại' });
    }
  };

  // Build children map for tree rendering
  const childrenMap: Record<string, CategoryDto[]> = {};
  const topLevel: CategoryDto[] = [];
  categories.forEach((c) => {
    const pid = (c as any).parentId as string | null | undefined;
    if (pid == null || pid === '') topLevel.push(c);
    else {
      if (!childrenMap[pid]) childrenMap[pid] = [];
      childrenMap[pid].push(c);
    }
  });

  return (
    <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quản lý danh mục</h2>
        <div className="flex gap-3">
          <button onClick={() => setAddOpen(true)} className="rounded-lg bg-brand-500 px-4 py-2 text-white">Thêm danh mục</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
        {loading && <div>Đang tải...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Tên</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2 text-center">Tạo lúc</th>
              <th className="px-4 py-2 text-center">Cập nhật lúc</th>
              <th className="px-4 py-2 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {topLevel.map((cat) => (
              <CategoryNode key={cat.id} node={cat} childrenMap={childrenMap} onEdit={(item) => setEditOpen({ open: true, item })} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)}>
        <div className="min-w-[320px]">
          <h3 className="text-lg font-semibold mb-3">Thêm danh mục</h3>
          <CategoryForm categories={categories} onCancel={() => setAddOpen(false)} onSubmit={handleCreate} />
        </div>
      </Modal>

      <Modal isOpen={editOpen.open} onClose={() => setEditOpen({ open: false })}>
        <div className="min-w-[320px]">
          <h3 className="text-lg font-semibold mb-3">Sửa danh mục</h3>
          {editOpen.item && (
            <CategoryForm
              initial={editOpen.item as any}
              categories={categories}
              onCancel={() => setEditOpen({ open: false })}
              onSubmit={async (payload) => { await handleUpdate(editOpen.item!.id, payload); }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

