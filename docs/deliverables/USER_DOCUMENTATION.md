# Documentation d'Utilisation — Syndic

**Version :** 2.0  
**Date :** Mars 2026  
**URL de production :** https://syndico.vercel.app

---

## 1. Prérequis

Avant de commencer, vous avez besoin de :

- **Node.js** 18 ou supérieur
- **pnpm** (`npm install -g pnpm`)
- Un compte **Supabase** (gratuit sur supabase.com)
- Un compte **Vercel** (gratuit sur vercel.com)
- Un compte **Upstash** pour Redis (gratuit sur upstash.com)
- Un compte **Resend** pour les emails (gratuit sur resend.com)

---

## 2. Installation locale

### Cloner le projet

```bash
git clone https://github.com/Bilal-XQ/Gestion-Syndic-PFE.git
cd Gestion-Syndic-PFE
pnpm install
```

### Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
DATABASE_URL=postgresql://postgres:[password]@db.votre-projet.supabase.co:6543/postgres?pgbouncer=true
UPSTASH_REDIS_REST_URL=https://votre-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=votre_token
RESEND_API_KEY=re_votre_api_key
RESEND_FROM_EMAIL=noreply@votredomaine.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=https://votre_dsn@sentry.io/projet
SENTRY_AUTH_TOKEN=votre_auth_token
```

> Toutes les clés Supabase se trouvent dans : **Supabase Dashboard → Project Settings → API**

### Configurer la base de données

```bash
pnpm drizzle-kit push
```

Si drizzle-kit ne peut pas se connecter, exécutez ce SQL manuellement dans **Supabase Dashboard → SQL Editor** :

```sql
-- Colonnes ajoutées en Phase 10-11
ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 't2'
  CHECK (type IN ('studio', 't1', 't2', 't3', 't4_plus'));

ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS tantiemes integer NOT NULL DEFAULT 100;

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS total_tantiemes integer NOT NULL DEFAULT 1000;
```

### Configurer le Custom Access Token Hook

Dans le dashboard Supabase :

1. Allez dans **SQL Editor**
2. Exécutez cette fonction :

```sql
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  RETURN jsonb_set(
    event,
    '{claims,app_metadata,user_role}',
    to_jsonb(user_role)
  );
END;
$$ LANGUAGE plpgsql;
```

3. Allez dans **Authentication → Hooks**
4. Activez le hook **Custom Access Token** et sélectionnez cette fonction

### Lancer en développement

```bash
pnpm dev
```

L'application est accessible sur `http://localhost:3000`.

---

## 3. Structure du projet

```
syndic/
├── src/app/          — Pages et routes
├── src/components/   — Composants React
├── src/lib/          — Server Actions, requêtes DB, validations, export
├── src/utils/        — Clients Supabase
├── messages/         — Fichiers de traduction (fr, en, ar)
├── docs/             — Documentation
│   ├── deliverables/ — Documentation technique et utilisateur
│   └── plan/         — Plans de phase
└── middleware.ts     — Protection des routes
```

---

## 4. Guide d'utilisation

### Connexion

Allez sur `/login` (ou https://syndico.vercel.app/login).
Entrez votre email et mot de passe.
Le système détecte votre rôle automatiquement :
- Syndic → redirigé vers `/dashboard`
- Copropriétaire → redirigé vers `/portal`

Il n'y a pas de sélecteur de rôle. Si vous oubliez votre mot de passe, cliquez sur "Mot de passe oublié".

---

### Interface Syndic (`/dashboard`)

#### Vue d'ensemble
La page d'accueil affiche 6 indicateurs (tous calculés sur l'ensemble des immeubles) : propriétaires actifs, total appartements, appartements occupés, appartements vacants, charges actives, total collecté. En dessous, la liste des charges impayées ou en retard avec le graphique d'activité des paiements.

#### Gérer les immeubles
1. Menu → **Immeubles**
2. Cliquez **Ajouter un immeuble**
3. Remplissez : nom, adresse, total des tantièmes (ex: 1000)
4. Modifiez un immeuble avec le crayon — les paramètres de contact sont dans Paramètres

Un syndic peut gérer **plusieurs immeubles** depuis le même compte.

#### Gérer les copropriétaires
1. Menu → **Copropriétaires**
2. Cliquez **Ajouter un copropriétaire**
3. Remplissez : nom, email, téléphone, immeuble, appartement (vacant uniquement), date d'entrée
4. Le copropriétaire reçoit automatiquement un email avec ses identifiants

Pour modifier : cliquez l'icône crayon.
Pour supprimer : cliquez l'icône poubelle → confirmation requise. La suppression est logique (données financières conservées).

#### Gérer les appartements
1. Menu → **Appartements**
2. Les appartements sont groupés par immeuble (sections repliables)
3. Ajoutez ou modifiez : numéro, étage, surface, pièces, type (Studio/T1/T2/T3/T4+), tantièmes
4. Le statut (occupé/vacant) se met à jour automatiquement selon l'assignation des copropriétaires
5. Cliquez une ligne pour voir le détail (propriétaire, charges actives, solde)

**Tantièmes** : la quote-part de l'appartement dans l'immeuble. Exemple : 150 sur 1000 = 15% des charges communes.

#### Gérer les charges
1. Menu → **Charges**
2. Créez une charge — choisissez la cible :
   - **Appartement spécifique** : montant fixe pour un appartement
   - **Immeuble entier** : le montant est distribué proportionnellement selon les tantièmes de chaque appartement
3. Sur chaque charge, vous pouvez :
   - Envoyer une **relance email** au copropriétaire
   - Télécharger un **avis de paiement PDF**

#### Gérer les réunions
1. Menu → **Réunions**
2. Créez une réunion (titre, description, date, heure, lieu)
3. Sélectionnez les copropriétaires à inviter → ils reçoivent un email + notification in-app
4. Consultez les réponses (accepté/décliné) dans la page détail de la réunion

#### Historique des paiements
Menu → **Paiements** → filtrez par date, copropriétaire ou catégorie. Le résumé financier montre total émis, total collecté, solde restant.

#### Paramètres du bâtiment
Menu → **Paramètres** → sélectionnez l'immeuble à configurer (si plusieurs) → mettez à jour le nom, l'adresse et les coordonnées du syndic. Ces informations apparaissent sur tous les PDFs générés.

---

### Interface Copropriétaire (`/portal`)

#### Mon espace (tableau de bord)
La page d'accueil affiche 3 indicateurs :
- **Solde restant** : total de vos charges impayées (amber si > 0, vert si soldé)
- **Prochaine réunion** : titre et date de la prochaine assemblée
- **Notifications non lues** : compteur

En dessous, votre profil complet :
- Informations personnelles (nom, email, date d'entrée)
- Détails appartement (numéro, étage, surface, pièces, **tantièmes**)
- Informations immeuble (nom, adresse)
- Modification du téléphone (inline)
- Changement de mot de passe

#### Mes paiements
Deux sections visibles directement :
- **Total des charges** et **Solde restant** (cartes résumé)

Deux onglets :
- **Mes charges** : liste de vos charges avec statut (Payé / Partiel / Impayé). Cliquez **Payer** pour effectuer un paiement (paiements partiels supportés). Chaque charge a un bouton **Télécharger l'avis PDF**.
- **Historique** : tous vos paiements passés avec date, montant, méthode et référence. Export Excel disponible.

#### Mes réunions
Deux onglets :
- **À venir** : réunions programmées auxquelles vous êtes invité, avec compteur. Pour chaque réunion : titre, date, heure, lieu, ordre du jour. Boutons **Accepter** / **Décliner** si vous n'avez pas encore répondu. Badge de statut (Invité / Accepté / Décliné).
- **Passées** : réunions archivées, lecture seule.

#### Notifications
Toutes vos notifications en temps réel (Supabase Realtime — aucun rechargement nécessaire).
- Les notifications non lues ont une bordure gauche et un point visible
- Les invitations acceptées/déclinées affichent un badge de statut coloré
- Cliquer sur une notification la marque comme lue
- Bouton "Tout marquer comme lu" disponible

---

## 5. Export de données

Des boutons **Exporter** (.xlsx) sont disponibles sur :
- **Copropriétaires** — liste filtrée des propriétaires
- **Appartements** — liste filtrée avec tantièmes et propriétaires
- **Charges** — liste filtrée avec statuts
- **Paiements** (syndic) — historique filtré
- **Historique paiements** (copropriétaire) — ses propres paiements

---

## 6. Langues disponibles

Cliquez sur l'icône 🌐 dans la barre de navigation pour changer la langue :
- 🇫🇷 Français (défaut)
- 🇬🇧 English
- 🇲🇦 العربية (interface RTL complète, police Noto Naskh Arabic)

---

## 7. Déploiement sur Vercel

Le projet est déjà déployé sur : **https://syndico.vercel.app**

Pour redéployer après des modifications :

### Étape 1 — Pousser sur GitHub

```bash
git add .
git commit -m "votre message"
git push origin main
```

Vercel détecte le push et redéploie automatiquement.

### Étape 2 — Variables d'environnement (première fois)

Dans **Vercel Dashboard → Project → Settings → Environment Variables**, ajoutez toutes les variables de `.env.local`.

> Pour `NEXT_PUBLIC_APP_URL`, utilisez `https://syndico.vercel.app`

### Étape 3 — Vérifier après déploiement

- [ ] La landing page charge sur `/`
- [ ] La connexion syndic redirige vers `/dashboard`
- [ ] La connexion copropriétaire redirige vers `/portal`
- [ ] La création d'un copropriétaire envoie un email
- [ ] Les notifications arrivent en temps réel
- [ ] Le PDF de paiement se télécharge correctement

---

## 8. Commandes utiles

```bash
# Développement
pnpm dev

# Build de production (local)
$env:SENTRY_DISABLE_SOURCE_MAP_UPLOAD="1"; pnpm build   # Windows
SENTRY_DISABLE_SOURCE_MAP_UPLOAD=1 pnpm build           # Mac/Linux

# Vérification TypeScript
pnpm tsc --noEmit

# Lancer les tests
pnpm test

# Appliquer les migrations DB
pnpm drizzle-kit push

# Ouvrir Drizzle Studio (interface DB visuelle)
pnpm drizzle-kit studio
```

---

## 9. Résolution de problèmes courants

**Le build échoue avec une erreur Sentry**
→ Ajoutez `SENTRY_AUTH_TOKEN` dans vos variables d'environnement Vercel.
→ En local : `$env:SENTRY_DISABLE_SOURCE_MAP_UPLOAD="1"; pnpm build`

**Toutes les pages retournent 404 sauf la landing**
→ Un ancien processus Node.js est actif sur le port 3000. Fermez-le et relancez `pnpm dev`.
→ Vérifiez que le fichier `middleware.ts` n'a pas été modifié.

**Erreur MISSING_MESSAGE sur une page**
→ Un namespace de traduction est manquant. Vérifiez que `messages/fr/`, `messages/en/` et `messages/ar/` contiennent tous le fichier JSON correspondant.
→ Vérifiez que `src/i18n/request.ts` liste le namespace dans sa configuration.

**Les notifications ne s'affichent pas en temps réel**
→ Vérifiez que Supabase Realtime est activé sur la table `notifications` dans le dashboard Supabase.

**L'email de bienvenue n'arrive pas**
→ Vérifiez que votre domaine expéditeur est vérifié dans Resend (SPF, DKIM, DMARC configurés).

**Erreur 429 à la connexion**
→ Vous avez dépassé 5 tentatives en 1 minute. Attendez 60 secondes.

**La page affiche "Role not found" ou boucle sur /login**
→ Le Custom Access Token Hook n'est pas configuré. Suivez l'étape 2.3 de ce guide.

**Les tantièmes ne s'affichent pas**
→ La migration de base de données n'a pas été appliquée. Exécutez le SQL de la section 2 dans Supabase SQL Editor.

**"drizzle-kit push" échoue en local**
→ Vérifiez que `DATABASE_URL` dans `.env.local` utilise le port 6543 (transaction mode) et non 5432.