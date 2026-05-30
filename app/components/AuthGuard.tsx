"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("inventario_token") : null;
    setAuthenticated(Boolean(token));

    if (!token) {
      // If not authenticated and not on login page, redirect to login
      if (pathname !== "/login") {
        router.push("/login");
      }
    } else {
      // If authenticated and on login, redirect to dashboard
      if (pathname === "/login") {
        router.push("/dashboard");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (authenticated === null) return null;

  if (!authenticated) {
    // When not authenticated, render children (e.g., login) without sidebar
    return <main className="flex-1">{children}</main>;
  }

  // When authenticated, show sidebar and children
  return (
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
