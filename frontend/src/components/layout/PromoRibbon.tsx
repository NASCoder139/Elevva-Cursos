import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { settingsApi, type PromoRibbonPublic } from '../../api/settings.api';

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const endMs = new Date(target).getTime();
  if (isNaN(endMs)) return null;
  const diff = Math.max(0, endMs - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: diff === 0,
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function PromoRibbon() {
  const [config, setConfig] = useState<PromoRibbonPublic | null>(null);

  useEffect(() => {
    settingsApi
      .getPromoRibbon()
      .then((r) => setConfig(r.data.data))
      .catch(() => setConfig(null));
  }, []);

  const cd = useCountdown(config?.showCountdown ? config.endsAt : null);

  if (!config || !config.enabled) return null;
  if (config.showCountdown && cd?.ended) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-surface-950 via-[#1b1030] to-surface-950 border-b border-violet-500/15">
      {/* Subtle top-glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 py-2.5 text-center sm:text-left">
          {/* Icon */}
          <div className="hidden sm:flex items-center justify-center h-6 w-6 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300">
            <Sparkles className="h-3 w-3" />
          </div>

          {/* Text block */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[12.5px] sm:text-[13px] leading-tight">
            <span className="font-semibold text-white">{config.text}</span>
            {config.secondaryText && (
              <>
                <span className="hidden sm:inline text-violet-400/50">·</span>
                <span className="text-surface-300 dark:text-surface-300">{config.secondaryText}</span>
              </>
            )}
          </div>

          {/* Countdown */}
          {config.showCountdown && cd && (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-violet-400/50">·</span>
              <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
                {cd.days > 0 && (
                  <>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-semibold">
                      {cd.days}d
                    </span>
                  </>
                )}
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-semibold">
                  {pad(cd.hours)}
                </span>
                <span className="text-surface-500">:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-semibold">
                  {pad(cd.minutes)}
                </span>
                <span className="text-surface-500">:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-white font-semibold">
                  {pad(cd.seconds)}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          {config.ctaText && config.ctaUrl && (
            <Link
              to={config.ctaUrl}
              className="group inline-flex items-center gap-1 text-[12.5px] font-semibold text-violet-300 hover:text-white transition-colors duration-300"
            >
              {config.ctaText}
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          )}
        </div>
      </div>

      {/* Subtle bottom-glow line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
    </div>
  );
}
