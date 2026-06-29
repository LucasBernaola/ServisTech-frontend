"use client";

import React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function PhotoPicker({
  files,
  setFiles,
  maxFiles = 8,
  maxMB = 5,
}: {
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles?: number;
  maxMB?: number;
}) {
  const [previews, setPreviews] = React.useState<string[]>([]);

  React.useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const filtered = Array.from(list).filter(
      (f) => f.type.startsWith("image/") && f.size <= maxMB * 1024 * 1024
    );
    setFiles([...files, ...filtered].slice(0, maxFiles));
  };

  const removeAt = (idx: number) => {
    const next = files.slice();
    next.splice(idx, 1);
    setFiles(next);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white/85">
            Fotos de ingreso
          </div>
          <div className="text-xs text-white/50">
            Hasta {maxFiles} fotos, máx {maxMB}MB c/u.
          </div>
        </div>

        <label className="cursor-pointer flex-shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15 active:bg-white/20 transition-colors">
          + Agregar
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
      </div>

      {files.length === 0 ? (
        /*
          En mobile el área vacía también sirve de zona táctil de pick,
          más cómoda que el botón chico.
        */
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center transition hover:border-white/25 hover:bg-black/30 active:bg-black/40">
          <Camera className="h-7 w-7 text-white/45" />
          <span className="text-xs text-white/50">
            Sin fotos — tocá para agregar
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
      ) : (
        <>
          {/*
            Grid:
            - mobile:  2 columnas
            - sm+:     3 columnas
            - md+:     4 columnas
          */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
              >
                <Image
                  src={previews[i]}
                  alt={f.name}
                  width={320}
                  height={224}
                  unoptimized
                  className="h-24 w-full object-cover sm:h-28"
                />

                <div className="p-2">
                  <div className="truncate text-xs text-white/80">{f.name}</div>
                  <div className="text-[11px] text-white/45">
                    {formatBytes(f.size)}
                  </div>
                </div>

                {/*
                  Botón quitar:
                  - Desktop: aparece on hover (opacity-0 group-hover:opacity-100)
                  - Mobile:  siempre visible (opacity-100) porque hover no existe
                */}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="
                    absolute right-1.5 top-1.5
                    rounded-lg border border-white/10 bg-black/60
                    px-2 py-1 text-[11px] text-white/90
                    transition-opacity
                    opacity-100
                    sm:opacity-0 sm:group-hover:opacity-100
                    hover:bg-black/80 active:bg-black/90
                  "
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          {/* Botón secundario para agregar más fotos cuando ya hay algunas */}
          {files.length < maxFiles && (
            <label className="mt-2.5 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2.5 text-xs text-white/50 transition hover:border-white/25 hover:text-white/70 active:bg-white/5">
              + Agregar más fotos ({files.length}/{maxFiles})
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPick(e.target.files)}
              />
            </label>
          )}
        </>
      )}
    </div>
  );
}
