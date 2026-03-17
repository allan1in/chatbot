"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 在初始化时从 localStorage 读取
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      return savedTheme || "system";
    }
    return "system";
  });

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      // 移除之前的主题类
      root.classList.remove("light", "dark");

      // 应用新主题
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }

      // 保存到 localStorage
      localStorage.setItem("theme", theme);
    };

    // 使用 View Transitions API 如果可用
    if (typeof window !== "undefined" && "startViewTransition" in document) {
      (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(() => applyTheme());
    } else {
      applyTheme();
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
