"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "~/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Determine initial theme on client load
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (!theme) return;
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Prevent rendering on server to avoid hydration mismatch
  if (theme === null) {
    return <div className="size-8" />;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full shadow-sm hover:scale-105 transition-transform bg-background border-border"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="size-4 text-foreground transition-all" />
      ) : (
        <Sun className="size-4 text-foreground transition-all" />
      )}
    </Button>
  );
}
