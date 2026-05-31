"use client";

import React, { useEffect, useState } from "react";
import { Navigation } from "@/app/components/Navigation";
import ModalConsumible from "@/app/components/ModalConsumible";
import { getTokenRoleFromToken } from "@/lib/session";

interface Consumible {
  id: number;
  name: string;
  categoria: string | null;
  stock: number;
  stockMinimo: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ConsumiblesPage() {
  const token = React.useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("inventario_token"),
    () => null
  );
  const currentRole = getTokenRoleFromToken(token);
  const [consumibles, setConsumibles] = useState<Consumible[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fallbackPagination = (page = 1): PaginationInfo => ({
    page,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchConsumibles = async (page = 1, searchTerm = "") => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/consumibles?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error fetching consumibles");
      }

      setConsumibles(Array.isArray(data.consumibles) ? data.consumibles : []);
      setPagination(data.pagination ?? fallbackPagination(page));
    } catch (error) {
      console.error("Error fetching consumibles:", error);
      setConsumibles([]);
      setPagination(fallbackPagination(page));
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los consumibles"
      );
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
        const response = await fetch(`/api/consumibles?${params}`);
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Error fetching consumibles");
        }

        setConsumibles(Array.isArray(data.consumibles) ? data.consumibles : []);
        setPagination(data.pagination ?? fallbackPagination(1));
      } catch (error) {
        if (!cancelled) {
          setConsumibles([]);
          setPagination(fallbackPagination(1));
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los consumibles"
          );
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

  const handleSearch = (value: string) => {
    setLoading(true);
    setErrorMessage(null);
    setSearch(value);
    fetchConsumibles(1, value);
  };

  const handleCreated = () => {
    setLoading(true);
    setErrorMessage(null);
    fetchConsumibles(pagination.page, search);
    setModalOpen(false);
  };

  const getStockColor = (stock: number, minimo: number) => {
    if (stock < minimo) return "text-rose-600 font-semibold";
    if (stock < minimo * 2) return "text-orange-600";
    return "text-emerald-600";
  };

  return (
    <>
      <Navigation />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Encabezado */}
              <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-slate-900">Consumibles</h1>
                {currentRole === "lectura" ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white opacity-50 transition-none"
                  >
                    + Nuevo Consumible
                  </button>
                ) : (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    + Nuevo Consumible
                  </button>
                )}
              </div>

              {/* Búsqueda */}
              <div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-lg shadow-slate-200/40">
                <input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-transparent text-slate-900 outline-none"
                />
              </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Cargando consumibles...
              </div>
            ) : errorMessage ? (
              <div className="p-8 text-center text-amber-900 bg-amber-50">
                {errorMessage}
              </div>
            ) : consumibles.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No se encontraron consumibles
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                        Mínimo
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody divide-y divide-slate-200>
                    {consumibles.map((consumible) => (
                      <tr
                        key={consumible.id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                          {consumible.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {consumible.categoria || "—"}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-semibold">
                          <span
                            className={getStockColor(
                              consumible.stock,
                              consumible.stockMinimo
                            )}
                          >
                            {consumible.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {consumible.stockMinimo}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {consumible.stock < consumible.stockMinimo ? (
                            <span className="inline-block bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-semibold">
                              Bajo Stock
                            </span>
                          ) : (
                            <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <button
                      onClick={() => {
                        setLoading(true);
                        setErrorMessage(null);
                        fetchConsumibles(pagination.page - 1, search);
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
                        setErrorMessage(null);
                        fetchConsumibles(pagination.page + 1, search);
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
      <ModalConsumible open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </>
  );
}
