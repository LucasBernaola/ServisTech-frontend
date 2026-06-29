"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Check, Eye, EyeOff } from "lucide-react";

type Profile = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string | null;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
};

type EditableKey = "username" | "email" | "first_name" | "last_name";
type ApiErrorBody = Record<string, unknown> & { detail?: unknown };

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return base.replace(/\/+$/, "");
}

function normalizeError(err: unknown): string {
  if (!err) return "Error inesperado.";
  if (typeof err === "string") return err;

  if (typeof err !== "object") return "Error inesperado.";

  const body = err as ApiErrorBody;
  if (body.detail) return String(body.detail);

  const entries = Object.entries(body);
  if (!entries.length) return "Error inesperado.";
  return entries
    .map(([k, v]) =>
      Array.isArray(v) ? `${k}: ${v.join(" ")}` : `${k}: ${String(v)}`
    )
    .join("\n");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {}
    throw data || { detail: `HTTP ${res.status}` };
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

function Alert({ type, text }: { type: "success" | "error" | "info"; text: string }) {
  const base = "rounded-xl border px-4 py-3 text-sm whitespace-pre-line";
  const cls =
    type === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : type === "error"
      ? "border-red-400/25 bg-red-400/10 text-red-200"
      : "border-white/15 bg-white/5 text-white/70";
  return <div className={`${base} ${cls}`}>{text}</div>;
}

function EditableInput(props: {
  label: string;
  hint?: string;
  value: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  editable: boolean;
  onToggleEditable: () => void;
  onChange: (v: string) => void;
}) {
  const {
    label,
    hint,
    value,
    type = "text",
    placeholder,
    autoComplete,
    editable,
    onToggleEditable,
    onChange,
  } = props;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-white/80">{label}</span>
        {hint && <span className="text-white/50 text-xs">{hint}</span>}
      </div>

      <div className="mt-2 relative">
        <input
          className={`w-full rounded-xl px-3 py-2 pr-11 text-sm border bg-white/5 transition
          ${editable ? "border-white/30" : "border-white/15"}
          focus:ring-2 focus:ring-white/10`}
          readOnly={!editable}
          value={value}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          type="button"
          onClick={onToggleEditable}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg border border-white/10 bg-white/5 grid place-items-center"
        >
          {editable ? (
            <Check className="h-4 w-4 text-emerald-300" />
          ) : (
            <Pencil className="h-4 w-4 text-white/70" />
          )}
        </button>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value = "",
  onChange,
  readOnly,
  autoComplete,
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <span className="text-sm text-white/80">{label}</span>

      <div className="mt-2 relative">
        <input
          className="w-full rounded-xl px-3 py-2 pr-11 text-sm border bg-white/5"
          readOnly={readOnly}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg border border-white/10 bg-white/5"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
  });

  const [editable, setEditable] = useState<Record<EditableKey, boolean>>({
    username: false,
    email: false,
    first_name: false,
    last_name: false,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [pwEditable, setPwEditable] = useState(false);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.username !== profile.username ||
      form.first_name !== profile.first_name ||
      form.last_name !== profile.last_name ||
      form.email !== (profile.email || "")
    );
  }, [form, profile]);

  async function saveProfile() {
    setSaving(true);
    setErr(null);
    setMsg(null);

    try {
      const updated = await apiFetch<Profile>("/api/profile/", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setForm({
        username: updated.username,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email || "",
      });
      setEditable({
        username: false,
        email: false,
        first_name: false,
        last_name: false,
      });
      setMsg("Perfil actualizado.");
    } catch (e: unknown) {
      setErr(normalizeError(e));
    } finally {
      setSaving(false);
    }
  }

  function resetProfileForm() {
    if (!profile) return;
    setForm({
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email || "",
    });
    setEditable({
      username: false,
      email: false,
      first_name: false,
      last_name: false,
    });
    setMsg(null);
    setErr(null);
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Profile>("/api/profile/");
        setProfile(data);
        setForm({
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || "",
        });
      } catch (e: unknown) {
        setErr(normalizeError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-10">
      {/* HEADER */}
      <div className="card p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Configuración</h1>
          <p className="text-sm text-white/60">Perfil y seguridad</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            className="btn btn-secondary w-full sm:w-auto"
            onClick={resetProfileForm}
            disabled={!isDirty || saving}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={saveProfile}
            disabled={!isDirty || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {msg ? <Alert type="success" text={msg} /> : null}
      {err ? <Alert type="error" text={err} /> : null}

      {/* PERFIL */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Perfil</h2>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableInput
            label="Usuario"
            value={form.username}
            editable={editable.username}
            onToggleEditable={() =>
              setEditable((s) => ({ ...s, username: !s.username }))
            }
            onChange={(v) => setForm((s) => ({ ...s, username: v }))}
          />

          <EditableInput
            label="Email"
            value={form.email}
            editable={editable.email}
            onToggleEditable={() =>
              setEditable((s) => ({ ...s, email: !s.email }))
            }
            onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          />

          <EditableInput
            label="Nombre"
            value={form.first_name}
            editable={editable.first_name}
            onToggleEditable={() =>
              setEditable((s) => ({ ...s, first_name: !s.first_name }))
            }
            onChange={(v) => setForm((s) => ({ ...s, first_name: v }))}
          />

          <EditableInput
            label="Apellido"
            value={form.last_name}
            editable={editable.last_name}
            onToggleEditable={() =>
              setEditable((s) => ({ ...s, last_name: !s.last_name }))
            }
            onChange={(v) => setForm((s) => ({ ...s, last_name: v }))}
          />
        </div>
      </div>

      {/* SEGURIDAD */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <h2 className="text-lg font-semibold">Seguridad</h2>

          <button
            className="btn btn-secondary w-full sm:w-auto"
            onClick={() => setPwEditable((v) => !v)}
          >
            {pwEditable ? "Cancelar" : "Editar contraseña"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <PasswordInput label="Actual" readOnly={!pwEditable} />
          <PasswordInput label="Nueva" readOnly={!pwEditable} />
          <PasswordInput label="Confirmar" readOnly={!pwEditable} />
        </div>
      </div>
    </div>
  );
}
