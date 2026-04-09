"use client"

type Cliente = {
  id: number
  nombre?: string
  apellido?: string
  dni?: string
  celular?: string
  email?: string
}

export default function DashboardClientsTable({ rows }: { rows: Cliente[] }) {
  if (!rows?.length) {
    return (
      <div className="p-4 md:p-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/70">
          No hay clientes recientes para mostrar.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5">
      {/* 🔹 MOBILE (cards) */}
      <div className="space-y-3 md:hidden">
        {rows.map((c) => {
          const apellido = (c.apellido || "").trim()
          const nombre = (c.nombre || "").trim()

          return (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-white/80 text-sm">#{c.id}</div>
              </div>

              <div className="mt-2 text-white/90 font-medium">
                {apellido || nombre ? (
                  <>
                    {apellido || "—"}
                    {nombre ? `, ${nombre}` : ""}
                  </>
                ) : (
                  "—"
                )}
              </div>

              {c.email && (
                <div className="text-xs text-white/50 mt-1">{c.email}</div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                <div>
                  <span className="block text-white/40">DNI</span>
                  {c.dni || "—"}
                </div>
                <div>
                  <span className="block text-white/40">Celular</span>
                  {c.celular || "—"}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 🔹 DESKTOP (tabla) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/3 text-white/70">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Celular</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/8">
            {rows.map((c) => {
              const apellido = (c.apellido || "").trim()
              const nombre = (c.nombre || "").trim()

              return (
                <tr key={c.id} className="hover:bg-white/3 transition">
                  <td className="px-4 py-3 text-white/85">#{c.id}</td>

                  <td className="px-4 py-3">
                    <div className="text-white/85">
                      {apellido || nombre ? (
                        <>
                          <span className="font-medium">
                            {apellido || "—"}
                          </span>
                          {nombre ? `, ${nombre}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    {c.email && (
                      <div className="text-xs text-white/50">
                        {c.email}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-white/70">
                    {c.dni || "—"}
                  </td>

                  <td className="px-4 py-3 text-white/70">
                    {c.celular || "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}