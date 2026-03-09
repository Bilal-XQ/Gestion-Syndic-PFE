"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const localeLabels: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};



export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;

  function switchLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={localeLabels[currentLocale]}
          className="size-8 shrink-0 rounded-[8px]"
        >
          <Globe className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => switchLocale(locale)}
            disabled={locale === currentLocale}
          >
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
