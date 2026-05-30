"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(result.error || "Error en el inicio de sesión.");
      return;
    }

    window.localStorage.setItem("inventario_token", result.token);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
        <section className="rounded-none bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-800 p-10 shadow-2xl shadow-slate-950/40">
          <div className="flex items-center gap-6">
            <img src="/tecmm-logo.png" alt="Logo" className="w-36 h-36 object-contain flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-semibold text-white">TecMM</h1>
              <p className="mt-1 text-slate-300">Bienvenido al gestor de inventario</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
            <label className="grid gap-2 text-sm font-medium text-white">
              Correo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="usuario@instituto.edu"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-white">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="Contraseña"
              />
            </label>
            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
