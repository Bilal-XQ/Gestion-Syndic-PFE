import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(raw as Locale)
    ? (raw as Locale)
    : defaultLocale;

  const [
    common,
    auth,
    dashboard,
    owners,
    apartments,
    charges,
    payments,
    meetings,
    settings,
    portal,
    notifications,
    landing,
    validation,
  ] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/dashboard.json`),
    import(`../../messages/${locale}/owners.json`),
    import(`../../messages/${locale}/apartments.json`),
    import(`../../messages/${locale}/charges.json`),
    import(`../../messages/${locale}/payments.json`),
    import(`../../messages/${locale}/meetings.json`),
    import(`../../messages/${locale}/settings.json`),
    import(`../../messages/${locale}/portal.json`),
    import(`../../messages/${locale}/notifications.json`),
    import(`../../messages/${locale}/landing.json`),
    import(`../../messages/${locale}/validation.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      dashboard: dashboard.default,
      owners: owners.default,
      apartments: apartments.default,
      charges: charges.default,
      payments: payments.default,
      meetings: meetings.default,
      settings: settings.default,
      portal: portal.default,
      notifications: notifications.default,
      landing: landing.default,
      validation: validation.default,
    },
  };
});
