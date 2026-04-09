import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0f16] text-white">
      <div className="mx-auto w-full max-w-xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl font-semibold">
            Orden no encontrada
          </h1>
          <p className="mt-2 text-sm text-white/70">
            El enlace de seguimiento no es válido o la orden ya no existe.
          </p>
          <Link
            href="/"
            className="mt-4 sm:mt-5 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}