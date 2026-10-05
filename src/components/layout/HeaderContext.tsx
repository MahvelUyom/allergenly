"use client";

import { createContext, useContext } from "react";

interface HeaderInfo {
  initials: string;
  restaurantName: string;
}

// Computed once, correctly, in (app)/layout.tsx (which has both the
// session and the restaurant row) and handed down here so every page's
// AppHeader shows the same real initials instead of each page
// re-deriving its own (buggy, name-less) fallback — see AppShell.
const HeaderContext = createContext<HeaderInfo>({ initials: "?", restaurantName: "" });

export function HeaderProvider({ value, children }: { value: HeaderInfo; children: React.ReactNode }) {
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeaderInfo() {
  return useContext(HeaderContext);
}
