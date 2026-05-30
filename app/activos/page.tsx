"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/app/components/Navigation";
import ModalActivo from "@/app/componentes/ModalActivo";

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
  const [activos, setActivos] = useState<Activo[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadActivos(page = 1, query = "") {
    setIsLoading(true);
    setErrorMessage(null);

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
    loadActivos(1, search);
  }, [search]);

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) {
      return;
    }
    loadActivos(page, search);
  }

  function handleCreated(activo: Activo) {
    setIsModalOpen(false);
    setActivos((current) => [activo, ...current]);
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
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Nuevo activo
            </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Cargando activos...
                    </td>
                  </tr>
                ) : activos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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

      <ModalActivo open={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />
    </>
  );
}
