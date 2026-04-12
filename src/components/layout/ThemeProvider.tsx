"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const supabase = createClient();

  // On mount: read from localStorage first (fast), then sync from DB if signed in
  useEffect(() => {
    const stored = localStorage.getItem("studyly_theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }

    // Sync from profile if signed in
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("dark_mode")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setIsDark(profile.dark_mode);
        document.documentElement.classList.toggle("dark", profile.dark_mode);
        localStorage.setItem("studyly_theme", profile.dark_mode ? "dark" : "light");
      }
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("studyly_theme", next ? "dark" : "light");

    // Persist to profile if signed in
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ dark_mode: next })
        .eq("id", data.user.id);
    }
  }, [isDark, supabase]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
