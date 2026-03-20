# Documentation Technique — Syndic

**Version :** 2.0  
**Date :** Mars 2026  
**Stack :** Next.js 16 · Supabase · Drizzle ORM · Tailwind CSS v4  
**Production :** https://syndico.vercel.app

---

## 1. Vue d'ensemble

Syndic est une application web de gestion de copropriété. Elle remplace un outil desktop Microsoft Access par une plateforme centralisée, accessible depuis n'importe quel navigateur.

L'application gère deux types d'utilisateurs :
- **Syndic** (gestionnaire) : accès complet à l'administration de un ou plusieurs immeubles
- **Copropriétaire** : accès limité à ses propres données (profil, charges, réunions, notifications)

Les deux rôles utilisent la même page de connexion. Le serveur détecte le rôle automatiquement depuis le JWT et redirige vers le bon tableau de bord.

---

## 2. Architecture générale

```
Navigateur
    │
    ▼
Next.js 16 (Vercel)
    ├── App Router (React Server Components par défaut)
    ├── Server Actions (toutes les mutations)
    ├── Middleware (protection des routes, rate limiting)
    │
    ▼
Supabase
    ├── PostgreSQL (base de données principale)
    ├── Auth (authentification + JWT)
    ├── Row Level Security (isolation des données par tenant)
    └── Realtime (notifications en temps réel)
```

**Principe de base :** les pages sont des Server Components par défaut. On n'utilise `"use client"` que quand c'est strictement nécessaire (état local, événements navigateur).

---

## 3. Stack technique

| Catégorie | Technologie | Version | Rôle |
|---|---|---|---|
| Framework | Next.js | 16.2.0 | Frontend + backend |
| Langage | TypeScript | 5.9.3 | Typage statique |
| Base de données | Supabase PostgreSQL | — | Stockage principal |
| ORM | Drizzle ORM | 0.45.1 | Requêtes type-safe |
| Auth | Supabase Auth | 2.98.0 | JWT + sessions |
| UI | shadcn/ui + Tailwind v4 | — | Composants + styles |
| Animation | Magic UI + motion/react | — | Landing page premium |
| État serveur | TanStack Query v5 | — | Cache + revalidation |
| État client | Zustand | 5.0.11 | Sidebar collapse |
| Formulaires | React Hook Form + Zod v4 | — | Validation client/serveur |
| Email | Resend + React Email | — | Emails transactionnels |
| PDF | @react-pdf/renderer | 4.3.2 | Avis de paiement |
| Rate limiting | Upstash Redis | — | 5 tentatives/min/IP |
| Monitoring | Sentry | — | Erreurs en production |
| i18n | next-intl v4 | — | FR / EN / AR + RTL |
| Export | SheetJS (xlsx) | — | Export Excel |
| Déploiement | Vercel | — | Hosting + serverless |

---

## 4. Authentification

### Fonctionnement

1. L'utilisateur soumet email + mot de passe
2. Supabase Auth valide les credentials et émet un JWT
3. Un **Custom Access Token Hook** (fonction PostgreSQL) lit le champ `role` dans `public.users` et l'injecte dans le JWT comme `user_role`
4. Le middleware Next.js lit `user_role` depuis le JWT **sans requête base de données**
5. Redirection selon le rôle :
   - `syndic` → `/dashboard`
   - `proprietaire` → `/portal`

### Protection des routes

Le fichier `middleware.ts` s'exécute avant chaque rendu de page :
- `/dashboard/*` → requiert `user_role = syndic`
- `/portal/*` → requiert `user_role = proprietaire`
- Toute autre requête invalide → redirigée vers `/login`

### Rate limiting

5 tentatives de connexion par IP par minute (sliding window via Upstash Redis). Les requêtes bloquées reçoivent un 429 sans jamais atteindre le serveur.

---

## 5. Base de données

### Tables principales

| Table | Description |
|---|---|
| `users` | Profils utilisateurs, étend `auth.users` de Supabase |
| `buildings` | Immeubles gérés par un syndic (multi-immeuble supporté) |
| `apartments` | Appartements d'un immeuble, avec tantièmes |
| `owners` | Lien entre un utilisateur copropriétaire et un appartement |
| `charges` | Charges créées par le syndic, assignées à un appartement |
| `payments` | Paiements effectués contre une charge |
| `meetings` | Assemblées générales |
| `meeting_invitations` | Invitations et réponses des copropriétaires |
| `notifications` | Notifications in-app pour les copropriétaires |
| `audit_logs` | Journal d'audit immutable de toutes les actions sensibles |

### Colonnes ajoutées (Phases 10–11)

- `apartments.tantiemes` — quote-part de l'appartement (défaut : 100)
- `apartments.type` — type de logement : studio, t1, t2, t3, t4_plus
- `buildings.total_tantiemes` — total des parts de l'immeuble (défaut : 1000)

### Règles importantes

**Valeurs dérivées** — `amount_paid`, `remaining_amount` et `status` sur les charges ne sont **jamais stockées**. Elles sont calculées à la volée par agrégation SQL sur la table `payments`.

**Tantièmes et distribution des charges** — Quand une charge cible un immeuble entier, le montant par appartement est calculé : `total × (tantiemes / total_tantiemes)`. Ce calcul s'exécute dans une transaction Drizzle.

**Soft delete** — Les propriétaires, charges et réunions ne sont jamais supprimés physiquement. On pose un `deleted_at` timestamp. Toutes les requêtes filtrent sur `WHERE deleted_at IS NULL`.

**Transactions** — Tout paiement et toute distribution de charge s'exécutent dans une transaction Drizzle. Aucun état partiel n'est jamais sauvegardé.

**Row Level Security** — Les politiques RLS Supabase utilisent `auth.jwt() ->> 'user_role'` et `auth.uid()` directement. Un copropriétaire ne peut voir que ses propres données, même si on contourne l'application.

---

## 6. Structure des fichiers

```
src/
├── app/
│   ├── (auth)/login/              — Page de connexion
│   ├── (syndic)/dashboard/        — Routes syndic protégées
│   │   ├── owners/                — Gestion des copropriétaires
│   │   ├── apartments/            — Gestion des appartements
│   │   ├── immeubles/             — Gestion des immeubles (multi-building)
│   │   ├── charges/               — Charges et avis de paiement
│   │   ├── meetings/              — Assemblées générales
│   │   ├── payments/              — Historique des paiements
│   │   └── settings/              — Paramètres du bâtiment
│   ├── (owner)/                   — Routes copropriétaire protégées
│   │   ├── portal/                — Mon espace (profil + overview)
│   │   ├── payments/              — Mes charges et paiements
│   │   ├── portal/meetings/       — Mes réunions
│   │   └── notifications/         — Mes notifications
│   ├── api/                       — Routes API (portal, meetings, etc.)
│   └── page.tsx                   — Landing page publique
│
├── components/
│   ├── ui/                        — Composants shadcn/ui + Magic UI
│   ├── landing/                   — Sections de la landing page
│   ├── layout/                    — Sidebar, navbar, top-bar
│   └── features/                  — Composants métier par domaine
│
├── lib/
│   ├── actions/                   — Server Actions (mutations)
│   ├── db/
│   │   ├── schema.ts              — Schéma Drizzle complet
│   │   └── queries/               — Requêtes par domaine
│   ├── email/templates/           — Templates React Email
│   ├── export/                    — Helpers export Excel (SheetJS)
│   └── validations/               — Schémas Zod partagés client/serveur
│
├── hooks/                         — Hooks React custom
├── messages/                      — Traductions FR / EN / AR
│   ├── fr/                        — 13 namespaces
│   ├── en/
│   └── ar/
├── utils/supabase/                — Clients Supabase (server, client, middleware)
└── middleware.ts                  — Protection des routes + rate limiting
```

---

## 7. Choix techniques et justifications

**Pourquoi Next.js Server Components par défaut ?**
Réduit le bundle JavaScript envoyé au navigateur. Les données sont fetchées côté serveur, pas besoin d'exposer des API internes.

**Pourquoi Server Actions pour les mutations ?**
Élimine les routes API internes redondantes. La logique reste côté serveur, validée deux fois (client avec RHF + Zod, serveur dans l'action).

**Pourquoi Drizzle ORM ?**
Type-safety complète avec TypeScript. Les requêtes sont du SQL typé, pas une abstraction opaque. Migrations versionnées avec drizzle-kit.

**Pourquoi pas de colonnes dérivées ?**
Les agrégats stockés se désynchronisent quand plusieurs paiements sont faits. Le calcul à la volée est la seule source de vérité.

**Pourquoi Supabase Realtime pour les notifications ?**
Zéro polling. Quand un syndic crée une invitation, le copropriétaire la reçoit instantanément via un channel Realtime filtré par `user_id`.

**Pourquoi les tantièmes ne sont pas calculés automatiquement ?**
La répartition des tantièmes est juridique (Loi 18-00 marocaine) et varie par immeuble. Le syndic saisit les valeurs manuellement, l'application vérifie la cohérence mais ne les génère pas.

**Pourquoi Zod v4 avec et sans `zodResolver` ?**
Le projet utilise les deux approches selon le contexte : `zodResolver` est utilisé dans plusieurs formulaires React Hook Form, tandis que certaines validations utilisent `schema.safeParse(...)` côté handler ou côté serveur pour un contrôle explicite.

---

## 8. Internationalisation

L'application supporte **3 langues** : Français (défaut), Anglais, Arabe (RTL).

- Librairie : `next-intl` v4
- Routing : cookie `NEXT_LOCALE` (pas de préfixe URL)
- 13 namespaces de traduction dans `messages/{fr,en,ar}/`
- Direction RTL activée automatiquement pour l'arabe via `dir="rtl"` sur `<html>`
- Police arabe : **Noto Naskh Arabic** — appariée à Instrument Serif pour le même registre éditorial
- Les schémas Zod sont des factory functions `createXxxSchema(t)` pour supporter les messages d'erreur traduits

---

## 9. Sécurité

- **JWT + RLS** — double protection : middleware Next.js + politiques PostgreSQL
- **Owner scope validation** — lors de la création d'une réunion, tous les owner IDs invités sont vérifiés pour appartenir aux immeubles du syndic (protection cross-tenant)
- **Meeting detail authorization** — un copropriétaire ne peut accéder au détail d'une réunion que s'il y est invité (vérification serveur-side)
- **Résolution propriétaire server-side** — les routes API portal résolvent toujours l'`owner_id` depuis le JWT, jamais depuis un paramètre client
- **Audit logs immuables** — chaque mutation sensible est enregistrée dans `audit_logs`, les lignes ne sont jamais modifiées ni supprimées

---

## 10. Monitoring et erreurs

- **Sentry** capture toutes les erreurs non gérées en production
- Chaque route a un `error.tsx` (React error boundary) et un `loading.tsx` (skeleton)
- Le journal d'audit (`audit_logs`) enregistre toutes les mutations sensibles de manière immutable

---

## 11. Variables d'environnement requises

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (serveur uniquement) |
| `DATABASE_URL` | Connexion PostgreSQL (port 6543, transaction mode) |
| `UPSTASH_REDIS_REST_URL` | URL Redis Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token Redis Upstash |
| `RESEND_API_KEY` | Clé API Resend |
| `RESEND_FROM_EMAIL` | Email expéditeur vérifié |
| `NEXT_PUBLIC_APP_URL` | URL de production (https://syndico.vercel.app) |
| `SENTRY_DSN` | DSN du projet Sentry |
| `SENTRY_AUTH_TOKEN` | Token pour l'upload des source maps |