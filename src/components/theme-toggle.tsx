"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        theme === "system"
          ? "Theme: system"
          : isDark
            ? "Switch to light theme"
            : "Switch to dark theme"
      }
      onClick={() =>
        setTheme(isDark ? "light" : theme === "system" ? "light" : "dark")
      }
    >
      {isDark ? (
        <Icon name="Sun" className="h-5 w-5" />
      ) : (
        <Icon name="Moon" className="h-5 w-5" />
      )}
    </Button>
  );
}
