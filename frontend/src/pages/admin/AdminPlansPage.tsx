import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Save,
  Plus,
  X,
  Flame,
  Sparkles,
  Calendar,
  Check,
  Crown,
  Tag as TagIcon,
  Clock,
  TrendingDown,
  CircleDot,
  Power,
  Megaphone,
} from 'lucide-react';
import { adminApi, type AdminPlan, type AdminSiteSettings } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

interface PlanForm {
  id: string;
  label: string;
  price: string;
  comparePrice: string;
  badge: string;
  savings: string;
  features: string[];
  isActive: boolean;
}

// ISO "2026-05-01T23:59:00.000Z" -> "2026-05-01T23:59" (datetime-local)
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toForm(p: AdminPlan): PlanForm {
  return {
    id: p.id,
    label: p.label,
    price: String(p.price),
    comparePrice: p.comparePrice != null ? String(p.comparePrice) : '',
    badge: p.badge ?? '',
    savings: p.savings ?? '',
    features: p.features ?? [],
    isActive: p.isActive,
  };
}

function discountPct(priceStr: string, compareStr: string): number | null {
  const p = Number(priceStr);
  const c = Number(compareStr);
  if (!compareStr.trim() || isNaN(p) || isNaN(c) || c <= 0 || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}

/* ── live countdown hook ───────────────────────────────────────── */
function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  if (!targetIso) return null;
  const end = new Date(targetIso).getTime();
  if (isNaN(end)) return null;
  const diff = Math.max(0, end - now);
  return {
    ended: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [forms, setForms] = useState<Record<string, PlanForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [promoForm, setPromoForm] = useState({ enabled: false, endsAt: '' });
  const [savingPromo, setSavingPromo] = useState(false);

  const [ribbonForm, setRibbonForm] = useState({
    enabled: false,
    text: '',
    secondaryText: '',
    showCountdown: false,
    ctaText: '',
    ctaUrl: '',
  });
  const [savingRibbon, setSavingRibbon] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, siteRes] = await Promise.all([
        adminApi.plans.list(),
        adminApi.siteSettings.get(),
      ]);
      const data = plansRes.data.data;
      setPlans(data);
      const map: Record<string, PlanForm> = {};
      for (const p of data) map[p.id] = toForm(p);
      setForms(map);

      const s = siteRes.data.data;
      setSite(s);
      setPromoForm({
        enabled: s.plansPromoEnabled,
        endsAt: isoToLocalInput(s.plansPromoEndsAt),
      });
      setRibbonForm({
        enabled: s.promoRibbonEnabled,
        text: s.promoRibbonText || '',
        secondaryText: s.promoRibbonSecondaryText || '',
        showCountdown: s.promoRibbonShowCountdown,
        ctaText: s.promoRibbonCtaText || '',
        ctaUrl: s.promoRibbonCtaUrl || '',
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error cargando planes');
    } finally {
      setLoading(false);
    }
  };

  const savePromo = async () => {
    setSavingPromo(true);
    try {
      await adminApi.siteSettings.updatePlansPromo({
        plansPromoEnabled: promoForm.enabled,
        plansPromoEndsAt:
          promoForm.enabled && promoForm.endsAt ? new Date(promoForm.endsAt).toISOString() : null,
      });
      toast.success('Modo oferta actualizado');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingPromo(false);
    }
  };

  const saveRibbon = async () => {
    setSavingRibbon(true);
    try {
      await adminApi.siteSettings.updateRibbon({
        promoRibbonEnabled: ribbonForm.enabled,
        promoRibbonText: ribbonForm.text.trim() || 'Oferta por tiempo limitado',
        promoRibbonSecondaryText: ribbonForm.secondaryText.trim() || null,
        promoRibbonShowCountdown: ribbonForm.showCountdown,
        promoRibbonCtaText: ribbonForm.ctaText.trim() || null,
        promoRibbonCtaUrl: ribbonForm.ctaUrl.trim() || null,
      });
      toast.success('Cinta de oferta actualizada');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingRibbon(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (id: string, patch: Partial<PlanForm>) => {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const addFeature = (id: string) => {
    updateForm(id, { features: [...forms[id].features, ''] });
  };
  const removeFeature = (id: string, idx: number) => {
    const next = forms[id].features.filter((_, i) => i !== idx);
    updateForm(id, { features: next });
  };
  const setFeature = (id: string, idx: number, value: string) => {
    const next = forms[id].features.map((f, i) => (i === idx ? value : f));
    updateForm(id, { features: next });
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await adminApi.plans.seedDefaults();
      toast.success('Planes por defecto creados');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear los planes por defecto');
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async (id: string) => {
    const f = forms[id];
    const priceNum = Number(f.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Precio inválido');
      return;
    }
    let compareNum: number | null = null;
    if (f.comparePrice.trim() !== '') {
      const c = Number(f.comparePrice);
      if (isNaN(c) || c < 0) {
        toast.error('Precio anterior inválido');
        return;
      }
      compareNum = c;
    }
    setSaving(id);
    try {
      await adminApi.plans.update(id, {
        label: f.label,
        price: priceNum,
        comparePrice: compareNum,
        badge: f.badge || null,
        savings: f.savings || null,
        features: f.features.filter((x) => x.trim()),
        isActive: f.isActive,
      });
      toast.success('Plan actualizado');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(null);
    }
  };

  // Máximo descuento calculado a partir de los planes guardados (para banner)
  const maxSavedDiscount = useMemo(() => {
    return Math.max(
      0,
      ...plans.map((p) => {
        const price = Number(p.price);
        const compare = p.comparePrice != null ? Number(p.comparePrice) : NaN;
        if (isNaN(price) || isNaN(compare) || compare <= price) return 0;
        return Math.round(((compare - price) / compare) * 100);
      }),
    );
  }, [plans]);

  // Cuenta regresiva en vivo basada en la fecha GUARDADA
  const savedTarget = site?.plansPromoEnabled ? site?.plansPromoEndsAt : null;
  const countdown = useCountdown(savedTarget ?? null);
  const isLiveActive =
    !!site?.plansPromoEnabled && !!countdown && !countdown.ended;

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-bold">Planes y precios</h1>
        <p className="text-sm text-surface-500">
          Editá precio, beneficios y estado de cada plan de suscripción. Todos los precios son en USD.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
           OFERTA GLOBAL — banner premium
           ═══════════════════════════════════════════════ */}
      <PromoBanner
        active={isLiveActive}
        promoForm={promoForm}
        setPromoForm={setPromoForm}
        savingPromo={savingPromo}
        onSave={savePromo}
        maxDiscount={maxSavedDiscount}
        countdown={countdown}
        site={site}
        planLabels={plans.map((p) => (p.key === 'SUBSCRIPTION_MONTHLY' ? 'Mensual' : 'Anual'))}
      />

      {/* ═══════════════════════════════════════════════
           CINTA PROMOCIONAL DEL SITIO
           ═══════════════════════════════════════════════ */}
      <RibbonSection
        ribbonForm={ribbonForm}
        setRibbonForm={setRibbonForm}
        saving={savingRibbon}
        onSave={saveRibbon}
        promoActive={isLiveActive}
      />

      {/* ═══════════════════════════════════════════════
           PLANES
           ═══════════════════════════════════════════════ */}
      <div className="grid gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const f = forms[plan.id];
          if (!f) return null;
          const pct = discountPct(f.price, f.comparePrice);
          const isAnnual = plan.key === 'SUBSCRIPTION_ANNUAL';
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              form={f}
              pct={pct}
              saving={saving === plan.id}
              isAnnual={isAnnual}
              promoActive={isLiveActive}
              onChange={(patch) => updateForm(plan.id, patch)}
              onSave={() => handleSave(plan.id)}
              onAddFeature={() => addFeature(plan.id)}
              onRemoveFeature={(idx) => removeFeature(plan.id, idx)}
              onSetFeature={(idx, v) => setFeature(plan.id, idx, v)}
            />
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50 p-10 text-center dark:border-surface-700 dark:bg-surface-900/40">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">No hay planes configurados</h3>
          <p className="mt-1 text-sm text-surface-500">
            Creá los planes por defecto (Mensual $12 USD y Anual $120 USD) y editalos como quieras.
          </p>
          <div className="mt-4 flex justify-center">
            <Button onClick={handleSeed} isLoading={seeding}>
              <Plus className="mr-1 h-4 w-4" /> Crear planes por defecto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROMO BANNER
   ══════════════════════════════════════════════════════════════ */
function PromoBanner({
  active,
  promoForm,
  setPromoForm,
  savingPromo,
  onSave,
  maxDiscount,
  countdown,
  site,
  planLabels,
}: {
  active: boolean;
  promoForm: { enabled: boolean; endsAt: string };
  setPromoForm: (v: { enabled: boolean; endsAt: string }) => void;
  savingPromo: boolean;
  onSave: () => void;
  maxDiscount: number;
  countdown: { days: number; hours: number; minutes: number; seconds: number; ended: boolean } | null;
  site: AdminSiteSettings | null;
  planLabels: string[];
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-fuchsia-500/10 p-6 shadow-lg shadow-amber-500/5 dark:border-amber-500/25 dark:from-amber-500/10 dark:via-orange-500/5 dark:to-fuchsia-500/10">
      {/* glow decoraciones */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full bg-fuchsia-500/15 blur-3xl" />

      {/* Encabezado */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Modo oferta global</h2>
              <StatusBadge active={active} />
            </div>
            <p className="mt-1 max-w-2xl text-xs text-surface-600 dark:text-surface-400">
              Activa una promoción simultánea para <strong>{planLabels.join(' y ')}</strong>. La misma cuenta regresiva
              alimenta las tarjetas de precio y la cinta promocional del sitio.
            </p>
          </div>
        </div>

        {/* Switch + descuento visible */}
        <div className="flex items-center gap-3">
          {maxDiscount > 0 && promoForm.enabled && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-300">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-bold tabular-nums">Hasta {maxDiscount}% OFF</span>
            </div>
          )}
          <Toggle
            checked={promoForm.enabled}
            onChange={(v) => setPromoForm({ ...promoForm, enabled: v })}
          />
        </div>
      </div>

      {/* Cuerpo principal: countdown + fecha */}
      <div className="relative mt-6 grid gap-5 lg:grid-cols-[1fr_auto]">
        {/* Countdown */}
        <div
          className={`rounded-xl border bg-white/70 p-4 backdrop-blur-sm transition-opacity dark:bg-surface-900/60 ${
            active ? 'border-amber-400/40' : 'border-surface-200 opacity-60 dark:border-surface-800'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              {active ? 'La oferta termina en' : promoForm.enabled ? 'Programada — guardá para activar' : 'Activá para iniciar la cuenta regresiva'}
            </div>
            {active && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                EN VIVO
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <TimeBox value={countdown?.days ?? 0} label="Días" muted={!active} />
            <TimeBox value={countdown?.hours ?? 0} label="Horas" muted={!active} />
            <TimeBox value={countdown?.minutes ?? 0} label="Min" muted={!active} />
            <TimeBox value={countdown?.seconds ?? 0} label="Seg" muted={!active} />
          </div>

          {/* Afectados */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-surface-600 dark:text-surface-400">
            <span className="font-semibold">Planes afectados:</span>
            {planLabels.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300"
              >
                <Check className="h-3 w-3" />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-white/70 p-4 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-900/60 lg:w-[280px]">
          <label className="text-xs space-y-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-surface-700 dark:text-surface-300">
              <Calendar className="h-3.5 w-3.5" />
              Fecha y hora de finalización
            </span>
            <input
              type="datetime-local"
              disabled={!promoForm.enabled}
              value={promoForm.endsAt}
              onChange={(e) => setPromoForm({ ...promoForm, endsAt: e.target.value })}
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:focus:border-amber-500"
            />
          </label>

          <Button
            onClick={onSave}
            isLoading={savingPromo}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Save className="mr-1 h-4 w-4" /> Guardar oferta
          </Button>

          {site && (
            <p className="flex items-center gap-1 text-[10px] text-surface-500">
              <CircleDot className="h-2.5 w-2.5" />
              Actualizado {new Date(site.updatedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Status badge ──────────────────────────────────────────── */
function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Oferta global activa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-300 bg-surface-100 px-2.5 py-0.5 text-[11px] font-bold text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
      <span className="h-1.5 w-1.5 rounded-full bg-surface-400" />
      Oferta inactiva
    </span>
  );
}

/* ── Time box ──────────────────────────────────────────────── */
function TimeBox({ value, label, muted = false }: { value: number; label: string; muted?: boolean }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-lg border p-2 sm:p-3 ${
        muted
          ? 'border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50'
          : 'border-amber-500/25 bg-gradient-to-b from-white to-amber-50/40 shadow-sm dark:from-surface-900 dark:to-amber-500/5'
      }`}
    >
      <span
        className={`text-2xl font-bold tabular-nums sm:text-3xl ${
          muted ? 'text-surface-400 dark:text-surface-600' : 'bg-gradient-to-b from-amber-600 to-orange-500 bg-clip-text text-transparent dark:from-amber-300 dark:to-orange-400'
        }`}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-surface-500 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

/* ── Toggle switch ─────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all ${
        checked
          ? 'border-amber-500/40 bg-gradient-to-r from-amber-500 to-orange-500 shadow-inner shadow-orange-900/20'
          : 'border-surface-300 bg-surface-200 dark:border-surface-700 dark:bg-surface-800'
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {checked ? (
          <Flame className="h-3 w-3 text-orange-500" />
        ) : (
          <Power className="h-3 w-3 text-surface-400" />
        )}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   PLAN CARD
   ══════════════════════════════════════════════════════════════ */
function PlanCard({
  plan,
  form,
  pct,
  saving,
  isAnnual,
  promoActive,
  onChange,
  onSave,
  onAddFeature,
  onRemoveFeature,
  onSetFeature,
}: {
  plan: AdminPlan;
  form: PlanForm;
  pct: number | null;
  saving: boolean;
  isAnnual: boolean;
  promoActive: boolean;
  onChange: (patch: Partial<PlanForm>) => void;
  onSave: () => void;
  onAddFeature: () => void;
  onRemoveFeature: (idx: number) => void;
  onSetFeature: (idx: number, v: string) => void;
}) {
  const accent = isAnnual
    ? { label: 'Anual', tag: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-500/15', icon: Crown, tone: 'emerald' }
    : { label: 'Mensual', tag: 'from-violet-500 to-primary-500', ring: 'ring-violet-500/15', icon: Sparkles, tone: 'violet' };
  const Icon = accent.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm ring-1 transition-shadow hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:shadow-none ${accent.ring}`}
    >
      {/* Esquina decorativa */}
      <div
        className={`pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br ${accent.tag} opacity-10 blur-2xl`}
      />

      {/* Header */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent.tag} text-white shadow-md`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
              Plan {accent.label}
            </p>
            <h3 className="text-base font-bold text-surface-900 dark:text-white">{plan.label}</h3>
          </div>
        </div>

        <ActiveSwitch checked={form.isActive} onChange={(v) => onChange({ isActive: v })} />
      </div>

      {/* Precio preview */}
      <div className="relative mb-5 flex items-end justify-between rounded-xl border border-surface-200 bg-gradient-to-br from-surface-50 to-transparent p-4 dark:border-surface-800 dark:from-surface-800/40">
        <div>
          <div className="flex items-baseline gap-2">
            {form.comparePrice.trim() && Number(form.comparePrice) > Number(form.price) && (
              <span className="text-sm text-surface-400 line-through tabular-nums">
                ${Number(form.comparePrice).toFixed(2)}
              </span>
            )}
            <span className={`bg-gradient-to-r ${accent.tag} bg-clip-text text-3xl font-bold tabular-nums text-transparent`}>
              ${Number(form.price || 0).toFixed(2)}
            </span>
            <span className="text-xs text-surface-500">USD{isAnnual ? ' / año' : ' / mes'}</span>
          </div>
          {pct !== null && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-600 dark:text-violet-300">
                <TrendingDown className="h-3 w-3" />
                {pct}% OFF
              </span>
              <span className="text-[11px] text-surface-500">
                Ahorra ${(Number(form.comparePrice) - Number(form.price)).toFixed(2)}
              </span>
              {promoActive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                  <Flame className="h-2.5 w-2.5" />
                  visible en la web
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <Field label="Etiqueta" icon={TagIcon}>
          <Input value={form.label} onChange={(v) => onChange({ label: v })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio actual (USD)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(v) => onChange({ price: v })}
            />
          </Field>
          <Field label="Precio anterior (tachado)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.comparePrice}
              placeholder="ej: 24"
              onChange={(v) => onChange({ comparePrice: v })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Badge">
            <Input
              value={form.badge}
              placeholder="Flexible"
              onChange={(v) => onChange({ badge: v })}
            />
          </Field>
          <Field label="Ahorro (opcional)">
            <Input
              value={form.savings}
              placeholder="17%"
              onChange={(v) => onChange({ savings: v })}
            />
          </Field>
        </div>

        {/* Features */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-surface-500">
              Beneficios
            </label>
            <button
              onClick={onAddFeature}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-surface-300 px-2 py-0.5 text-[11px] font-semibold text-primary-600 transition-colors hover:border-primary-500 hover:bg-primary-500/5 dark:border-surface-700 dark:text-primary-400"
            >
              <Plus className="h-3 w-3" /> Agregar
            </button>
          </div>
          <ul className="space-y-2">
            {form.features.map((feat, idx) => (
              <li key={idx} className="group flex items-center gap-2">
                <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent.tag} text-white`}>
                  <Check className="h-3 w-3" />
                </div>
                <input
                  value={feat}
                  onChange={(e) => onSetFeature(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-800 dark:bg-surface-800"
                />
                <button
                  onClick={() => onRemoveFeature(idx)}
                  className="rounded p-1 text-red-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  aria-label="Eliminar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {form.features.length === 0 && (
              <li className="rounded-lg border border-dashed border-surface-300 py-3 text-center text-[11px] text-surface-500 dark:border-surface-700">
                Sin beneficios — agregá el primero
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-surface-200 pt-4 dark:border-surface-800">
          <span className="text-[11px] text-surface-500">
            {form.features.filter((x) => x.trim()).length} beneficio{form.features.filter((x) => x.trim()).length === 1 ? '' : 's'} · {form.isActive ? 'Visible' : 'Oculto'} en la web
          </span>
          <Button
            onClick={onSave}
            isLoading={saving}
            className={`bg-gradient-to-r ${accent.tag} hover:brightness-110`}
          >
            <Save className="mr-1 h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── ActiveSwitch (pill compacto) ──────────────────────────── */
function ActiveSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
        checked
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
          : 'border-surface-300 bg-surface-100 text-surface-500 dark:border-surface-700 dark:bg-surface-800'
      }`}
    >
      <span
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-700'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      {checked ? 'Activo' : 'Inactivo'}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   FORM BITS
   ══════════════════════════════════════════════════════════════ */
function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof TagIcon;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs space-y-1.5">
      <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[11px] text-surface-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      {children}
    </label>
  );
}

/* ══════════════════════════════════════════════════════════════
   CINTA PROMOCIONAL DEL SITIO
   ══════════════════════════════════════════════════════════════ */
function RibbonSection({
  ribbonForm,
  setRibbonForm,
  saving,
  onSave,
  promoActive,
}: {
  ribbonForm: { enabled: boolean; text: string; secondaryText: string; showCountdown: boolean; ctaText: string; ctaUrl: string };
  setRibbonForm: (v: any) => void;
  saving: boolean;
  onSave: () => void;
  promoActive: boolean;
}) {
  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-primary-500 text-white shadow-md">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-surface-900 dark:text-white">Cinta promocional del sitio</h2>
              {ribbonForm.enabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Visible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-300 bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-surface-500 dark:border-surface-700 dark:bg-surface-800">
                  Oculta
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs text-surface-500">
              Banner que aparece encima del navbar en la home y páginas públicas. La cuenta regresiva, si está activa,
              usa la <strong>misma fecha de fin del Modo oferta global</strong>.
            </p>
          </div>
        </div>
        <Toggle
          checked={ribbonForm.enabled}
          onChange={(v) => setRibbonForm({ ...ribbonForm, enabled: v })}
        />
      </div>

      <div
        className={`mt-5 grid gap-4 sm:grid-cols-2 transition-opacity ${
          !ribbonForm.enabled ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <Field label="Texto principal">
          <Input
            value={ribbonForm.text}
            placeholder="Oferta por tiempo limitado"
            onChange={(v) => setRibbonForm({ ...ribbonForm, text: v })}
          />
        </Field>
        <Field label="Texto secundario (opcional)">
          <Input
            value={ribbonForm.secondaryText}
            placeholder="Hasta 50% OFF en todos los planes"
            onChange={(v) => setRibbonForm({ ...ribbonForm, secondaryText: v })}
          />
        </Field>

        <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs dark:border-surface-800 dark:bg-surface-800/50">
          <input
            type="checkbox"
            checked={ribbonForm.showCountdown}
            onChange={(e) => setRibbonForm({ ...ribbonForm, showCountdown: e.target.checked })}
            className="accent-violet-500"
          />
          <span className="font-semibold text-surface-700 dark:text-surface-300">Mostrar countdown</span>
          <span className="text-[10px] text-surface-500">
            (usa la fecha del Modo oferta global{!promoActive && ' — actualmente inactivo'})
          </span>
        </label>

        <Field label="Texto del botón">
          <Input
            value={ribbonForm.ctaText}
            placeholder="Ver planes"
            onChange={(v) => setRibbonForm({ ...ribbonForm, ctaText: v })}
          />
        </Field>
        <Field label="URL del botón">
          <Input
            value={ribbonForm.ctaUrl}
            placeholder="/#pricing"
            onChange={(v) => setRibbonForm({ ...ribbonForm, ctaUrl: v })}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-end border-t border-surface-200 pt-4 dark:border-surface-800">
        <Button
          onClick={onSave}
          isLoading={saving}
          className="bg-gradient-to-r from-violet-500 to-primary-500 hover:brightness-110"
        >
          <Save className="mr-1 h-4 w-4" /> Guardar cinta
        </Button>
      </div>
    </section>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      min={min}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-800 dark:bg-surface-800"
    />
  );
}
