"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renders the page every few seconds (for about a minute) so it picks up
// the webhook's update without the player reloading.
export function AutoRefresh({ everyMs = 3000, maxTries = 20 }: { everyMs?: number; maxTries?: number }) {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      if (++tries > maxTries) clearInterval(timer);
      else router.refresh();
    }, everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs, maxTries]);
  return null;
}
