"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render themed state after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-8 shrink-0" />;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        resolvedTheme === "dark"
          ? t("themeToggle.switchToLight")
          : t("themeToggle.switchToDark")
      }
      className="size-8 shrink-0 rounded-[8px]"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
