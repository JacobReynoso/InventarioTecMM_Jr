"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Activos", href: "/activos" },
  { label: "Préstamos", href: "/prestamos" },
  { label: "Consumibles", href: "/consumibles" },
  { label: "Usuarios", href: "/usuarios" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function doLogout() {
    window.localStorage.removeItem("inventario_token");
    router.push("/login");
  }

  function handleLogoutClick() {
    setConfirmOpen(true);
  }

  return (
    <aside className={`bg-gradient-to-b from-indigo-900 to-indigo-800 text-white transition-all duration-300 flex flex-col ${isOpen ? "w-64" : "w-32"}`}>
      {/* Logo (only image, no text) */}
      <div className="flex items-center justify-center px-6 py-8 border-b border-indigo-700">
        <Image src="/tecmm-logo.png" alt="Logo" width={112} height={112} className="h-28 w-28 object-contain flex-shrink-0" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {menuItems.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className={`mx-3 ${idx !== menuItems.length - 1 ? 'border-b border-indigo-700/20' : ''}`}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-indigo-100 hover:bg-indigo-700/50'
                }`}
              >
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Logout Button (hidden when minimized) */}
      {isOpen && (
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={handleLogoutClick}
            className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-semibold transition-colors text-white"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Toggle Button */}
      <div className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg transition-colors flex items-center justify-center"
          title={isOpen ? 'Contraer' : 'Expandir'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </div>

      {/* Logout confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">¿Estás seguro de que quieres cerrar sesión?</h3>
            <p className="mt-2 text-sm text-gray-600">Se cerrará tu sesión actual y volverás a la pantalla de inicio de sesión.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  doLogout();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
