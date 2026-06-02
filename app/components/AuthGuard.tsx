"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";

interface Props {
  children: React.ReactNode;
}

function getAuthToken() {
  return typeof window !== "undefined"
    ? window.localStorage.getItem("inventario_token")
    : null;
}

export default function AuthGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const authenticated = Boolean(token);

  useEffect(() => {
    const currentToken = getAuthToken();
    setToken(currentToken);

    if (!currentToken) {
      if (pathname !== "/login") {
        router.push("/login");
      }
      return;
    }

    if (pathname === "/login") {
      router.push("/dashboard");
    }
  }, [pathname, router]);

  if (pathname === "/login") {
    return <main className="flex-1">{children}</main>;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
