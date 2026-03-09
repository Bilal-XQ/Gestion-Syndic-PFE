"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  containerClassName?: string;
}

export function PasswordInput({
  className,
  containerClassName,
  ...props
}: PasswordInputProps) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pe-11", className)}
      />
      <button
        type="button"
        aria-label={
          visible ? t("passwordInput.hidePassword") : t("passwordInput.showPassword")
        }
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-[--text-muted] transition-colors hover:text-[--text-secondary]"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}
