"use client";

import { useState } from "react";

type ActivoFormData = {
  name: string;
  barcode: string;
  ubicacion: string;
  descripcion: string;
  estado: "DISPONIBLE" | "PRESTADO" | "MANTENIMIENTO" | "RETIRADO";
};

type ModalActivoProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (activo: {
    id: number;
    name: string;
    barcode?: string | null;
    descripcion?: string | null;
    estado: string;
    ubicacion?: string | null;
  }) => void;
};

const initialData: ActivoFormData = {
  name: "",
  barcode: "",
  ubicacion: "",
  descripcion: "",
  estado: "DISPONIBLE",
};

export default function ModalActivo({ open, onClose, onCreated }: ModalActivoProps) {
  const [form, setForm] = useState<ActivoFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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
      const response = await fetch("/api/activos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "No se pudo crear el activo.");
        return;
      }

      onCreated(result.activo);
      setForm(initialData);
    } catch {
      setError("Error de red al crear el activo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Agregar nuevo activo</h2>
            <p className="mt-2 text-sm text-slate-600">Registra el activo con su código de barras y ubicación.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-300">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Nombre del activo
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="123456789012"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Ubicación
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="Aula 101"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Estado
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
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
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="Detalles adicionales"
            />
          </label>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Guardando..." : "Registrar activo"}
          </button>
        </form>
      </div>
    </div>
  );
}
