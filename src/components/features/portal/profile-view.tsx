"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { User, Building2, Home, Pencil, X, Check, Lock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import {
  createChangePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/validations/profile";
import { updatePhone, changePassword } from "@/lib/actions/portal";
import { formatDate } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProfileData = {
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    ownershipDate: string;
  };
  apartment: {
    unitNumber: string;
    floor: number;
    surfaceArea: string;
    roomCount: number;
  };
  building: { name: string; address: string } | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProfileView() {
  const queryClient = useQueryClient();
  const t = useTranslations("portal");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["portal", "profile"],
    queryFn: async () => {
      const r = await fetch("/api/portal/profile");
      if (!r.ok) return undefined;
      return r.json();
    },
  });

  // — Phone mutation —
  const phoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      return updatePhone({ phone });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("profile.phoneSuccess"));
        queryClient.invalidateQueries({ queryKey: ["portal", "profile"] });
        setEditingPhone(false);
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error(tc("errorOccurred"));
    },
  });

  // — Password form —
  const passwordForm = useForm<ChangePasswordFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createChangePasswordSchema(tv)) as any,
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormValues) => {
      return changePassword(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("profile.changePasswordSuccess"));
        passwordForm.reset();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error(tc("errorOccurred"));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile?.owner) {
    return (
      <p className="text-sm text-[--text-secondary]">
        {t("profile.errorLoading")}
      </p>
    );
  }

  const { owner, apartment, building } = profile;

  return (
    <div className="space-y-6">
      {/* ─── Read-only info ─── */}
      <Card className="border-[--border-default] bg-[--bg-elevated] p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Personal info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[--text-primary]">
              <User className="h-4 w-4" /> {t("profile.personalInfo")}
            </div>
            <dl className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.nameLabel")}</dt>
                <dd className="text-[--text-primary]">
                  {owner.firstName} {owner.lastName}
                </dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.emailLabel")}</dt>
                <dd className="text-[--text-primary]">{owner.email}</dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.ownershipDateLabel")}</dt>
                <dd className="text-[--text-primary]">{formatDate(owner.ownershipDate)}</dd>
              </div>
            </dl>
          </div>

          {/* Apartment info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[--text-primary]">
              <Home className="h-4 w-4" /> {t("profile.apartmentSection")}
            </div>
            <dl className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.unitLabel")}</dt>
                <dd className="text-[--text-primary]">
                  {apartment.unitNumber}
                </dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.floorLabel")}</dt>
                <dd className="text-[--text-primary]">{apartment.floor}</dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.surfaceLabel")}</dt>
                <dd className="text-[--text-primary]">
                  {apartment.surfaceArea} m²
                </dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-[--text-secondary]">{t("profile.roomsLabel")}</dt>
                <dd className="text-[--text-primary]">
                  {apartment.roomCount}
                </dd>
              </div>
            </dl>
          </div>

          {/* Building info */}
          {building && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[--text-primary]">
                <Building2 className="h-4 w-4" /> {t("profile.buildingSection")}
              </div>
              <dl className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <dt className="text-[--text-secondary]">{t("profile.buildingNameLabel")}</dt>
                  <dd className="text-[--text-primary]">{building.name}</dd>
                </div>
                <div className="space-y-1.5">
                  <dt className="text-[--text-secondary]">{t("profile.buildingAddressLabel")}</dt>
                  <dd className="text-[--text-primary]">{building.address}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </Card>

      {/* ─── Phone edit ─── */}
      <Card className="border-[--border-default] bg-[--bg-elevated] p-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-[--text-primary]">
            {t("profile.phoneLabel")}
          </Label>

          {editingPhone ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder={t("profile.phonePlaceholder")}
                className="max-w-xs"
              />
              <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => phoneMutation.mutate(phoneValue)}
                disabled={phoneMutation.isPending}
              >
                <Check className="h-4 w-4" />
                {t("profile.phoneSubmit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPhone(false)}
              >
                <X className="h-4 w-4" />
                {t("profile.phoneCancel")}
              </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[--text-primary]">
                {owner.phone || t("profile.phoneNotSet")}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPhoneValue(owner.phone || "");
                  setEditingPhone(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                {t("profile.phoneEditButton")}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ─── Password change ─── */}
      <Card className="border-[--border-default] bg-[--bg-elevated] p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[--text-primary]">
            <Lock className="h-4 w-4" /> {t("profile.changePassword")}
          </div>

          <form
            onSubmit={passwordForm.handleSubmit((data) =>
              passwordMutation.mutate(data)
            )}
            className="flex max-w-sm flex-col gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password">{t("profile.newPasswordLabel")}</Label>
              <Input
                id="password"
                type="password"
                {...passwordForm.register("password")}
              />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-[--status-error]">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("profile.confirmPasswordLabel")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-[--status-error]">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={passwordMutation.isPending}
              className="w-fit"
            >
              {passwordMutation.isPending
                ? t("profile.changePasswordSubmitting")
                : t("profile.changePasswordSubmit")}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
