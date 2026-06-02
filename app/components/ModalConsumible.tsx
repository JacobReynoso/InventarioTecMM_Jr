"use client";

import React, { useState } from "react";

type ConsumibleFormData = {
  id?: number;
  name: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
};

type ConsumibleSeed =
  | Partial<ConsumibleFormData>
  | {
      id?: number;
      name?: string;
      categoria?: string | null;
      stock?: number | null;
      stockMinimo?: number | null;
    }
  | null
  | undefined;

interface ModalConsumibleProps {
  open: boolean;
  onClose: () => void;
  onSaved: (consumible: {
    id: number;
    name: string;
    categoria?: string | null;
    stock: number;
    stockMinimo: number;
  }) => void;
  initialConsumible?: ConsumibleSeed;
  mode?: "create" | "edit";
}

const initialData: ConsumibleFormData = {
  name: "",
  categoria: "",
  stock: 0,
  stockMinimo: 5,
};

function buildInitialForm(initialConsumible: ConsumibleSeed): ConsumibleFormData {
  return {
    ...initialData,
    id: initialConsumible?.id,
    name: initialConsumible?.name ?? "",
    categoria: initialConsumible?.categoria ?? "",
    stock: Number(initialConsumible?.stock ?? 0),
    stockMinimo: Number(initialConsumible?.stockMinimo ?? 5),
  };
}

export default function ModalConsumible({
  open,
  onClose,
  onSaved,
  initialConsumible,
  mode = "create",
}: ModalConsumibleProps) {
  const [formData, setFormData] = useState<ConsumibleFormData>(() => buildInitialForm(initialConsumible));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "stock" || name === "stockMinimo" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("El nombre del consumible es requerido");
      return;
    }

    setLoading(true);

    try {
      const token = window.localStorage.getItem("inventario_token");
      const response = await fetch("/api/consumibles", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (mode === "edit" ? "Error al actualizar el consumible" : "Error al crear el consumible"));
      }

      const data = await response.json();

      onSaved(data.consumible ?? data);
      setFormData(initialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white text-slate-900 shadow-lg">
        <div className="border-b border-slate-200 px-6 py-4 bg-white">
          <h2 className="text-xl font-bold text-slate-900">{mode === "edit" ? "Editar Consumible" : "Nuevo Consumible"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-100 text-rose-800 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              placeholder="Ej: Tinta negra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categoría
            </label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              placeholder="Ej: Suministros"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stock Inicial
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stock Mínimo
            </label>
            <input
              type="number"
              name="stockMinimo"
              value={formData.stockMinimo}
              onChange={handleChange}
              min="1"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Guardando..." : mode === "edit" ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
