import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, Power } from 'lucide-react';
import {
  adminApi,
  type AdminCoupon,
  type CouponDiscountType,
  type CouponScope,
  type CreateCouponPayload,
} from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

const scopeLabels: Record<CouponScope, string> = {
  ALL: 'Todo',
  COURSES: 'Cursos',
  CATEGORIES: 'Categorías',
  PLANS: 'Planes',
};

interface CouponForm {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  value: string;
  scope: CouponScope;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  value: '',
  scope: 'ALL',
  validFrom: '',
  validUntil: '',
  usageLimit: '',
  isActive: true,
};

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.coupons.list();
      setCoupons(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (c: AdminCoupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      value: String(c.value),
      scope: c.scope,
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
      usageLimit: c.usageLimit !== null ? String(c.usageLimit) : '',
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const valueNum = Number(form.value);
    if (!form.code.trim()) return toast.error('Código requerido');
    if (isNaN(valueNum) || valueNum <= 0) return toast.error('Valor de descuento inválido');
    if (form.discountType === 'PERCENT' && valueNum > 100) {
      return toast.error('El descuento porcentual no puede superar 100%');
    }

    const payload: CreateCouponPayload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      value: valueNum,
      scope: form.scope,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await adminApi.coupons.update(editing.id, payload);
        toast.success('Cupón actualizado');
      } else {
        await adminApi.coupons.create(payload);
        toast.success('Cupón creado');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    try {
      await adminApi.coupons.remove(id);
      toast.success('Cupón eliminado');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  const toggleActive = async (c: AdminCoupon) => {
    try {
      await adminApi.coupons.update(c.id, { isActive: !c.isActive });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const formatValue = (c: AdminCoupon) => {
    const v = Number(c.value);
    return c.discountType === 'PERCENT' ? `${v}%` : `USD ${v.toFixed(2)}`;
  };

  const columns: Column<AdminCoupon>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (r) => (
        <div>
          <div className="font-mono font-medium">{r.code}</div>
          {r.description && <div className="text-xs text-surface-500">{r.description}</div>}
        </div>
      ),
    },
    { key: 'value', header: 'Descuento', render: (r) => <span className="font-medium">{formatValue(r)}</span> },
    { key: 'scope', header: 'Aplica a', render: (r) => scopeLabels[r.scope] },
    {
      key: 'usage',
      header: 'Usos',
      render: (r) => `${r.usedCount}${r.usageLimit !== null ? ` / ${r.usageLimit}` : ''}`,
    },
    {
      key: 'validity',
      header: 'Vigencia',
      render: (r) => {
        const from = r.validFrom ? new Date(r.validFrom).toLocaleDateString('es-AR') : '—';
        const until = r.validUntil ? new Date(r.validUntil).toLocaleDateString('es-AR') : 'Sin límite';
        return (
          <div className="text-xs">
            <div>Desde: {from}</div>
            <div>Hasta: {until}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => (
        <button onClick={() => toggleActive(r)}>
          <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Activo' : 'Inactivo'}</Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => toggleActive(r)}
            className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800"
            title={r.isActive ? 'Desactivar' : 'Activar'}
          >
            <Power className="h-4 w-4 text-surface-600" />
          </button>
          <button
            onClick={() => startEdit(r)}
            className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <Pencil className="h-4 w-4 text-surface-600" />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Códigos de descuento</h1>
          <p className="text-sm text-surface-500">{coupons.length} cupón(es). Aplican a cursos, categorías y planes.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo cupón
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <h3 className="mb-4 font-semibold">{editing ? `Editar ${editing.code}` : 'Nuevo cupón'}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VERANO2026"
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm uppercase dark:border-surface-700 dark:bg-surface-800"
              />
            </Field>
            <Field label="Aplica a">
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as CouponScope })}
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              >
                <option value="ALL">Todo</option>
                <option value="COURSES">Solo cursos</option>
                <option value="CATEGORIES">Solo categorías</option>
                <option value="PLANS">Solo planes</option>
              </select>
            </Field>
            <Field label="Tipo de descuento">
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponDiscountType })}
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              >
                <option value="PERCENT">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo (USD)</option>
              </select>
            </Field>
            <Field label={form.discountType === 'PERCENT' ? 'Porcentaje (1-100)' : 'Monto (USD)'}>
              <input
                type="number"
                step="0.01"
                min="0"
                max={form.discountType === 'PERCENT' ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </Field>
            <Field label="Válido desde (opcional)">
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </Field>
            <Field label="Válido hasta (opcional)">
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </Field>
            <Field label="Límite de usos (opcional)">
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="Sin límite"
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </Field>
            <Field label="Estado">
              <label className="flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Activo
              </label>
            </Field>
            <Field label="Descripción (opcional)" full>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Promo verano para nuevos alumnos"
                className="w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSubmit}>{editing ? 'Guardar cambios' : 'Crear cupón'}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable columns={columns} rows={coupons} empty="Aún no creaste ningún cupón." />
      )}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-surface-500">{label}</label>
      {children}
    </div>
  );
}
