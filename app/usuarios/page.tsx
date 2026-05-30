"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/app/components/Navigation";

type Usuario = {
  id: number;
  name: string;
  email: string;
  role: { name: string } | null;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsuarios() {
      const response = await fetch("/api/usuarios");
      const data = await response.json();
      setUsuarios(data.usuarios || []);
      setIsLoading(false);
    }

    loadUsuarios();
  }, []);

  return (
    <>
      <Navigation />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
            <div className="mx-auto">
            <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-black">Usuarios</h1>
              <p className="mt-2 text-slate-600">Administración de usuarios registrados en el sistema.</p>
            </div>
          </header>

          {isLoading ? (
            <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-600">Cargando usuarios...</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">{usuario.name}</td>
                      <td className="px-4 py-4 text-slate-600">{usuario.email}</td>
                      <td className="px-4 py-4 text-slate-600">{usuario.role?.name || "usuario"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
