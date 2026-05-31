"use client";

import React, { useEffect, useState } from "react";
import { Navigation } from "@/app/components/Navigation";
import ModalPrestamo from "@/app/components/ModalPrestamo";
import { getTokenRoleFromToken } from "@/lib/session";

interface PrestamoDetalle {
  id: number;
  prestamoId: number;
  activo: {
    id: number;
    name: string;
    barcode: string | null;
  } | null;
  consumible: {
    id: number;
    name: string;
  } | null;
  cantidad: number;
}

interface Prestamo {
  id: number;
  usuarioId: number;
  usuario: {
    id: number;
    name: string;
    email: string;
  };
  estado: "PENDIENTE" | "ACTIVO" | "DEVUELTO" | "CANCELADO";
  fechaSalida: string;
  fechaDevolucion: string | null;
  notas: string | null;
  detalles: PrestamoDetalle[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const estadoColors: Record<string, { bg: string; text: string }> = {
  PENDIENTE: { bg: "bg-slate-100", text: "text-slate-800" },
  ACTIVO: { bg: "bg-orange-100", text: "text-orange-800" },
  DEVUELTO: { bg: "bg-emerald-100", text: "text-emerald-800" },
  CANCELADO: { bg: "bg-rose-100", text: "text-rose-800" },
};

export default function PrestamosPage() {
  const token = React.useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("inventario_token"),
    () => null
  );
  const currentRole = getTokenRoleFromToken(token);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [estado, setEstado] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPrestamos = async (page = 1, estadoFilter = "") => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(estadoFilter && { estado: estadoFilter }),
      });
      const response = await fetch(`/api/prestamos?${params}`);
      const data = await response.json();
      setPrestamos(data.prestamos);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching prestamos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "10",
        });
        const response = await fetch(`/api/prestamos?${params}`);
        const data = await response.json();

        if (cancelled) {
          return;
        }

        setPrestamos(data.prestamos);
        setPagination(data.pagination);
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching prestamos:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEstadoFilter = (value: string) => {
    setLoading(true);
    setEstado(value);
    fetchPrestamos(1, value);
  };

  const handleCreated = () => {
    setLoading(true);
    fetchPrestamos(pagination.page, estado);
    setModalOpen(false);
  };

  const getEstadoBadge = (est: string) => {
    const colors = estadoColors[est] || estadoColors["PENDIENTE"];
    return colors;
  };

  return (
    <>
      <Navigation />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
        <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
          <div className="max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-slate-900">Préstamos</h1>
            {currentRole === "lectura" ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="cursor-not-allowed rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white opacity-50 transition-none"
              >
                + Nuevo Préstamo
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                + Nuevo Préstamo
              </button>
            )}
          </div>

          {/* Filtro de estado */}
          <div className="mb-6">
            <div className="inline-flex w-full max-w-xs items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-200/40">
              <select
                value={estado}
                onChange={(e) => handleEstadoFilter(e.target.value)}
                className="w-full bg-transparent text-slate-900 outline-none"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACTIVO">Activo</option>
                <option value="DEVUELTO">Devuelto</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Cargando préstamos...
              </div>
            ) : prestamos.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No se encontraron préstamos
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Elementos
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Fecha Salida
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Fecha Devolución
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody divide-y divide-slate-200>
                    {prestamos.map((prestamo) => {
                      const colors = getEstadoBadge(prestamo.estado);
                      return (
                        <tr
                          key={prestamo.id}
                          className="hover:bg-slate-50 transition"
                        >
                          <td className="px-6 py-4 text-sm">
                            <div className="font-semibold text-slate-900">
                              {prestamo.usuario.name}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {prestamo.usuario.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div>
                              {prestamo.detalles.map((detalle) => (
                                <div key={detalle.id} className="mb-1">
                                  {detalle.activo ? (
                                    <span>
                                      {detalle.activo.name} ({detalle.cantidad})
                                    </span>
                                  ) : detalle.consumible ? (
                                    <span>
                                      {detalle.consumible.name} x{detalle.cantidad}
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(prestamo.fechaSalida).toLocaleDateString(
                              "es-ES"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {prestamo.fechaDevolucion
                              ? new Date(prestamo.fechaDevolucion).toLocaleDateString(
                                  "es-ES"
                                )
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
                            >
                              {prestamo.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <button
                      onClick={() => {
                        setLoading(true);
                        fetchPrestamos(pagination.page - 1, estado);
                      }}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-600">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => {
                        setLoading(true);
                        fetchPrestamos(pagination.page + 1, estado);
                      }}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      </div>
      </div>

      {/* Modal */}
      <ModalPrestamo
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
