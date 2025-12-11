"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
    variant?: "desktop" | "mobile";
}

export default function ThemeToggle({ variant = "desktop" }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const baseClasses =
        "flex items-center gap-2 rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
    const sizeClasses =
        variant === "desktop"
            ? "px-3 py-1.5 text-sm"
            : "px-3 py-2 text-sm w-full justify-center";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`${baseClasses} ${sizeClasses} theme-toggle`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <span aria-hidden className="text-lg">
                {isDark ? "🌙" : "☀️"}
            </span>
            <span className="font-medium">
                {isDark ? "Dark" : "Light"}
            </span>
        </button>
    );
}
