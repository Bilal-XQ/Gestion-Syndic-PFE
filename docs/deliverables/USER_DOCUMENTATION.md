# Documentation d'Utilisation — Syndic

**Version :** 1.0  
**Date :** Mars 2026

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
git clone https://github.com/votre-repo/syndic.git
cd syndic
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
# Générer et appliquer les migrations
pnpm drizzle-kit push
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
├── src/lib/          — Server Actions, requêtes DB, validations
├── src/utils/        — Clients Supabase
├── messages/         — Fichiers de traduction (fr, en, ar)
├── docs/             — Documentation
└── middleware.ts     — Protection des routes
```

---

## 4. Guide d'utilisation

### Connexion

Allez sur `/login`. Entrez votre email et mot de passe.  
Le système détecte votre rôle automatiquement :
- Syndic → redirigé vers `/dashboard`
- Copropriétaire → redirigé vers `/portal`

Il n'y a pas de sélecteur de rôle. Si vous oubliez votre mot de passe, cliquez sur "Mot de passe oublié".

---

### Interface Syndic (`/dashboard`)

#### Vue d'ensemble
La page d'accueil affiche 4 indicateurs : propriétaires actifs, appartements, charges actives, paiements reçus. En dessous, la liste des charges impayées ou en retard.

#### Gérer les copropriétaires
1. Menu → **Copropriétaires**
2. Cliquez **Ajouter un copropriétaire**
3. Remplissez le formulaire (nom, email, téléphone, appartement, date d'entrée)
4. Le copropriétaire reçoit automatiquement un email avec ses identifiants

Pour modifier : cliquez l'icône crayon sur la ligne.  
Pour supprimer : cliquez l'icône poubelle → confirmation requise. La suppression est logique (les données financières sont conservées).

#### Gérer les appartements
1. Menu → **Appartements**
2. Ajoutez ou modifiez les unités (numéro, étage, surface, pièces)
3. Le statut (occupé/vacant) se met à jour automatiquement selon l'assignation des copropriétaires

#### Gérer les charges
1. Menu → **Charges**
2. Créez une charge avec titre, catégorie, montant, date d'échéance et appartement cible
3. Sur chaque charge, vous pouvez :
   - Envoyer une **relance email** au copropriétaire
   - Télécharger un **avis de paiement PDF**

#### Gérer les réunions
1. Menu → **Réunions**
2. Créez une réunion (titre, date, heure, lieu)
3. Sélectionnez les copropriétaires à inviter → ils reçoivent un email + notification in-app
4. Consultez les réponses (accepté/décliné) dans la page détail de la réunion

#### Historique des paiements
Menu → **Paiements** → filtrez par date, copropriétaire ou catégorie.

#### Paramètres du bâtiment
Menu → **Paramètres** → mettez à jour le nom du bâtiment, l'adresse et les coordonnées du syndic. Ces informations apparaissent sur tous les PDFs générés.

---

### Interface Copropriétaire (`/portal`)

#### Profil
Consultez vos informations personnelles et les détails de votre appartement.  
Vous pouvez modifier votre numéro de téléphone et changer votre mot de passe.

#### Paiements
Deux onglets :
- **Charges** : liste de vos charges avec statut (payé / partiel / impayé). Cliquez **Payer** pour effectuer un paiement (paiements partiels supportés). Chaque charge a un bouton **Télécharger l'avis PDF**.
- **Historique** : tous vos paiements passés avec date, montant et référence.

#### Notifications
Toutes vos notifications en temps réel. Les invitations à une réunion affichent des boutons **Accepter** / **Décliner**.  
Les notifications non lues sont visuellement distinctes. Cliquer sur une notification la marque comme lue.

---

## 5. Export de données

Sur les pages **Copropriétaires**, **Charges** et **Paiements** du dashboard syndic, un bouton **Exporter** génère un fichier Excel (.xlsx) des données affichées.

---

## 6. Langues disponibles

Cliquez sur l'icône de langue dans la barre de navigation pour changer la langue :
- 🇫🇷 Français (défaut)
- 🇬🇧 English
- 🇲🇦 العربية (avec interface RTL)

---

## 7. Déploiement sur Vercel

### Étape 1 — Pousser sur GitHub
```bash
git add .
git commit -m "deploy"
git push origin main
```

### Étape 2 — Importer sur Vercel

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Importez votre dépôt GitHub
3. Framework détecté automatiquement : **Next.js**

### Étape 3 — Variables d'environnement

Ajoutez toutes les variables du fichier `.env.local` dans :  
**Vercel Dashboard → Project → Settings → Environment Variables**

> Pour `NEXT_PUBLIC_APP_URL`, utilisez votre vraie URL Vercel (ex: `https://syndic.vercel.app`)

### Étape 4 — Déployer

Cliquez **Deploy**. Le build prend environ 2 minutes.

### Étape 5 — Vérifier

Après déploiement, testez :
- [ ] La page d'accueil charge correctement
- [ ] La connexion syndic redirige vers `/dashboard`
- [ ] La connexion copropriétaire redirige vers `/portal`
- [ ] La création d'un copropriétaire envoie bien un email
- [ ] Les notifications arrivent en temps réel

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

# Générer une migration DB
pnpm drizzle-kit generate

# Appliquer les migrations
pnpm drizzle-kit push

# Ouvrir Drizzle Studio (interface DB visuelle)
pnpm drizzle-kit studio
```

---

## 9. Résolution de problèmes courants

**Le build échoue avec une erreur Sentry**  
→ Ajoutez `SENTRY_AUTH_TOKEN` dans vos variables d'environnement Vercel.  
→ En local, utilisez : `$env:SENTRY_DISABLE_SOURCE_MAP_UPLOAD="1"; pnpm build`

**Erreur "The specified token is not valid" avec Vercel CLI**  
→ Utilisez `npx vercel --prod` au lieu de `vercel --prod`. Pas besoin d'installation globale.

**Les notifications ne s'affichent pas en temps réel**  
→ Vérifiez que Supabase Realtime est activé sur la table `notifications` dans le dashboard Supabase.

**L'email de bienvenue n'arrive pas**  
→ Vérifiez que votre domaine expéditeur est vérifié dans Resend (SPF, DKIM, DMARC configurés).

**Erreur 429 à la connexion**  
→ Vous avez dépassé 5 tentatives en 1 minute. Attendez 60 secondes.

**La page affiche "Role not found"**  
→ Le Custom Access Token Hook n'est pas configuré. Suivez l'étape 2.3 de ce guide.