"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/app/components/Navigation";

type Summary = {
  activosTotal: number;
  activosDisponibles: number;
  activosPrestados: number;
  consumiblesTotal: number;
  consumiblesBajo: number;
};

type UserInfo = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("inventario_token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        const [userResponse, summaryResponse] = await Promise.all([
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/dashboard/summary"),
        ]);

        if (!userResponse.ok) {
          window.localStorage.removeItem("inventario_token");
          router.push("/login");
          return;
        }

        const userData = await userResponse.json();
        const summaryData = await summaryResponse.json();

        setUser(userData);
        setSummary(summaryData);
      } catch {
        setError("No se pudo cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  return (
    <>
      <Navigation />
      <div className="flex-1 overflow-auto bg-slate-100">
        <div className="p-8">
          <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
              </div>

              {/* Tarjetas de Estadísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <div className="bg-purple-600 p-4 rounded-lg text-white text-2xl flex-shrink-0">
                    📦
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Activos</p>
                    <p className="text-3xl font-bold text-gray-900">{summary?.activosTotal ?? "--"}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <div className="bg-emerald-600 p-4 rounded-lg text-white text-2xl flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Disponibles</p>
                    <p className="text-3xl font-bold text-gray-900">{summary?.activosDisponibles ?? "--"}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <div className="bg-orange-500 p-4 rounded-lg text-white text-2xl flex-shrink-0">
                    🔄
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Prestados</p>
                    <p className="text-3xl font-bold text-gray-900">{summary?.activosPrestados ?? "--"}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm border border-gray-100">
                  <div className="bg-yellow-500 p-4 rounded-lg text-white text-2xl flex-shrink-0">
                    📋
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Consumibles</p>
                    <p className="text-3xl font-bold text-gray-900">{summary?.consumiblesTotal ?? "--"}</p>
                  </div>
                </div>
              </div>

              {/* Información del Usuario y Stock Bajo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sesión Actual</h3>
                  {loading ? (
                    <p className="text-gray-600">Cargando información del usuario...</p>
                  ) : error ? (
                    <p className="text-red-600">{error}</p>
                  ) : user ? (
                    <div className="space-y-3 text-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nombre</p>
                        <p className="text-lg font-semibold">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Correo</p>
                        <p className="text-lg">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Rol</p>
                        <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold mt-1">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Bajo</h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 p-4 rounded-lg text-red-600 text-3xl">
                      ⚠️
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Consumibles con stock bajo</p>
                      <p className="text-4xl font-bold text-red-600">{summary?.consumiblesBajo ?? "--"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
