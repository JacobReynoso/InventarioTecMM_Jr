"use client";

import { useState } from "react";

type ActivoFormData = {
  id?: number;
  name: string;
  barcode: string;
  ubicacion: string;
  descripcion: string;
  estado: "DISPONIBLE" | "PRESTADO" | "MANTENIMIENTO" | "RETIRADO";
};

type ActivoSeed =
  | Partial<ActivoFormData>
  | {
      id?: number;
      name?: string;
      barcode?: string | null;
      ubicacion?: string | null;
      descripcion?: string | null;
      estado?: string;
    }
  | null
  | undefined;

type ModalActivoProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (activo: {
    id: number;
    name: string;
    barcode?: string | null;
    descripcion?: string | null;
    estado: string;
    ubicacion?: string | null;
  }) => void;
  initialActivo?: ActivoSeed;
  mode?: "create" | "edit";
};

const initialData: ActivoFormData = {
  name: "",
  barcode: "",
  ubicacion: "",
  descripcion: "",
  estado: "DISPONIBLE",
};

function buildInitialForm(initialActivo: ActivoSeed): ActivoFormData {
  return {
    ...initialData,
    id: initialActivo?.id,
    name: initialActivo?.name ?? "",
    barcode: initialActivo?.barcode ?? "",
    ubicacion: initialActivo?.ubicacion ?? "",
    descripcion: initialActivo?.descripcion ?? "",
    estado: (initialActivo?.estado as ActivoFormData["estado"]) ?? "DISPONIBLE",
  };
}

export default function ModalActivo({
  open,
  onClose,
  onSaved,
  initialActivo,
  mode = "create",
}: ModalActivoProps) {
  const [form, setForm] = useState<ActivoFormData>(() => buildInitialForm(initialActivo));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!form.name.trim()) {
      setError("El nombre del activo es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = window.localStorage.getItem("inventario_token");
      const response = await fetch("/api/activos", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || (mode === "edit" ? "No se pudo actualizar el activo." : "No se pudo crear el activo.")
        );
        return;
      }

      onSaved(result.activo);
      setForm(initialData);
    } catch {
      setError(mode === "edit" ? "Error de red al actualizar el activo." : "Error de red al crear el activo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-white text-slate-900 shadow-lg">
        <div className="border-b border-slate-200 px-6 py-4 bg-white">
          <h2 className="text-xl font-bold text-slate-900">{mode === "edit" ? "Editar activo" : "Nuevo Activo"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "edit"
              ? "Actualiza el activo con su información."
              : "Registra el activo con su código de barras y ubicación."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Nombre del activo
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              placeholder="Laptop, proyector, mueble"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Código de barras
            <input
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              placeholder="123456789012"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Ubicación
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              placeholder="Aula 101"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Estado
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="PRESTADO">Prestado</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="RETIRADO">Retirado</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              placeholder="Detalles adicionales"
            />
          </label>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Guardando..." : mode === "edit" ? "Actualizar activo" : "Registrar activo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
