"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("inventario_token"),
    () => null
  );
  const authenticated = Boolean(token);

  useEffect(() => {
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
  }, [pathname, router, token]);

  if (pathname === "/login") {
    // When on the login route, keep the page shell simple regardless of auth state.
    return <main className="flex-1">{children}</main>;
  }

  if (!authenticated) {
    return null;
  }

  // When authenticated, show sidebar and children
  return (
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
