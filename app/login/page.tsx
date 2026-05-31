"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const EMAIL_CACHE_KEY = "inventario_email_cache";
const FALLBACK_EMAILS = ["admin@instituto.edu", "alu@instituto.edu", "asis@instituto.edu"];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function mergeEmails(...groups: string[][]) {
  return Array.from(
    new Set(groups.flat().map((email) => normalizeEmail(email)).filter(Boolean))
  );
}

function getDomainSuggestion(value: string) {
  const currentValue = normalizeEmail(value);
  if (currentValue === "alu" || currentValue === "admin" || currentValue === "asis") {
    return "@instituto.edu";
  }

  return "";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setEmailSuggestions] = useState<string[]>(FALLBACK_EMAILS);
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const emailGhostRef = useRef<HTMLSpanElement | null>(null);

  const emailGhostText = useMemo(() => {
    return getDomainSuggestion(email);
  }, [email]);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      const cachedEmails = window.localStorage.getItem(EMAIL_CACHE_KEY);
      const cachedList = cachedEmails ? (JSON.parse(cachedEmails) as string[]) : [];

      try {
        const response = await fetch("/api/usuarios");
        const data = await response.json();
        const serverEmails = Array.isArray(data.usuarios)
          ? data.usuarios.map((usuario: { email?: string }) => usuario.email || "")
          : [];

        if (!cancelled) {
          setEmailSuggestions(mergeEmails(cachedList, serverEmails, FALLBACK_EMAILS));
        }
      } catch {
        if (!cancelled) {
          setEmailSuggestions(mergeEmails(cachedList, FALLBACK_EMAILS));
        }
      }
    }

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const input = emailInputRef.current;
    const ghost = emailGhostRef.current;

    if (!input || !ghost || !emailGhostText) {
      return;
    }

    const computed = window.getComputedStyle(input);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.font = computed.font || `${computed.fontSize} ${computed.fontFamily}`;
    ghost.style.left = `calc(${context.measureText(email).width}px + 2ch)`;
  }, [email, emailGhostText]);

  function saveEmailToCache(value: string) {
    const normalizedValue = normalizeEmail(value);
    if (!normalizedValue) {
      return;
    }

    const cachedEmails = window.localStorage.getItem(EMAIL_CACHE_KEY);
    const cachedList = cachedEmails ? (JSON.parse(cachedEmails) as string[]) : [];
    const nextList = mergeEmails([normalizedValue], cachedList).slice(0, 6);
    window.localStorage.setItem(EMAIL_CACHE_KEY, JSON.stringify(nextList));
    setEmailSuggestions(mergeEmails(nextList, FALLBACK_EMAILS));
  }

  function handleEmailKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Tab") {
      return;
    }

    if (!emailGhostText) {
      return;
    }

    event.preventDefault();
    setEmail(`${normalizeEmail(email)}${emailGhostText}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "Error en el inicio de sesión.");
        return;
      }

      window.localStorage.setItem("inventario_token", result.token);
      saveEmailToCache(email);
      router.push("/dashboard");
    } catch {
      setError("No se pudo comunicar con el servidor de autenticación.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
        <section className="rounded-none bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-800 p-10 shadow-2xl shadow-slate-950/40">
          <div className="flex items-center gap-6">
            <Image src="/tecmm-logo.png" alt="Logo" width={144} height={144} className="h-36 w-36 object-contain flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-semibold text-white">TecMM</h1>
              <p className="mt-1 text-slate-300">Bienvenido al gestor de inventario</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
            <label className="grid gap-2 text-sm font-medium text-white">
              Correo
              <div className="relative">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  autoComplete="email"
                  className="relative z-10 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                  placeholder={email ? "" : "usuario@instituto.edu"}
                />
                {emailGhostText ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl px-4 py-3 text-slate-500/80"
                  >
                    <span
                      ref={emailGhostRef}
                      className="absolute whitespace-pre"
                    >
                      {emailGhostText}
                    </span>
                  </div>
                ) : null}
              </div>
            </label>
            <label className="grid gap-2 text-sm font-medium text-white">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-500"
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
