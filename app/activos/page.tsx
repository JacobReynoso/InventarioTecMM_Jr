"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MoreVertical } from "lucide-react";
import { Navigation } from "@/app/components/Navigation";
import ModalActivo from "@/app/components/ModalActivo";
import { getTokenRoleFromToken } from "@/lib/session";

type Activo = {
  id: number;
  barcode?: string | null;
  name: string;
  descripcion?: string | null;
  estado: string;
  ubicacion?: string | null;
};

type ActivoResponse = {
  activos: Activo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

const statusStyles: Record<string, string> = {
  DISPONIBLE: "bg-emerald-100 text-emerald-700",
  PRESTADO: "bg-orange-100 text-orange-700",
  MANTENIMIENTO: "bg-sky-100 text-sky-700",
  RETIRADO: "bg-slate-100 text-slate-700",
};

export default function ActivosPage() {
  const token = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("inventario_token"),
    () => null
  );
  const [activos, setActivos] = useState<Activo[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentRole = getTokenRoleFromToken(token);

  async function loadActivos(page = 1, query = "") {
    try {
      const response = await fetch(`/api/activos?page=${page}&limit=10&search=${encodeURIComponent(query)}`);
      const data = (await response.json()) as ActivoResponse & { error?: string };

      if (!response.ok) {
        setErrorMessage(data?.error || "No se pudieron cargar los activos.");
        return;
      }

      setActivos(data.activos);
      setCurrentPage(data.pagination.page);
      setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
    } catch {
      setErrorMessage("Error de conexión al cargar los activos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const response = await fetch(
          `/api/activos?page=1&limit=10&search=${encodeURIComponent(search)}`
        );
        const data = (await response.json()) as ActivoResponse & { error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setErrorMessage(data?.error || "No se pudieron cargar los activos.");
          return;
        }

        setActivos(data.activos);
        setCurrentPage(data.pagination.page);
        setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
      } catch {
        if (!cancelled) {
          setErrorMessage("Error de conexión al cargar los activos.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [search]);

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsLoading(true);
    setErrorMessage(null);
    setSearch(event.target.value);
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    loadActivos(page, search);
  }

  function handleCreated(activo: Activo) {
    setIsModalOpen(false);
    setActivos((current) => [activo, ...current]);
  }

  function handleSaved(activo: Activo) {
    setIsModalOpen(false);
    setEditingActivo(null);
    setActivos((current) => current.map((item) => (item.id === activo.id ? activo : item)));
  }

  function handleEditClick(activo: Activo) {
    setMenuOpenId(null);
    setMenuPosition(null);
    setEditingActivo(activo);
    setIsModalOpen(true);
  }

  async function handleDeleteClick(activoId: number) {
    setMenuOpenId(null);
    setMenuPosition(null);

    const confirmed = window.confirm("¿Eliminar este activo?");
    if (!confirmed) {
      return;
    }

    try {
      const token = window.localStorage.getItem("inventario_token");
      const response = await fetch(`/api/activos?id=${activoId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el activo.");
      }

      setActivos((current) => current.filter((item) => item.id !== activoId));
    } catch {
      setErrorMessage("No se pudo eliminar el activo.");
    }
  }

  return (
    <>
      <Navigation />
      <div className="flex-1 overflow-auto">
        <div className="p-8">

        <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-black">Módulo de Activos</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Gestiona los bienes del instituto con control de estado, ubicación y auditoría.</p>
            </div>
            {currentRole !== "lectura" ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Nuevo activo
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white opacity-50 transition-none"
              >
                Nuevo activo
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Buscar</span>
              <input
                type="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Nombre o código de barras"
                className="w-full bg-transparent outline-none"
              />
            </label>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
          ) : null}

          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-4">Activo</th>
                  <th className="px-4 py-4">Código</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4">Ubicación</th>
                  <th className="px-4 py-4">Descripción</th>
                  <th className="px-4 py-4 text-right">Opciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Cargando activos...
                    </td>
                  </tr>
                ) : activos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No se encontraron activos.
                    </td>
                  </tr>
                ) : (
                  activos.map((activo) => (
                    <tr key={activo.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">{activo.name}</td>
                      <td className="px-4 py-4 text-slate-600">{activo.barcode || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[activo.estado] ?? "bg-slate-100 text-slate-700"}`}>
                          {activo.estado.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{activo.ubicacion || "—"}</td>
                      <td className="px-4 py-4 text-slate-600">{activo.descripcion || "Sin descripción"}</td>
                      <td className="px-4 py-4 text-right">
                        {currentRole === "lectura" ? (
                          <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 opacity-40 transition-none cursor-not-allowed"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        ) : (
                          <div className="relative inline-flex">
                            <button
                              type="button"
                              onClick={(event) => {
                                const targetRect = event.currentTarget.getBoundingClientRect();

                                setMenuOpenId((current) => {
                                  const nextMenuId = current === activo.id ? null : activo.id;
                                  setMenuPosition(
                                    nextMenuId === null
                                      ? null
                                      : {
                                          top: targetRect.bottom + 8,
                                          left: targetRect.right - 144,
                                        }
                                  );
                                  return nextMenuId;
                                });
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label="Abrir opciones"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            {menuOpenId === activo.id ? (
                              <div
                                className="fixed z-50 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                                style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : undefined}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(activo)}
                                  className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                  Editar
                                </button>
                                {currentRole !== "editor" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClick(activo.id)}
                                    className="block w-full px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                  >
                                    Eliminar
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
        </div>
      </div>

      <ModalActivo
        key={`${isModalOpen ? "open" : "closed"}-${editingActivo?.id ?? "new"}`}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingActivo(null);
        }}
        onSaved={editingActivo ? handleSaved : handleCreated}
        initialActivo={editingActivo}
        mode={editingActivo ? "edit" : "create"}
      />
    </>
  );
}
