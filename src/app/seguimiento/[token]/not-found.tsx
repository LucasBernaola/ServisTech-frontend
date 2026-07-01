import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen necotec-bg text-white">
      <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
        <div className="panel p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl font-semibold">
            Orden no encontrada
          </h1>
          <p className="mt-2 text-sm text-white/70">
            El enlace de seguimiento no es válido o la orden ya no existe.
          </p>
          <Link
            href="/"
            className="btn btn-secondary mt-4 sm:mt-5"
          >
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
