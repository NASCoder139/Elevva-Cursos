import { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const SEGMENTS = 20;
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const target = useRef({ x: 0, y: 0 });
  const points = useRef(
    Array.from({ length: SEGMENTS }, () => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    const move = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const isInteractive = el.closest(
        'a, button, [role="button"], input, textarea, select, .cursor-pointer'
      );
      setHovering(!!isInteractive);
    };

    let raf = 0;

    const animate = () => {
      points.current[0].x += (target.current.x - points.current[0].x) * 0.22;
      points.current[0].y += (target.current.y - points.current[0].y) * 0.22;

      for (let i = 1; i < SEGMENTS; i++) {
        points.current[i].x += (points.current[i - 1].x - points.current[i].x) * 0.18;
        points.current[i].y += (points.current[i - 1].y - points.current[i].y) * 0.18;
      }

      points.current.forEach((point, i) => {
        const el = segmentRefs.current[i];
        if (!el) return;

        const scaleBase = 1 - i / (SEGMENTS * 1.15);
        const scale = clicking ? scaleBase * 0.85 : hovering ? scaleBase * 1.08 : scaleBase;

        el.style.transform = `translate(${point.x}px, ${point.y}px) scale(${scale})`;
        el.style.opacity = `${1 - i / (SEGMENTS * 1.25)}`;
      });

      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mousemove', checkHover);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);

    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousemove', checkHover);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      cancelAnimationFrame(raf);
    };
  }, [clicking, hovering]);

  return (
    <>
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const isHead = i === 0;
        const size = Math.max(8, 20 - i * 0.8);

        return (
          <div
            key={i}
            ref={(el) => {
              segmentRefs.current[i] = el;
            }}
            className="fixed top-0 left-0 z-[9999] pointer-events-none hidden lg:block"
            style={{
              width: size,
              height: size,
              marginLeft: -(size / 2),
              marginTop: -(size / 2),
              willChange: 'transform, opacity',
            }}
          >
            <div
              className={`h-full w-full rounded-full transition-all duration-200 ${isHead
                ? hovering
                  ? 'bg-primary-300 shadow-[0_0_18px_rgba(167,139,250,0.9)]'
                  : 'bg-surface-900 dark:bg-white shadow-[0_0_12px_rgba(0,0,0,0.3)] dark:shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                : hovering
                  ? 'bg-primary-400/70'
                  : 'bg-primary-500/45'
                }`}
            />
          </div>
        );
      })}
    </>
  );
}
