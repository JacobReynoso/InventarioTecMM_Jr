"use client";

import { Search, Bell, Settings, Moon, MoreVertical } from "lucide-react";

export function Navigation() {
  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-3 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white">
      <div>
        <span className="text-xl font-semibold">TecMM</span>
      </div>

      <div className="flex items-center gap-4 divide-x divide-white/20">
        <div className="flex items-center gap-2 pr-4">
          <button className="p-2 hover:bg-white/5 rounded-lg transition">
            <Search className="w-5 h-5 text-white/90" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4">
          <button className="p-2 hover:bg-white/5 rounded-lg transition">
            <Moon className="w-5 h-5 text-white/90" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition relative">
            <Bell className="w-5 h-5 text-white/90" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition">
            <Settings className="w-5 h-5 text-white/90" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition">
            <MoreVertical className="w-5 h-5 text-white/90" />
          </button>
        </div>

        <div className="pl-4">
          <div className="w-10 h-10 bg-[#1e1e1e] rounded-full flex items-center justify-center text-white font-medium text-sm">
            AD
          </div>
        </div>
      </div>
    </nav>
  );
}
