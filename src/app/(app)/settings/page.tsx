"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Pencil, ShieldCheck } from "lucide-react";
import { apiRequest, getErrorMessage } from "@/lib/api/http";

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

function Alert({ type, text }: { type: "success" | "error"; text: string }) {
  const cls =
    type === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : "border-red-400/25 bg-red-400/10 text-red-100";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm whitespace-pre-line ${cls}`}>
      {text}
    </div>
  );
}

function EditableInput(props: {
  label: string;
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
    value,
    type = "text",
    placeholder,
    autoComplete,
    editable,
    onToggleEditable,
    onChange,
  } = props;

  return (
    <label className="block">
      <span className="text-sm text-white/70">{label}</span>
      <div className="relative mt-2">
        <input
          className={`input pr-11 ${editable ? "border-amber-300/45" : ""}`}
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
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08]"
          aria-label={editable ? "Confirmar edicion" : "Editar campo"}
        >
          {editable ? (
            <Check className="h-4 w-4 text-emerald-300" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <span className="text-sm text-white/70">{label}</span>
      <div className="relative mt-2">
        <input
          className="input pr-11"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08]"
          aria-label={show ? "Ocultar contrasena" : "Mostrar contrasena"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
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

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.username !== profile.username ||
      form.first_name !== profile.first_name ||
      form.last_name !== profile.last_name ||
      form.email !== (profile.email || "")
    );
  }, [form, profile]);

  const canSavePassword =
    passwordForm.old_password.length > 0 &&
    passwordForm.new_password.length > 0 &&
    passwordForm.confirm_password.length > 0;

  async function saveProfile() {
    setSaving(true);
    setErr(null);
    setMsg(null);

    try {
      const updated = await apiRequest<Profile>("/api/profile/", {
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
      setErr(getErrorMessage(e, "No se pudo actualizar el perfil."));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setErr(null);
    setMsg(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErr("La nueva contrasena y la confirmacion no coinciden.");
      return;
    }

    setSavingPassword(true);

    try {
      await apiRequest<{ detail: string }>("/api/profile/change-password/", {
        method: "POST",
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setMsg("Contrasena actualizada.");
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "No se pudo actualizar la contrasena."));
    } finally {
      setSavingPassword(false);
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
        const data = await apiRequest<Profile>("/api/profile/");
        setProfile(data);
        setForm({
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || "",
        });
      } catch (e: unknown) {
        setErr(getErrorMessage(e, "No se pudo cargar el perfil."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="panel p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-20 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200/70">
            Cuenta
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Ajustes</h2>
          <p className="mt-1 text-sm text-white/50">
            Datos del usuario activo y seguridad de acceso.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="btn btn-secondary"
            onClick={resetProfileForm}
            disabled={!isDirty || saving}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={saveProfile}
            disabled={!isDirty || saving}
          >
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </div>

      {msg ? <Alert type="success" text={msg} /> : null}
      {err ? <Alert type="error" text={err} /> : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white">Perfil</h3>
          <p className="mt-0.5 text-xs text-white/45">
            Edita solo los campos que necesites actualizar.
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
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
            type="email"
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
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="panel overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white">Seguridad</h3>
            <p className="mt-0.5 text-xs text-white/45">
              Cambia la contrasena usando la clave actual.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-3">
            <PasswordInput
              label="Actual"
              value={passwordForm.old_password}
              onChange={(value) =>
                setPasswordForm((s) => ({ ...s, old_password: value }))
              }
              autoComplete="current-password"
            />
            <PasswordInput
              label="Nueva"
              value={passwordForm.new_password}
              onChange={(value) =>
                setPasswordForm((s) => ({ ...s, new_password: value }))
              }
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirmar"
              value={passwordForm.confirm_password}
              onChange={(value) =>
                setPasswordForm((s) => ({ ...s, confirm_password: value }))
              }
              autoComplete="new-password"
            />
          </div>

          <div className="border-t border-white/10 p-4">
            <button
              className="btn btn-secondary w-full sm:w-auto"
              onClick={savePassword}
              disabled={!canSavePassword || savingPassword}
            >
              {savingPassword ? "Actualizando..." : "Actualizar contrasena"}
            </button>
          </div>
        </div>

        <aside className="panel p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/10">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Permisos</h3>
              <p className="text-xs text-white/45">Estado del usuario actual</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-white/50">Superuser</span>
              <span className="text-white/85">{profile?.is_superuser ? "Si" : "No"}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-white/50">Staff</span>
              <span className="text-white/85">{profile?.is_staff ? "Si" : "No"}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-white/50">Activo</span>
              <span className="text-white/85">{profile?.is_active ? "Si" : "No"}</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
