"use client";

import React from "react";

type Props = {
  value: string; // "1-2-5-8"
  onChange: (v: string) => void;
  disabled?: boolean;
  size?: number; // px — ahora es el máximo, no el fijo
};

type Pt = { x: number; y: number };

const N = 3;

function parse(value: string): number[] {
  if (!value) return [];
  return value
    .split("-")
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 9);
}

function toString(seq: number[]) {
  return seq.join("-");
}

export function PatternLock({ value, onChange, disabled, size = 260 }: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Tamaño real del canvas, calculado a partir del contenedor disponible
  const [canvasSize, setCanvasSize] = React.useState(size);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const obs = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? size;
      // Clampear entre 180 (mínimo usable táctil) y el size prop como máximo
      setCanvasSize(Math.min(size, Math.max(180, Math.floor(width))));
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, [size]);

  const [dragging, setDragging] = React.useState(false);
  const [pointer, setPointer] = React.useState<Pt | null>(null);

  const seq = React.useMemo(() => parse(value), [value]);

  const pad = 28;
  const step = (canvasSize - pad * 2) / (N - 1);

  const points = React.useMemo(() => {
    const arr: { id: number; p: Pt }[] = [];
    let id = 1;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        arr.push({
          id,
          p: { x: pad + c * step, y: pad + r * step },
        });
        id++;
      }
    }
    return arr;
  }, [step]);

  const getLocalPoint = (e: PointerEvent | React.PointerEvent): Pt | null => {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Radio de enganche escalado al tamaño del canvas
  const hitRadius = Math.max(16, Math.round(canvasSize * 0.07));

  const hitTest = (p: Pt): number | null => {
    for (const pt of points) {
      const dx = p.x - pt.p.x;
      const dy = p.y - pt.p.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return pt.id;
    }
    return null;
  };

  const last = seq.length ? seq[seq.length - 1] : null;

  const addNode = (id: number) => {
    if (disabled) return;
    if (last === id) return;
    onChange(toString([...seq, id]));
  };

  const clear = () => {
    if (disabled) return;
    onChange("");
    setPointer(null);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = getLocalPoint(e);
    if (!p) return;
    setDragging(true);
    setPointer(p);
    const hit = hitTest(p);
    if (hit) addNode(hit);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || disabled) return;
    const p = getLocalPoint(e);
    if (!p) return;
    setPointer(p);
    const hit = hitTest(p);
    if (hit) addNode(hit);
  };

  const onPointerUp = () => {
    setDragging(false);
    setPointer(null);
  };

  const selectedPts = seq
    .map((id) => points.find((x) => x.id === id)?.p)
    .filter(Boolean) as Pt[];

  const pathD = selectedPts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const tailD =
    dragging && pointer && selectedPts.length
      ? `${pathD} L ${pointer.x} ${pointer.y}`
      : pathD;

  const minOk = seq.length >= 3;

  // Tamaño de los dots escalado
  const dotSize = Math.max(16, Math.round(canvasSize * 0.075));
  const ringSize = Math.round(dotSize * 1.4);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-white/60">
          Dibujá el patrón (mín. 3 puntos)
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || seq.length === 0}
          className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 active:bg-white/15 disabled:opacity-40 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Contenedor que mide el ancho disponible */}
      <div ref={wrapRef} className="mt-3 w-full flex justify-center">
        <div
          ref={ref}
          style={{
            width: canvasSize,
            height: canvasSize,
            touchAction: "none",
          }}
          className="relative rounded-2xl border border-white/10 bg-[#0f172a]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => dragging && onPointerUp()}
        >
          {/* Líneas SVG */}
          <svg
            width={canvasSize}
            height={canvasSize}
            className="absolute inset-0"
            aria-hidden="true"
          >
            <path
              d={tailD}
              fill="none"
              stroke="rgba(199, 210, 254, 0.85)"
              strokeWidth={Math.max(4, Math.round(canvasSize * 0.022))}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Dots */}
          {points.map(({ id, p }) => {
            const active = seq.includes(id);
            return (
              <div
                key={id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: p.x, top: p.y }}
              >
                {/* Ring exterior (solo cuando activo) */}
                {active && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: ringSize,
                      height: ringSize,
                    }}
                  />
                )}
                <div
                  style={{ width: dotSize, height: dotSize }}
                  className={[
                    "rounded-full border transition-all",
                    active
                      ? "border-indigo-300/70 bg-indigo-300/30"
                      : "border-white/25 bg-white/10",
                  ].join(" ")}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 text-xs text-white/50 flex items-center justify-between gap-2">
        <span className="truncate">
          {seq.length ? `Patrón: ${toString(seq)}` : "—"}
        </span>
        <span
          className={[
            "flex-shrink-0",
            minOk ? "text-emerald-200/80" : "text-white/40",
          ].join(" ")}
        >
          {minOk ? "OK" : "mín. 3 puntos"}
        </span>
      </div>
    </div>
  );
}
