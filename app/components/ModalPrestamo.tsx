"use client";

import React, { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Activo {
  id: number;
  name: string;
  barcode: string | null;
  estado: string;
}

interface Consumible {
  id: number;
  name: string;
  stock: number;
  stockMinimo: number;
}

interface PrestamoItem {
  type: "activo" | "consumible";
  id: number;
  cantidad: number;
  name: string;
}

interface InitialPrestamo {
  id?: number;
  usuarioId: number;
  estado?: "PENDIENTE" | "ACTIVO" | "DEVUELTO" | "CANCELADO";
  fechaSalida: string;
  fechaDevolucion?: string | null;
  notas?: string | null;
  detalles: {
    activo?: { id: number; name: string } | null;
    consumible?: { id: number; name: string } | null;
    cantidad: number;
  }[];
}

interface ModalPrestamoProps {
  open: boolean;
  onClose: () => void;
  onSaved: (prestamo: { id: number }) => void;
  initialPrestamo?: InitialPrestamo | null;
  mode?: "create" | "edit";
}

export default function ModalPrestamo({
  open,
  onClose,
  onSaved,
  initialPrestamo,
  mode = "create",
}: ModalPrestamoProps) {
  const initialItems: PrestamoItem[] = (initialPrestamo?.detalles || [])
    .map((detalle) => {
      if (detalle.activo) {
        return {
          type: "activo" as const,
          id: detalle.activo.id,
          cantidad: detalle.cantidad,
          name: detalle.activo.name,
        };
      }

      if (detalle.consumible) {
        return {
          type: "consumible" as const,
          id: detalle.consumible.id,
          cantidad: detalle.cantidad,
          name: detalle.consumible.name,
        };
      }

      return null;
    })
    .filter((value): value is PrestamoItem => value !== null);

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [consumibles, setConsumibles] = useState<Consumible[]>([]);

  const [usuarioId, setUsuarioId] = useState(initialPrestamo?.usuarioId ? String(initialPrestamo.usuarioId) : "");
  const [items, setItems] = useState<PrestamoItem[]>(initialItems);
  const [fechaSalida, setFechaSalida] = useState(
    initialPrestamo?.fechaSalida
      ? new Date(initialPrestamo.fechaSalida).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [fechaDevolucion, setFechaDevolucion] = useState(
    initialPrestamo?.fechaDevolucion
      ? new Date(initialPrestamo.fechaDevolucion).toISOString().split("T")[0]
      : ""
  );
  const [notas, setNotas] = useState(initialPrestamo?.notas || "");
  const [estado, setEstado] = useState<"PENDIENTE" | "ACTIVO" | "DEVUELTO" | "CANCELADO">(
    initialPrestamo?.estado || "ACTIVO"
  );

  const [selectedType, setSelectedType] = useState<"activo" | "consumible">(
    "activo"
  );
  const [selectedId, setSelectedId] = useState("");
  const [cantidad, setCantidad] = useState("1");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      let cancelled = false;

      async function run() {
        try {
          const [usersRes, activosRes, consumiblesRes] = await Promise.all([
            fetch("/api/auth/users"),
            fetch("/api/activos?limit=100"),
            fetch("/api/consumibles?limit=100"),
          ]);

          if (cancelled) {
            return;
          }

          if (usersRes.ok) {
            const data = await usersRes.json();
            setUsuarios(data.usuarios || data || []);
          }

          if (activosRes.ok) {
            const data = await activosRes.json();
            setActivos(
              data.activos?.filter((a: Activo) => a.estado === "DISPONIBLE") || []
            );
          }

          if (consumiblesRes.ok) {
            const data = await consumiblesRes.json();
            setConsumibles(data.consumibles || []);
          }
        } catch (error) {
          if (!cancelled) {
            console.error("Error fetching data:", error);
          }
        }
      }

      void run();

      return () => {
        cancelled = true;
      };
    }
  }, [open]);

  const handleAddItem = () => {
    if (!selectedId) {
      setError("Selecciona un elemento");
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (cantidadNum < 1) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    let name = "";
    if (selectedType === "activo") {
      const activo = activos.find((a) => a.id === parseInt(selectedId));
      name = activo?.name || "";
    } else {
      const consumible = consumibles.find((c) => c.id === parseInt(selectedId));
      name = consumible?.name || "";
    }

    const newItem: PrestamoItem = {
      type: selectedType,
      id: parseInt(selectedId),
      cantidad: cantidadNum,
      name,
    };

    setItems([...items, newItem]);
    setSelectedId("");
    setCantidad("1");
    setError("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usuarioId) {
      setError("Selecciona un usuario");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un elemento al préstamo");
      return;
    }

    setLoading(true);

    try {
      const token = window.localStorage.getItem("inventario_token");
      const prestamo = {
        id: initialPrestamo?.id,
        usuarioId: parseInt(usuarioId),
        estado,
        items: items.map((item) => ({
          [item.type === "activo" ? "activoId" : "consumibleId"]: item.id,
          cantidad: item.cantidad,
        })),
        fechaSalida: new Date(fechaSalida).toISOString(),
        fechaDevolucion: fechaDevolucion
          ? new Date(fechaDevolucion).toISOString()
          : null,
        notas: notas || null,
      };

      const response = await fetch("/api/prestamos", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(prestamo),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (mode === "edit" ? "Error al actualizar el préstamo" : "Error al crear el préstamo"));
      }

      const data = await response.json();

      setUsuarioId("");
      setItems([]);
      setEstado("ACTIVO");
      setFechaSalida(new Date().toISOString().split("T")[0]);
      setFechaDevolucion("");
      setNotas("");
      onSaved(data.prestamo ?? { id: initialPrestamo?.id ?? 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
      <div className="max-w-4xl w-full mx-4 rounded-lg bg-white text-slate-900 shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">{mode === "edit" ? "Editar Préstamo" : "Nuevo Préstamo"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-100 text-rose-800 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Usuario *
            </label>
            <select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
            >
              <option value="">Selecciona un usuario</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {mode === "edit" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as "PENDIENTE" | "ACTIVO" | "DEVUELTO" | "CANCELADO")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACTIVO">Activo</option>
                <option value="DEVUELTO">Devuelto</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          ) : null}

          {/* Agregar elementos */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">
              Agregar Elementos
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as "activo" | "consumible")
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="activo">Activo</option>
                  <option value="consumible">Consumible</option>
                </select>

                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Selecciona un elemento</option>
                  {selectedType === "activo" ? (
                    activos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.barcode || "sin código"})
                      </option>
                    ))
                  ) : (
                    consumibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Stock: {c.stock})
                      </option>
                    ))
                  )}
                </select>

                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  min="1"
                  className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Elementos agregados */}
          {items.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-900 mb-3">
                Elementos del Préstamo
              </h3>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-slate-100 p-3 rounded"
                  >
                    <span className="text-sm text-slate-900">
                      {item.name} x{item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-600 hover:text-rose-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fechas y notas */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Salida *
              </label>
              <input
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Devolución
              </label>
              <input
                type="date"
                value={fechaDevolucion}
                onChange={(e) => setFechaDevolucion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
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
              {loading ? "Guardando..." : mode === "edit" ? "Actualizar Préstamo" : "Crear Préstamo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
