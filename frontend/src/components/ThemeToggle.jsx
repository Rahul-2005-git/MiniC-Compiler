import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      style={{
        padding: "6px 10px",
        borderRadius: "8px",
        background: "var(--bg3)",
        color: "var(--text)",
        border: "1px solid var(--border)"
      }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}