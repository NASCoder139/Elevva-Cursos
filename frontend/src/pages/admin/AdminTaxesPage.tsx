import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Percent, DollarSign, Info } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminTaxesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxRate, setTaxRate] = useState('19');
  const [usdToClp, setUsdToClp] = useState('950');

  useEffect(() => {
    adminApi.taxes
      .get()
      .then((res) => {
        const data = (res.data as any).data || res.data;
        setTaxRate(String(data.taxRatePercent ?? 19));
        setUsdToClp(String(data.usdToClp ?? 950));
      })
      .catch(() => toast.error('No se pudo cargar la configuración'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const tax = Number(taxRate);
    const rate = Number(usdToClp);
    if (!isFinite(tax) || tax < 0 || tax > 100) {
      toast.error('El IVA debe ser un número entre 0 y 100');
      return;
    }
    if (!isFinite(rate) || rate <= 0) {
      toast.error('El tipo de cambio debe ser mayor a 0');
      return;
    }
    setSaving(true);
    try {
      await adminApi.taxes.update({ taxRatePercent: tax, usdToClp: rate });
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const taxNum = Number(taxRate) || 0;
  const rateNum = Number(usdToClp) || 0;
  const exampleNet = 20;
  const exampleGross = exampleNet * (1 + taxNum / 100);
  const exampleCLP = Math.round(exampleGross * rateNum);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Impuestos y tipo de cambio</h1>
        <p className="text-sm text-surface-500 mt-1">
          Configura el IVA aplicado a las ventas y el tipo de cambio USD → CLP utilizado para clientes chilenos vía MercadoPago.
        </p>
      </div>

      <section className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 max-w-2xl">
        <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Configuración</h2>

        <div className="space-y-5">
          <Field label="Tasa de IVA (%)">
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </div>
            <span className="mt-1 block text-xs text-surface-500">
              Se aplica al precio neto de TODOS los cursos y planes (régimen general SII Chile).
            </span>
          </Field>

          <Field label="Tipo de cambio USD → CLP">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={usdToClp}
                onChange={(e) => setUsdToClp(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 py-2.5 text-sm dark:border-surface-700 dark:bg-surface-800"
              />
            </div>
            <span className="mt-1 block text-xs text-surface-500">
              Cuántos CLP equivalen a 1 USD. Se usa solo para clientes chilenos (MercadoPago cobra en CLP).
            </span>
          </Field>

          <Button onClick={save} isLoading={saving}>
            <Save className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-primary-200 dark:border-primary-900/40 bg-primary-50/40 dark:bg-primary-950/20 p-6 max-w-2xl">
        <div className="flex items-start gap-3 mb-4">
          <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-white">Ejemplo de cálculo</h3>
            <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
              Curso con precio neto de $20.00 USD (lo que pones en el admin del curso):
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-surface-600 dark:text-surface-300">
            <span>Precio neto en DB</span>
            <span className="font-mono">${exampleNet.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-surface-600 dark:text-surface-300">
            <span>+ IVA ({taxNum}%)</span>
            <span className="font-mono">${(exampleGross - exampleNet).toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-primary-200 dark:border-primary-900/40 font-semibold text-surface-900 dark:text-white">
            <span>Total bruto</span>
            <span className="font-mono">${exampleGross.toFixed(2)} USD</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-primary-200 dark:border-primary-900/40">
            <div className="rounded-lg bg-white dark:bg-surface-900 p-3 border border-surface-200 dark:border-surface-800">
              <div className="text-[11px] text-surface-500">🇨🇱 Cliente Chile (MP)</div>
              <div className="font-bold text-surface-900 dark:text-white mt-1">
                ${exampleCLP.toLocaleString('es-CL')} CLP
              </div>
            </div>
            <div className="rounded-lg bg-white dark:bg-surface-900 p-3 border border-surface-200 dark:border-surface-800">
              <div className="text-[11px] text-surface-500">🌎 Cliente internacional (PayPal)</div>
              <div className="font-bold text-surface-900 dark:text-white mt-1">
                ${exampleGross.toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">{label}</span>
      {children}
    </label>
  );
}
