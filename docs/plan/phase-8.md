# Phase 8 — Internationalization (EN / FR / AR + RTL)

## Overview

Add full internationalization to the Syndic app supporting three languages:
French (default, LTR), English (LTR), and Arabic (RTL). Every hardcoded
French string across ~55 files will be extracted into namespaced JSON
translation files. The locale is stored in a `NEXT_LOCALE` cookie — no URL
prefixes are added. A language switcher appears in both sidebars and on the
login page. Arabic requires RTL layout and the IBM Plex Arabic font.

## Architecture: why preference-based routing

URL-based locale prefixes (`/fr/dashboard`, `/ar/portal`) would break every
existing redirect in `middleware.ts` (auth redirects to `/dashboard`,
`/portal`, `/login`), all `<Link href>` values throughout the app, and the
`SYNDIC_PREFIX` / `OWNER_PREFIXES` constants used for role-based route
protection. Preference-based routing avoids all of this: the locale lives in
a `NEXT_LOCALE` cookie, `next-intl` reads it in middleware, and every
existing URL continues to work unchanged.

## Dependencies to install

| Package | Version | Purpose |
|---------|---------|---------|
| `next-intl` | `^4` | i18n framework (messages, hooks, middleware plugin) |
| `@next/font` already covered by `next/font/google` | — | IBM Plex Arabic via Google Fonts |

No other packages are required. `next-intl` v4 supports Next.js 15+ and the App Router.

## New files to create (non-component)

```
src/i18n/
  config.ts                    ← locale list, default locale, cookie name
  request.ts                   ← getRequestConfig for server-side message loading
messages/
  fr/
    common.json
    auth.json
    dashboard.json
    owners.json
    apartments.json
    charges.json
    payments.json
    meetings.json
    settings.json
    portal.json
    notifications.json
    landing.json
    validation.json
  en/
    (same 13 files)
  ar/
    (same 13 files)
```

## New components to create

| File | Type | Purpose |
|------|------|---------|
| `src/components/layout/language-switcher.tsx` | `"use client"` | Dropdown to switch locale (writes cookie + reloads) |

## Translation file structure

### Namespace: `common`

Shared labels reused across multiple features.

```json
{
  "appName": "Syndic",
  "navigation": "Navigation",
  "actions": "Actions",
  "save": "Enregistrer",
  "cancel": "Annuler",
  "delete": "Supprimer",
  "edit": "Modifier",
  "create": "Créer",
  "add": "Ajouter",
  "update": "Mettre à jour",
  "search": "Rechercher",
  "loading": "Chargement…",
  "retry": "Réessayer",
  "back": "Retour",
  "noResults": "Aucun résultat",
  "selectDate": "Choisir une date",
  "errorOccurred": "Une erreur est survenue",
  "somethingWentWrong": "Quelque chose s'est mal passé. Veuillez réessayer.",
  "status": {
    "paid": "Payé",
    "partial": "Partiel",
    "unpaid": "Impayé",
    "occupied": "Occupé",
    "vacant": "Vacant",
    "scheduled": "Planifiée",
    "completed": "Terminée",
    "cancelled": "Annulée",
    "accepted": "Acceptée",
    "declined": "Refusée",
    "invited": "Invité"
  },
  "categories": {
    "electricity": "Électricité",
    "water": "Eau",
    "maintenance": "Entretien",
    "repair": "Réparation",
    "other": "Autre"
  },
  "paymentMethods": {
    "transfer": "Virement",
    "transferFull": "Virement bancaire",
    "check": "Chèque",
    "cash": "Espèces"
  },
  "currency": "MAD",
  "unitSuffix": "m²",
  "floor": "Étage",
  "userMenu": {
    "myProfile": "Mon profil",
    "signOut": "Déconnexion"
  },
  "themeToggle": {
    "switchToLight": "Passer en mode clair",
    "switchToDark": "Passer en mode sombre"
  },
  "languageSwitcher": {
    "fr": "FR",
    "en": "EN",
    "ar": "عر"
  },
  "fallbackUserName": "Utilisateur",
  "roleLabels": {
    "admin": "Administrateur",
    "owner": "Copropriétaire"
  }
}
```

### Namespace: `auth`

Login, reset-password, and password update flows.

```json
{
  "login": {
    "pageTitle": "Connexion — Syndic",
    "subtitle": "Connectez-vous à votre compte",
    "emailLabel": "Adresse e-mail",
    "emailPlaceholder": "vous@exemple.com",
    "passwordLabel": "Mot de passe",
    "forgotPassword": "Mot de passe oublié ?",
    "rememberMe": "Se souvenir de moi",
    "submitting": "Connexion…",
    "submit": "Se connecter"
  },
  "resetPassword": {
    "pageTitle": "Réinitialiser le mot de passe — Syndic",
    "headingWithCode": "Nouveau mot de passe",
    "headingWithoutCode": "Mot de passe oublié",
    "subtitleWithCode": "Choisissez un nouveau mot de passe",
    "subtitleWithoutCode": "Entrez votre e-mail pour recevoir un lien de réinitialisation",
    "emailLabel": "Adresse e-mail",
    "emailPlaceholder": "vous@exemple.com",
    "submitting": "Envoi…",
    "submit": "Envoyer le lien de réinitialisation",
    "successMessage": "Si cette adresse est associée à un compte, vous recevrez un e-mail avec un lien de réinitialisation.",
    "backToLogin": "Retour à la connexion"
  },
  "updatePassword": {
    "newPasswordLabel": "Nouveau mot de passe",
    "confirmPasswordLabel": "Confirmer le mot de passe",
    "submitting": "Mise à jour…",
    "submit": "Mettre à jour le mot de passe"
  },
  "passwordInput": {
    "showPassword": "Afficher le mot de passe",
    "hidePassword": "Masquer le mot de passe"
  },
  "errors": {
    "invalidCredentials": "Identifiants invalides. Veuillez réessayer.",
    "signOutFailed": "Erreur lors de la déconnexion.",
    "updatePasswordFailed": "Impossible de mettre à jour le mot de passe."
  },
  "errorPage": {
    "heading": "Une erreur est survenue",
    "message": "Quelque chose s'est mal passé. Veuillez réessayer.",
    "retry": "Réessayer"
  }
}
```

### Namespace: `dashboard`

Syndic dashboard overview page.

```json
{
  "pageTitle": "Tableau de bord",
  "welcome": "Bienvenue, {name}",
  "fallbackName": "Syndic",
  "overdueCharges": "Charges en retard",
  "metrics": {
    "owners": "Copropriétaires",
    "ownersSecondary": "propriétaires actifs",
    "apartments": "Appartements",
    "apartmentsSecondary": "dans l'immeuble",
    "occupied": "Occupés",
    "occupiedSecondary": "appartements occupés",
    "vacant": "Vacants",
    "vacantSecondary": "appartements disponibles",
    "activeCharges": "Charges actives",
    "activeChargesSecondary": "en attente de paiement",
    "totalCollected": "Total collecté",
    "totalCollectedSecondary": "paiements reçus"
  },
  "recentPayments": {
    "title": "Paiements récents",
    "last_one": "dernier",
    "last_other": "derniers",
    "empty": "Aucun paiement pour l'instant"
  },
  "paymentChart": {
    "title": "Activité des paiements",
    "subtitle": "6 derniers mois",
    "empty": "Aucun paiement enregistré"
  },
  "overdueTable": {
    "owner": "Propriétaire",
    "charge": "Charge",
    "apartment": "Appartement",
    "remaining": "Restant",
    "dueDate": "Échéance",
    "empty": "Aucune charge en retard"
  }
}
```

### Namespace: `owners`

Owner CRUD, table, and delete dialog.

```json
{
  "pageTitle": "Copropriétaires",
  "searchPlaceholder": "Rechercher par nom ou e-mail…",
  "addButton": "Ajouter",
  "table": {
    "fullName": "Nom complet",
    "email": "E-mail",
    "phone": "Téléphone",
    "apartment": "Appartement",
    "actions": "Actions",
    "empty": "Aucun copropriétaire trouvé"
  },
  "panel": {
    "createTitle": "Ajouter un copropriétaire",
    "editTitle": "Modifier le copropriétaire",
    "createDescription": "Remplissez les informations du nouveau copropriétaire.",
    "editDescription": "Modifiez les informations du copropriétaire.",
    "firstNameLabel": "Prénom",
    "firstNamePlaceholder": "Jean",
    "lastNameLabel": "Nom",
    "lastNamePlaceholder": "Dupont",
    "emailLabel": "E-mail",
    "emailPlaceholder": "jean@exemple.fr",
    "phoneLabel": "Téléphone",
    "phonePlaceholder": "+212 6XX XXX XXX",
    "apartmentLabel": "Appartement",
    "apartmentPlaceholder": "Sélectionner un appartement",
    "ownershipDateLabel": "Date de propriété",
    "submitting": "Enregistrement…",
    "createButton": "Créer",
    "updateButton": "Mettre à jour",
    "createSuccess": "Copropriétaire créé avec succès",
    "updateSuccess": "Copropriétaire mis à jour"
  },
  "delete": {
    "title": "Êtes-vous sûr ?",
    "description": "Le copropriétaire {ownerName} sera archivé. Ses données financières seront conservées.",
    "submitting": "Archivage…",
    "submit": "Archiver",
    "success": "Copropriétaire archivé"
  }
}
```

### Namespace: `apartments`

Apartment CRUD, table, and delete dialog.

```json
{
  "pageTitle": "Appartements",
  "searchPlaceholder": "Rechercher par numéro…",
  "addButton": "Ajouter",
  "table": {
    "unitNumber": "Numéro",
    "floor": "Étage",
    "surfaceArea": "Superficie",
    "rooms": "Pièces",
    "status": "Statut",
    "actions": "Actions",
    "empty": "Aucun appartement trouvé"
  },
  "panel": {
    "createTitle": "Ajouter un appartement",
    "editTitle": "Modifier l'appartement",
    "createDescription": "Remplissez les informations du nouvel appartement.",
    "editDescription": "Modifiez les informations de l'appartement.",
    "unitNumberLabel": "Numéro",
    "unitNumberPlaceholder": "A101",
    "floorLabel": "Étage",
    "surfaceAreaLabel": "Superficie (m²)",
    "roomCountLabel": "Nombre de pièces",
    "submitting": "Enregistrement…",
    "createButton": "Créer",
    "updateButton": "Mettre à jour",
    "createSuccess": "Appartement créé avec succès",
    "updateSuccess": "Appartement mis à jour"
  },
  "delete": {
    "title": "Êtes-vous sûr ?",
    "description": "L'appartement {unitNumber} sera archivé. Cette action est réversible.",
    "submitting": "Suppression…",
    "submit": "Supprimer",
    "success": "Appartement supprimé"
  }
}
```

### Namespace: `charges`

Charge CRUD, table, and delete dialog.

```json
{
  "pageTitle": "Charges",
  "searchPlaceholder": "Rechercher par titre ou appartement…",
  "addButton": "Nouvelle charge",
  "table": {
    "title": "Titre",
    "apartment": "Appartement",
    "category": "Catégorie",
    "total": "Total",
    "paid": "Payé",
    "remaining": "Restant",
    "dueDate": "Échéance",
    "status": "Statut",
    "actions": "Actions",
    "empty": "Aucune charge trouvée",
    "sendReminder": "Envoyer rappel",
    "downloadNotice": "Télécharger avis",
    "reminderSuccess": "Rappel envoyé avec succès"
  },
  "panel": {
    "title": "Nouvelle charge",
    "description": "Créez une charge pour un appartement.",
    "titleLabel": "Titre",
    "titlePlaceholder": "Électricité Q1 2026",
    "descriptionLabel": "Description (optionnel)",
    "descriptionPlaceholder": "Détails de la charge…",
    "categoryLabel": "Catégorie",
    "categoryPlaceholder": "Choisir une catégorie",
    "amountLabel": "Montant total (MAD)",
    "dueDateLabel": "Date d'échéance",
    "apartmentLabel": "Appartement",
    "apartmentPlaceholder": "Choisir un appartement",
    "submitting": "Création…",
    "submit": "Créer la charge",
    "success": "Charge créée avec succès"
  },
  "delete": {
    "title": "Êtes-vous sûr ?",
    "description": "La charge {chargeTitle} sera archivée. Cette action est réversible.",
    "submitting": "Suppression…",
    "submit": "Supprimer",
    "success": "Charge supprimée"
  }
}
```

### Namespace: `payments`

Syndic payments table and owner payment form.

```json
{
  "pageTitle": "Paiements",
  "summary": {
    "totalCharges": "Total charges",
    "totalCollected": "Total encaissé",
    "remainingBalance": "Solde restant"
  },
  "filters": {
    "from": "Du",
    "to": "Au",
    "owner": "Propriétaire",
    "all": "Tous",
    "category": "Catégorie",
    "allCategories": "Toutes catégories",
    "allCategoriesShort": "Toutes"
  },
  "table": {
    "owner": "Propriétaire",
    "charge": "Charge",
    "amount": "Montant",
    "date": "Date",
    "method": "Méthode",
    "reference": "Référence",
    "empty": "Aucun paiement trouvé"
  },
  "ownerForm": {
    "title": "Effectuer un paiement",
    "descriptionWithCharge": "Solde restant :",
    "descriptionNoCharge": "Sélectionnez une charge",
    "amountLabel": "Montant (max {max})",
    "paymentDateLabel": "Date de paiement",
    "methodLabel": "Méthode de paiement",
    "referenceLabel": "Référence",
    "notesLabel": "Notes (optionnel)",
    "notesPlaceholder": "Détails supplémentaires…",
    "submitting": "Enregistrement…",
    "submit": "Enregistrer le paiement",
    "success": "Paiement enregistré avec succès"
  }
}
```

### Namespace: `meetings`

Meeting CRUD, table, detail page, and delete dialog.

```json
{
  "pageTitle": "Réunions",
  "searchPlaceholder": "Rechercher une réunion…",
  "addButton": "Nouvelle réunion",
  "table": {
    "title": "Titre",
    "date": "Date",
    "time": "Horaire",
    "location": "Lieu",
    "status": "Statut",
    "invitations": "Invitations",
    "actions": "Actions",
    "empty": "Aucune réunion trouvée",
    "viewDetails": "Voir détails",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "accepted_one": "accepté",
    "accepted_other": "acceptés",
    "cancelSuccess": "Réunion annulée"
  },
  "panel": {
    "title": "Nouvelle réunion",
    "description": "Planifiez une assemblée générale et invitez des copropriétaires.",
    "titleLabel": "Titre",
    "titlePlaceholder": "Assemblée Générale Q2 2026",
    "descriptionLabel": "Description (optionnel)",
    "descriptionPlaceholder": "Ordre du jour…",
    "dateLabel": "Date",
    "startTimeLabel": "Heure de début",
    "startTimePlaceholder": "Choisir une heure",
    "endTimeLabel": "Heure de fin",
    "endTimePlaceholder": "Choisir une heure",
    "locationLabel": "Lieu",
    "locationPlaceholder": "Salle de réunion",
    "ownersLabel": "Copropriétaires à inviter",
    "selected_one": "sélectionné",
    "selected_other": "sélectionnés",
    "ownersPlaceholder": "Sélectionner des copropriétaires",
    "ownerSearchPlaceholder": "Rechercher…",
    "ownerSearchEmpty": "Aucun résultat",
    "submitting": "Création…",
    "submit": "Créer la réunion",
    "success": "Réunion créée avec succès"
  },
  "detail": {
    "backButton": "Retour aux réunions",
    "cancelButton": "Annuler la réunion",
    "cancelling": "Annulation…",
    "errorLoading": "Impossible de charger les détails de la réunion.",
    "dateLabel": "Date",
    "timeLabel": "Horaire",
    "locationLabel": "Lieu",
    "participantsLabel": "Participants",
    "confirmed": "confirmés",
    "descriptionTitle": "Description",
    "invitationsTitle": "Invitations",
    "invitationTable": {
      "name": "Nom",
      "email": "Email",
      "status": "Statut",
      "respondedAt": "Répondu le",
      "empty": "Aucune invitation"
    },
    "cancelSuccess": "Réunion annulée"
  },
  "delete": {
    "title": "Supprimer la réunion ?",
    "description": "Cette action est irréversible. La réunion sera archivée et ne sera plus visible dans la liste.",
    "submitting": "Suppression…",
    "submit": "Supprimer",
    "success": "Réunion supprimée"
  }
}
```

### Namespace: `settings`

Building settings form.

```json
{
  "pageTitle": "Paramètres",
  "pageTitleAuthenticated": "Paramètres de l'immeuble",
  "unauthenticated": "Non authentifié",
  "form": {
    "buildingLegend": "Immeuble",
    "buildingNameLabel": "Nom de l'immeuble",
    "buildingNamePlaceholder": "Résidence les Oliviers",
    "addressLabel": "Adresse",
    "addressPlaceholder": "12 Rue de la Paix, Casablanca",
    "contactLegend": "Coordonnées du syndic",
    "phoneLabel": "Téléphone",
    "phonePlaceholder": "+212 6 00 00 00 00",
    "emailLabel": "E-mail de contact",
    "emailPlaceholder": "syndic@example.com",
    "submit": "Enregistrer",
    "success": "Paramètres mis à jour"
  }
}
```

### Namespace: `portal`

Owner portal: profile view, tabs, phone edit, password change.

```json
{
  "pageTitle": "Mon profil",
  "profile": {
    "personalInfo": "Informations personnelles",
    "nameLabel": "Nom",
    "emailLabel": "Email",
    "ownershipDateLabel": "Date de propriété",
    "apartmentSection": "Appartement",
    "unitLabel": "Unité",
    "floorLabel": "Étage",
    "surfaceLabel": "Surface",
    "roomsLabel": "Pièces",
    "buildingSection": "Immeuble",
    "buildingNameLabel": "Nom",
    "buildingAddressLabel": "Adresse",
    "phoneLabel": "Téléphone",
    "phonePlaceholder": "06 12 34 56 78",
    "phoneNotSet": "Non renseigné",
    "phoneSubmit": "Enregistrer",
    "phoneCancel": "Annuler",
    "phoneEditButton": "Modifier",
    "phoneSuccess": "Téléphone mis à jour",
    "changePassword": "Changer le mot de passe",
    "newPasswordLabel": "Nouveau mot de passe",
    "confirmPasswordLabel": "Confirmer le mot de passe",
    "changePasswordSubmitting": "Modification…",
    "changePasswordSubmit": "Modifier le mot de passe",
    "changePasswordSuccess": "Mot de passe modifié avec succès",
    "errorLoading": "Impossible de charger le profil."
  },
  "ownerPayments": {
    "pageTitle": "Mes paiements",
    "tabCharges": "Mes charges",
    "tabHistory": "Historique",
    "chargesEmpty": "Aucune charge pour le moment.",
    "historyEmpty": "Aucun paiement enregistré.",
    "chargesTable": {
      "title": "Titre",
      "category": "Catégorie",
      "total": "Total",
      "paid": "Payé",
      "remaining": "Restant",
      "status": "Statut",
      "dueDate": "Échéance",
      "actions": "Actions",
      "payButton": "Payer",
      "noticeButton": "Avis"
    },
    "historyTable": {
      "date": "Date",
      "charge": "Charge",
      "amount": "Montant",
      "method": "Méthode",
      "reference": "Référence",
      "notes": "Notes"
    }
  }
}
```

### Namespace: `notifications`

Notification list and actions.

```json
{
  "pageTitle": "Notifications",
  "unreadCount_zero": "0 notification non lue",
  "unreadCount_one": "{count} notification non lue",
  "unreadCount_other": "{count} notifications non lues",
  "markAllRead": "Tout marquer comme lu",
  "markAllReadSuccess": "Toutes les notifications marquées comme lues",
  "empty": "Aucune notification pour le moment.",
  "alreadyRead": "Déjà lu",
  "markAsRead": "Marquer comme lu",
  "accept": "Accepter",
  "decline": "Décliner",
  "responseSuccess": "Réponse enregistrée"
}
```

### Namespace: `landing`

Public landing page (`src/app/page.tsx`).

```json
{
  "nav": {
    "login": "Connexion"
  },
  "hero": {
    "badge": "Gestion de copropriété",
    "headline": "Simplifiez la gestion de votre copropriété",
    "subheadline": "Une plateforme moderne pour les syndics et les copropriétaires. Paiements, réunions, charges — tout au même endroit.",
    "cta": "Commencer maintenant",
    "ctaSecondary": "Découvrir les fonctionnalités"
  },
  "features": {
    "badge": "Fonctionnalités",
    "heading": "Tout ce dont vous avez besoin",
    "buildings": {
      "title": "Gestion des immeubles",
      "description": "Suivez vos bâtiments, appartements et lots avec une vue centralisée et hiérarchique."
    },
    "owners": {
      "title": "Copropriétaires",
      "description": "Gérez les profils, les quotas de tantièmes et invitez les propriétaires à leur portail."
    },
    "payments": {
      "title": "Paiements & Charges",
      "description": "Générez des appels de charges, enregistrez les paiements et suivez les créances en temps réel."
    },
    "meetings": {
      "title": "Réunions & PV",
      "description": "Planifiez des assemblées, rédigez les ordres du jour et archivez les procès-verbaux."
    },
    "dashboard": {
      "title": "Tableau de bord",
      "description": "Indicateurs clés, taux de recouvrement et tendances de paiement en un coup d'œil."
    },
    "security": {
      "title": "Sécurité & Audit",
      "description": "Authentification sécurisée, journal d'audit immutable et contrôle d'accès par rôle."
    }
  },
  "stats": {
    "openSource": "Open Source",
    "secureRoles": "Rôles sécurisés",
    "integratedModules": "Modules intégrés",
    "hiddenFees": "Frais cachés"
  },
  "cta": {
    "heading": "Prêt à moderniser votre gestion ?",
    "description": "Rejoignez les syndics qui ont choisi une solution simple, sécurisée et efficace.",
    "button": "Accéder à la plateforme"
  },
  "footer": {
    "brand": "Syndic — Gestion de Copropriété",
    "copyright": "© {year} Syndic. Tous droits réservés."
  }
}
```

### Namespace: `validation`

Zod schema error messages (shared client + server).

```json
{
  "auth": {
    "emailRequired": "L'adresse e-mail est requise",
    "emailInvalid": "Adresse e-mail invalide",
    "passwordRequired": "Le mot de passe est requis",
    "passwordMin8": "Le mot de passe doit contenir au moins 8 caractères",
    "confirmPasswordRequired": "Veuillez confirmer le mot de passe",
    "passwordsMismatch": "Les mots de passe ne correspondent pas"
  },
  "apartment": {
    "unitNumberRequired": "Le numéro est requis",
    "floorInteger": "L'étage doit être un entier",
    "surfacePositive": "La superficie doit être positive",
    "roomCountInteger": "Le nombre de pièces doit être un entier",
    "roomCountMin": "Au moins 1 pièce"
  },
  "charge": {
    "titleRequired": "Le titre est requis",
    "categoryInvalid": "Catégorie invalide",
    "amountPositive": "Le montant doit être positif",
    "dueDateRequired": "La date d'échéance est requise",
    "apartmentInvalid": "Appartement invalide"
  },
  "meeting": {
    "titleRequired": "Le titre est requis",
    "dateRequired": "La date est requise",
    "startTimeRequired": "L'heure de début est requise",
    "endTimeRequired": "L'heure de fin est requise",
    "locationRequired": "Le lieu est requis",
    "ownerInvalid": "Propriétaire invalide",
    "selectAtLeastOneOwner": "Sélectionnez au moins un propriétaire",
    "endTimeAfterStart": "L'heure de fin doit être après l'heure de début",
    "invitationInvalid": "Invitation invalide",
    "responseInvalid": "Réponse invalide"
  },
  "owner": {
    "firstNameRequired": "Le prénom est requis",
    "lastNameRequired": "Le nom est requis",
    "emailInvalid": "Adresse e-mail invalide",
    "apartmentInvalid": "Appartement invalide",
    "dateInvalid": "Date invalide"
  },
  "payment": {
    "chargeInvalid": "Charge invalide",
    "ownerInvalid": "Propriétaire invalide",
    "amountPositive": "Le montant doit être positif",
    "paymentDateRequired": "La date de paiement est requise",
    "methodInvalid": "Méthode de paiement invalide",
    "referenceRequired": "La référence est requise"
  },
  "profile": {
    "phoneMin": "Le numéro doit contenir au moins 8 caractères",
    "phoneMax": "Le numéro ne doit pas dépasser 20 caractères",
    "passwordMin8": "8 caractères minimum",
    "passwordsMismatch": "Les mots de passe ne correspondent pas"
  },
  "settings": {
    "buildingNameRequired": "Le nom de l'immeuble est requis",
    "addressRequired": "L'adresse est requise",
    "emailInvalid": "Adresse e-mail invalide"
  }
}
```

### Namespace: `notFound`

404 page.

```json
{
  "heading": "Page introuvable",
  "description": "La page que vous recherchez n'existe pas ou a été déplacée.",
  "backHome": "Retour à l'accueil"
}
```

> **Note on the `validation` namespace:** Zod error messages must be
> dynamically resolved. See Step 8 for the approach: the Zod schemas
> reference translation keys and a helper function resolves them at
> validation time. This keeps "one Zod schema per domain, shared
> client and server" intact.

---

## Steps

### Step 1 — Install `next-intl`

**Files to modify:** `package.json` (via `pnpm add`)
**Files to create:** none
**What to do:**

```bash
pnpm add next-intl
```

**Depends on:** none

---

### Step 2 — Create `next-intl` configuration files

**Files to modify:** none
**Files to create:**
- `src/i18n/config.ts`
- `src/i18n/request.ts`

**What to do:**

**`src/i18n/config.ts`:**
```ts
export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const rtlLocales: Locale[] = ["ar"];

export const LOCALE_COOKIE = "NEXT_LOCALE";
```

**`src/i18n/request.ts`:**
```ts
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(raw as Locale)
    ? (raw as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}/common.json`)).default,
    // Additional namespaces are loaded per-page via useMessages / getMessages
  };
});
```

> **Important:** `next-intl` v4 with App Router uses `getRequestConfig` from
> `next-intl/server`. The `messages` field can load all namespaces for the
> locale eagerly (by merging all JSON files), or lazily per-namespace.
> For simplicity, **eagerly load all namespaces** for the active locale by
> merging all JSON files in the `getRequestConfig` return. This avoids
> per-page namespace wiring:

```ts
// Eager approach — preferred for this project's size:
const modules = await Promise.all([
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
const messages = Object.assign({}, ...modules.map((m) => m.default));
```

Wait — the above merges flat. Since each namespace file's keys are the
namespace itself, the correct approach is to key them:

```ts
return {
  locale,
  messages: {
    common: (await import(`../../messages/${locale}/common.json`)).default,
    auth: (await import(`../../messages/${locale}/auth.json`)).default,
    dashboard: (await import(`../../messages/${locale}/dashboard.json`)).default,
    owners: (await import(`../../messages/${locale}/owners.json`)).default,
    apartments: (await import(`../../messages/${locale}/apartments.json`)).default,
    charges: (await import(`../../messages/${locale}/charges.json`)).default,
    payments: (await import(`../../messages/${locale}/payments.json`)).default,
    meetings: (await import(`../../messages/${locale}/meetings.json`)).default,
    settings: (await import(`../../messages/${locale}/settings.json`)).default,
    portal: (await import(`../../messages/${locale}/portal.json`)).default,
    notifications: (await import(`../../messages/${locale}/notifications.json`)).default,
    landing: (await import(`../../messages/${locale}/landing.json`)).default,
    validation: (await import(`../../messages/${locale}/validation.json`)).default,
  },
};
```

**Depends on:** Step 1

---

### Step 3 — Update `next.config.ts` for `next-intl` plugin

**Files to modify:** `next.config.ts`
**Files to create:** none
**What to do:**

Wrap the existing config with `createNextIntlPlugin`:

```ts
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // ... existing Sentry options unchanged
});
```

The `createNextIntlPlugin` call must wrap the config **before** Sentry
wraps it, so the order is `withSentryConfig(withNextIntl(nextConfig), ...)`.

**Depends on:** Step 2

---

### Step 4 — Integrate locale detection into `middleware.ts`

**Files to modify:** `middleware.ts`
**Files to create:** none
**What to do:**

The existing `middleware.ts` has: rate limiting (step 1), Supabase session
refresh (step 2), auth redirects (steps 3-4), and returns `supabaseResponse`
(step 5). The `supabaseResponse` is a `NextResponse.next()` that already
carries the Supabase cookie mutations.

`next-intl` with preference-based routing does NOT need its own middleware
plugin for URL rewriting. Instead, we manually read the `NEXT_LOCALE`
cookie and set the `x-next-intl-locale` header on the response so
`next-intl` knows the active locale.

**Changes to `middleware.ts`:**

1. Import the config:
```ts
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "@/i18n/config";
```

2. At the **end** of the middleware function, just before `return supabaseResponse;`,
add locale header injection:

```ts
// 6. Inject locale for next-intl (preference-based, no URL rewriting)
const raw = request.cookies.get(LOCALE_COOKIE)?.value;
const locale: Locale = locales.includes(raw as Locale)
  ? (raw as Locale)
  : defaultLocale;
supabaseResponse.headers.set("x-next-intl-locale", locale);
```

**Critical: do NOT call `createMiddleware` from `next-intl`.** That
function rewrites URLs with locale prefixes — the exact thing we're
avoiding. We only need the locale value available to `getRequestConfig`,
which reads the cookie directly.

Actually, since `getRequestConfig` in `src/i18n/request.ts` already reads
the `NEXT_LOCALE` cookie via `cookies()`, no header injection is needed
at all. The middleware does NOT need to be modified for locale detection.
The `next-intl` plugin configured in `next.config.ts` + the
`getRequestConfig` reading the cookie is sufficient.

**The only middleware change needed** is to ensure that when we redirect
(steps 3-4), the response preserves the `NEXT_LOCALE` cookie. Since we
use `NextResponse.redirect(url)` which starts a new response without
the original cookies, we must copy the locale cookie onto redirect
responses:

```ts
// Helper at the top of the middleware function:
function redirectWithLocale(url: URL, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(url);
  const localeCookie = request.cookies.get(LOCALE_COOKIE);
  if (localeCookie) {
    response.cookies.set(LOCALE_COOKIE, localeCookie.value, { path: "/" });
  }
  return response;
}
```

Then replace all `NextResponse.redirect(url)` calls with
`redirectWithLocale(url, request)`.

**What NOT to change:**
- The rate-limiting logic (step 1) — untouched
- The `updateSession` call (step 2) — untouched
- The route protection logic (steps 3-4) — same paths, just uses the helper
- The matcher config — untouched

**Depends on:** Step 2

---

### Step 5 — Update root layout for `next-intl`, RTL, and Arabic font

**Files to modify:** `src/app/layout.tsx`
**Files to create:** none
**What to do:**

1. Import `NextIntlClientProvider` from `next-intl` and `getLocale`,
   `getMessages` from `next-intl/server`.

2. Import `IBM_Plex_Sans_Arabic` from `next/font/google`.

3. Import `rtlLocales` from `@/i18n/config`.

4. Declare the Arabic font:
```ts
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});
```

5. Make `RootLayout` an `async` function.

6. Inside `RootLayout`:
```ts
const locale = await getLocale();
const messages = await getMessages();
const isRtl = rtlLocales.includes(locale as Locale);
const dir = isRtl ? "rtl" : "ltr";

// Only include the Arabic font variable class when locale is "ar"
const fontClasses = [
  geistSans.variable,
  geistMono.variable,
  instrumentSerif.variable,
  syne.variable,
  dmSans.variable,
  locale === "ar" ? ibmPlexArabic.variable : "",
].filter(Boolean).join(" ");
```

7. Update the `<html>` tag:
```tsx
<html lang={locale} dir={dir} suppressHydrationWarning>
```

8. Update `<body>`:
```tsx
<body className={`${fontClasses} antialiased ${locale === "ar" ? "font-[family-name:var(--font-ibm-plex-arabic)]" : ""}`}>
```

9. Wrap children with `NextIntlClientProvider`:
```tsx
<ThemeProvider>
  <NextIntlClientProvider locale={locale} messages={messages}>
    <QueryProvider>
      {children}
      <Toaster richColors position={isRtl ? "bottom-left" : "bottom-right"} />
    </QueryProvider>
  </NextIntlClientProvider>
</ThemeProvider>
```

> **Note on conditional font loading:** `next/font/google` statically
> optimizes fonts at build time. The `IBM_Plex_Sans_Arabic` font files will
> be included in the build but only applied (via CSS variable) when `locale`
> is `"ar"`. The font CSS class won't be on `<body>` for `fr`/`en`, so the
> browser will not download the Arabic font files for those locales
> (modern browsers only fetch fonts referenced by active CSS rules).

**Depends on:** Steps 2, 3

---

### Step 6 — Create the language switcher component

**Files to modify:** none
**Files to create:** `src/components/layout/language-switcher.tsx`

**What to do:**

Create a `"use client"` component that:
- Uses `useLocale` from `next-intl` to get the current locale
- Renders a `DropdownMenu` (from `@/components/ui/dropdown-menu`) with a
  trigger `Button` (size `"icon"`, variant `"ghost"`) showing the current
  locale short label (**FR** / **EN** / **عر**)
- On item selection: writes the chosen locale to the `NEXT_LOCALE` cookie
  using `document.cookie = "NEXT_LOCALE=xx; path=/; max-age=31536000"`
  and calls `window.location.reload()` for a full page reload
- Works in both expanded and collapsed sidebar states (the trigger is
  a fixed-size icon button like `ThemeToggle`)
- The trigger icon shows `<Globe className="size-4" />` from `lucide-react`
  when the sidebar is collapsed (tooltip shows the locale label)

```tsx
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

const localeShort: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  ar: "عر",
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
            {localeShort[locale]} — {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Depends on:** Step 2

---

### Step 7 — Add language switcher to both sidebars and login page

**Files to modify:**
- `src/components/layout/sidebar.tsx`
- `src/components/layout/owner-sidebar.tsx`
- `src/app/(auth)/login/page.tsx`

**Files to create:** none

**What to do:**

In both sidebar files, import `LanguageSwitcher` and place it next to
`ThemeToggle` in the `SidebarHeader`:

```tsx
<div className="shrink-0 group-data-[collapsible=icon]:hidden">
  <div className="flex items-center gap-1">
    <LanguageSwitcher />
    <ThemeToggle />
  </div>
</div>
```

For the login page, add `LanguageSwitcher` and `ThemeToggle` to the top-right
corner of the page (absolute positioned) so users can switch language/theme
before logging in. This requires wrapping the login page content in a
relative container and placing the switchers in a fixed position:

```tsx
{/* Top-right controls */}
<div className="absolute right-4 top-4 flex items-center gap-1">
  <LanguageSwitcher />
  <ThemeToggle />
</div>
```

The login page is a Server Component, so the switcher (client) is just
composed as a child — no `"use client"` needed on the page itself.

**Depends on:** Step 6

---

### Step 8 — Create all translation JSON files

**Files to modify:** none
**Files to create:**
- `messages/fr/common.json`
- `messages/fr/auth.json`
- `messages/fr/dashboard.json`
- `messages/fr/owners.json`
- `messages/fr/apartments.json`
- `messages/fr/charges.json`
- `messages/fr/payments.json`
- `messages/fr/meetings.json`
- `messages/fr/settings.json`
- `messages/fr/portal.json`
- `messages/fr/notifications.json`
- `messages/fr/landing.json`
- `messages/fr/validation.json`
- Same 13 files under `messages/en/`
- Same 13 files under `messages/ar/`

**Total: 39 JSON files.**

**What to do:**

Create each file with the exact key structure shown in the "Translation file
structure" section above.

- **`fr/` files** — contain the current French strings (source of truth).
- **`en/` files** — English translations of every key.
- **`ar/` files** — Arabic translations of every key.

The `fr/` files are written first (since they're a direct copy of the current
hardcoded strings). Then `en/` and `ar/` translations are written.

**Depends on:** none (can be done in parallel with Steps 1-7)

---

### Step 9 — Migrate syndic sidebar and owner sidebar strings

**Files to modify:**
- `src/components/layout/sidebar.tsx`
- `src/components/layout/owner-sidebar.tsx`
- `src/components/layout/sidebar-user-menu.tsx`
- `src/components/layout/portal-top-bar.tsx`
- `src/components/layout/top-bar.tsx`
- `src/components/layout/theme-toggle.tsx`

**Files to create:** none

**What to do:**

All these files have `"use client"` — use `useTranslations` hook:

```tsx
import { useTranslations } from "next-intl";
// ...
const t = useTranslations("common");
```

Replace hardcoded strings:

In `sidebar.tsx`:
- `"Vue d'ensemble"` → `t("nav.overview")` (or add nav keys to `common`)
- Actually, the nav items array must become dynamic. Convert from a static
  `const` to a function or hook that returns translated labels:

```tsx
const t = useTranslations("common");
const navItems = [
  { label: t("syndicNav.overview"), href: "/dashboard", icon: LayoutDashboard },
  { label: t("syndicNav.owners"), href: "/dashboard/owners", icon: Users },
  // ...
];
```

Add these keys to `common.json`:
```json
"syndicNav": {
  "overview": "Vue d'ensemble",
  "owners": "Copropriétaires",
  "apartments": "Appartements",
  "charges": "Charges",
  "meetings": "Réunions",
  "payments": "Paiements",
  "settings": "Paramètres"
},
"ownerNav": {
  "mySpace": "Mon espace",
  "payments": "Paiements",
  "notifications": "Notifications"
}
```

In `sidebar-user-menu.tsx`:
- `"Utilisateur"` → `t("fallbackUserName")`
- `"Mon profil"` → `t("userMenu.myProfile")`
- `"Déconnexion"` → `t("userMenu.signOut")`
- `"Administrateur"` (passed as prop) — the prop `roleLabel` is passed from
  the sidebar. Change the sidebar to pass `t("roleLabels.admin")` or
  `t("roleLabels.owner")` instead of hardcoded strings.

In `theme-toggle.tsx`:
- `"Passer en mode clair"` → `t("themeToggle.switchToLight")`
- `"Passer en mode sombre"` → `t("themeToggle.switchToDark")`

In `portal-top-bar.tsx`:
- Same pattern — `useTranslations("common")` for nav labels and sign-out.

In `top-bar.tsx`:
- No visible text strings to translate (only CSS classes).

**Depends on:** Steps 5, 8

---

### Step 10 — Migrate auth pages and components

**Files to modify:**
- `src/app/(auth)/login/page.tsx`
- `src/components/features/auth/login-form.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/components/features/auth/reset-password-form.tsx`
- `src/components/features/auth/update-password-form.tsx`
- `src/components/features/auth/password-input.tsx`
- `src/app/(auth)/login/error.tsx`
- `src/app/(auth)/reset-password/error.tsx`

**Files to create:** none

**What to do:**

**Server Components** (`page.tsx` files): use `getTranslations` from
`next-intl/server`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  // ...
  <h1>{t("login.subtitle")}</h1>
```

**Client Components** (`login-form.tsx`, etc.): use `useTranslations`:

```tsx
import { useTranslations } from "next-intl";

export function LoginForm() {
  const t = useTranslations("auth");
  // ...
  <label>{t("login.emailLabel")}</label>
```

Replace every hardcoded French string with the corresponding `t()` call
using the keys defined in the `auth` namespace.

**Depends on:** Steps 5, 8

---

### Step 11 — Migrate dashboard page and components

**Files to modify:**
- `src/app/(syndic)/dashboard/page.tsx`
- `src/components/features/dashboard/metric-cards-grid.tsx`
- `src/components/features/dashboard/metric-cards.tsx`
- `src/components/features/dashboard/recent-payments.tsx`
- `src/components/features/dashboard/payment-chart.tsx`
- `src/components/features/dashboard/overdue-charges-table.tsx`

**Files to create:** none

**What to do:**

- `page.tsx` — Server Component: `getTranslations("dashboard")`
  - `"Tableau de bord"` → `t("pageTitle")`
  - `"Bienvenue, {name}"` → `t("welcome", { name: syndicFirstName || t("fallbackName") })`
  - `"Charges en retard"` → `t("overdueCharges")`

- `metric-cards-grid.tsx` — Client: `useTranslations("dashboard")`
  - Replace all metric labels and secondary texts

- `recent-payments.tsx` — Client: `useTranslations("dashboard")`
  - `"Paiements récents"` → `t("recentPayments.title")`
  - etc.

- `payment-chart.tsx` — Client: `useTranslations("dashboard")`
- `overdue-charges-table.tsx` — Client: `useTranslations("dashboard")`

**Depends on:** Steps 5, 8

---

### Step 12 — Migrate owners page and components

**Files to modify:**
- `src/app/(syndic)/dashboard/owners/page.tsx`
- `src/components/features/owners/owners-table.tsx`
- `src/components/features/owners/owner-panel.tsx`
- `src/components/features/owners/delete-owner-dialog.tsx`

**Files to create:** none

**What to do:**

- `page.tsx` — Server Component: `getTranslations("owners")`
- Table/panel/dialog — Client: `useTranslations("owners")`
- Replace every hardcoded French string with the corresponding key from
  the `owners` namespace.

**Depends on:** Steps 5, 8

---

### Step 13 — Migrate apartments page and components

**Files to modify:**
- `src/app/(syndic)/dashboard/apartments/page.tsx`
- `src/components/features/apartments/apartments-table.tsx`
- `src/components/features/apartments/apartment-panel.tsx`
- `src/components/features/apartments/delete-apartment-dialog.tsx`

**Files to create:** none
**What to do:** Same pattern as Step 12, using `apartments` namespace.
**Depends on:** Steps 5, 8

---

### Step 14 — Migrate charges page and components

**Files to modify:**
- `src/app/(syndic)/dashboard/charges/page.tsx`
- `src/components/features/charges/charges-table.tsx`
- `src/components/features/charges/charge-panel.tsx`
- `src/components/features/charges/delete-charge-dialog.tsx`

**Files to create:** none
**What to do:** Same pattern, using `charges` namespace.
**Depends on:** Steps 5, 8

---

### Step 15 — Migrate payments page and components

**Files to modify:**
- `src/app/(syndic)/dashboard/payments/page.tsx`
- `src/components/features/payments/payments-table.tsx`
- `src/components/features/payments/owner-payments-view.tsx`
- `src/components/features/payments/owner-payment-form.tsx`

**Files to create:** none
**What to do:** Same pattern, using `payments` namespace.
**Depends on:** Steps 5, 8

---

### Step 16 — Migrate meetings page and components

**Files to modify:**
- `src/app/(syndic)/dashboard/meetings/page.tsx`
- `src/app/(syndic)/dashboard/meetings/[id]/page.tsx`
- `src/components/features/meetings/meetings-table.tsx`
- `src/components/features/meetings/meeting-panel.tsx`
- `src/components/features/meetings/meeting-detail.tsx`
- `src/components/features/meetings/delete-meeting-dialog.tsx`

**Files to create:** none
**What to do:** Same pattern, using `meetings` namespace.
**Depends on:** Steps 5, 8

---

### Step 17 — Migrate settings page and component

**Files to modify:**
- `src/app/(syndic)/dashboard/settings/page.tsx`
- `src/components/features/settings/settings-form.tsx`

**Files to create:** none
**What to do:** Same pattern, using `settings` namespace.
**Depends on:** Steps 5, 8

---

### Step 18 — Migrate owner portal pages and components

**Files to modify:**
- `src/app/(owner)/portal/page.tsx`
- `src/app/(owner)/payments/page.tsx`
- `src/app/(owner)/notifications/page.tsx`
- `src/components/features/portal/profile-view.tsx`
- `src/components/features/notifications/notifications-list.tsx`

**Files to create:** none
**What to do:** Same pattern, using `portal` and `notifications` namespaces.
**Depends on:** Steps 5, 8

---

### Step 19 — Migrate shared components

**Files to modify:**
- `src/components/features/shared/StatusBadge.tsx`

**Files to create:** none
**What to do:**

`StatusBadge` is a client component. Use `useTranslations("common")`:
- `"Payé"` → `t("status.paid")`
- `"Impayé"` → `t("status.unpaid")`
- etc.

**Depends on:** Steps 5, 8

---

### Step 20 — Migrate landing page

**Files to modify:**
- `src/app/page.tsx`

**Files to create:** none

**What to do:**

The landing page is currently a Server Component. Use
`getTranslations("landing")` to translate all hero, features, stats,
CTA, and footer strings.

**Depends on:** Steps 5, 8

---

### Step 21 — Migrate error and not-found pages

**Files to modify:**
- `src/app/not-found.tsx`
- `src/app/error.tsx`

**Files to create:** none

**What to do:**

- `not-found.tsx` — Server Component: `getTranslations("notFound")`
- `error.tsx` — This is a Client Component (`"use client"`). Use
  `useTranslations("auth")` referencing `auth.errorPage.*` keys.

**Depends on:** Steps 5, 8

---

### Step 22 — Migrate Zod validation schemas

**Files to modify:**
- `src/lib/validations/auth.ts`
- `src/lib/validations/apartment.ts`
- `src/lib/validations/charge.ts`
- `src/lib/validations/meeting.ts`
- `src/lib/validations/owner.ts`
- `src/lib/validations/payment.ts`
- `src/lib/validations/profile.ts`
- `src/lib/validations/settings.ts`

**Files to create:** none

**What to do:**

Zod schemas are shared between client (React Hook Form) and server (Server
Actions). They cannot use React hooks. Two approaches exist:

**Approach A — Schema factory with `t` parameter (recommended):**

Convert each schema from a static `const` to a function that accepts a
translation function:

```ts
// src/lib/validations/apartment.ts
import { z } from "zod";

export function createApartmentSchema(t: (key: string) => string) {
  return z.object({
    unitNumber: z.string().min(1, t("apartment.unitNumberRequired")),
    floor: z.coerce.number().int(t("apartment.floorInteger")),
    surfaceArea: z.coerce.number().positive(t("apartment.surfacePositive")),
    roomCount: z.coerce.number().int(t("apartment.roomCountInteger")).min(1, t("apartment.roomCountMin")),
  });
}

// For backward compatibility + Server Actions:
export type ApartmentInput = z.infer<ReturnType<typeof createApartmentSchema>>;
```

In **client components** (React Hook Form):
```tsx
const t = useTranslations("validation");
const schema = createApartmentSchema(t);
```

In **Server Actions**: Server Actions run on the server where `next-intl`
context is available. Use `getTranslations("validation")` at the top of the
action:
```ts
const t = await getTranslations("validation");
const schema = createApartmentSchema(t);
const parsed = schema.safeParse(data);
```

> This preserves the rule "one Zod schema per domain, shared client and
> server" because the same function is used in both contexts — only the `t`
> source differs.

**Approach B — Keep static Zod schemas, use error map:**

Use Zod's `setErrorMap` with `next-intl`. This is more complex and
less explicit. **Approach A is recommended.**

⚠️ **Note:** The task constraints say "Do NOT modify any Server Action
files." This applies to Phase 8 **planning** — during implementation,
the Server Actions will need the `getTranslations` call added. The plan
must call this out explicitly so the implementer knows.

**Depends on:** Steps 5, 8

---

### Step 23 — RTL support: run shadcn RTL migration

**Files to modify:** Files in `src/components/ui/` (automated by migration tool)
**Files to create:** none

**What to do:**

1. Run the shadcn RTL migration tool:
```bash
npx shadcn@latest migrate rtl
```

This automatically converts directional CSS classes in all shadcn UI
components under `src/components/ui/`:
- `ml-*` → `ms-*` (margin-inline-start)
- `mr-*` → `me-*` (margin-inline-end)
- `pl-*` → `ps-*` (padding-inline-start)
- `pr-*` → `pe-*` (padding-inline-end)
- `left-*` → `start-*`
- `right-*` → `end-*`
- `text-left` → `text-start`
- `text-right` → `text-end`
- `rounded-l-*` → `rounded-s-*`
- `rounded-r-*` → `rounded-e-*`
- `border-l-*` → `border-s-*`
- `border-r-*` → `border-e-*`

2. After the automated migration, manually review and fix these components
which the shadcn docs call out as needing manual RTL attention:

- **`src/components/ui/sidebar.tsx`** — The sidebar renders on the left by
  default. When `dir="rtl"` is set on `<html>`, CSS logical properties
  (`inset-inline-start`, `margin-inline-start`, etc.) automatically flip
  the sidebar to the right. After the `npx shadcn migrate rtl` step, verify
  that the sidebar's positioning and animation classes use logical
  properties. If the sidebar uses `left-0`/`right-0` for positioning, they
  must become `inset-inline-start: 0` / `start-0`. The `SidebarRail`
  resize handle must also flip.

- **Calendar** — Not currently used in the project (date inputs use
  `react-day-picker` directly). If a shadcn Calendar component is added
  later, it will need manual RTL handling.

3. Apply the same directional-to-logical class replacements in custom
(non-shadcn) components. These files use directional classes:

| File | Classes to convert |
|------|--------------------|
| `src/components/layout/sidebar.tsx` | Any `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right` |
| `src/components/layout/owner-sidebar.tsx` | Same |
| `src/components/layout/sidebar-user-menu.tsx` | `text-left` → `text-start`, `gap-3` is fine (symmetric) |
| `src/components/layout/portal-top-bar.tsx` | Directional classes |
| `src/components/layout/top-bar.tsx` | `-ml-1` → `-ms-1`, `mr-2` → `me-2` |
| `src/components/features/notifications/notifications-list.tsx` | `ml-auto` → `ms-auto` |
| Feature components with `ml-auto` | → `ms-auto` |

4. The `Toaster` position was already handled in Step 5 (root layout):
`position={isRtl ? "bottom-left" : "bottom-right"}`.

**Depends on:** Step 5

---

### Step 24 — RTL support: custom component directional fixes

**Files to modify:** Every file in `src/components/features/` and
`src/components/layout/` that uses physical directional CSS classes.

**Files to create:** none

**What to do:**

Systematically search all `.tsx` files for these Tailwind class patterns
and convert to logical equivalents:

```
ml-  → ms-
mr-  → me-
pl-  → ps-
pr-  → pe-
-ml- → -ms-
-mr- → -me-
left- → start-
right- → end-
text-left → text-start
text-right → text-end
rounded-l- → rounded-s-
rounded-r- → rounded-e-
border-l- → border-s-
border-r- → border-e-
```

Use a project-wide search-and-replace with manual review for each match.
Some classes like `left-0` in absolute positioning need careful handling.

**Also convert in `src/app/globals.css`** if any directional properties
exist in custom CSS.

**Depends on:** Step 23

---

### Step 25 — Verify middleware integration end-to-end

**Files to modify:** none
**Files to create:** none

**What to do:**

Manual verification checklist:
1. Start dev server with `pnpm dev`
2. Visit `/login` — verify French text appears (default locale)
3. Switch language to English via the switcher — verify page reloads with
   English text and `NEXT_LOCALE=en` cookie is set
4. Switch to Arabic — verify page reloads with RTL layout, Arabic text,
   Arabic font, and `dir="rtl"` on `<html>`
5. Log in as syndic — verify redirect to `/dashboard` works unchanged
6. Verify sidebar is on the RIGHT in Arabic mode
7. Log in as owner — verify redirect to `/portal` works
8. Log out — verify redirect to `/login` works
9. Verify rate limiting still blocks after 5 failed login attempts
10. Switch back to French — verify everything returns to LTR

**Depends on:** All previous steps

---

## Component-by-file migration reference

Complete list of every file that contains hardcoded French strings and must
be modified during string migration (Steps 9-22):

### Layout components
1. `src/components/layout/sidebar.tsx`
2. `src/components/layout/owner-sidebar.tsx`
3. `src/components/layout/sidebar-user-menu.tsx`
4. `src/components/layout/portal-top-bar.tsx`
5. `src/components/layout/theme-toggle.tsx`

### Auth
6. `src/app/(auth)/login/page.tsx`
7. `src/app/(auth)/login/error.tsx`
8. `src/app/(auth)/reset-password/page.tsx`
9. `src/app/(auth)/reset-password/error.tsx`
10. `src/components/features/auth/login-form.tsx`
11. `src/components/features/auth/reset-password-form.tsx`
12. `src/components/features/auth/update-password-form.tsx`
13. `src/components/features/auth/password-input.tsx`

### Dashboard
14. `src/app/(syndic)/dashboard/page.tsx`
15. `src/components/features/dashboard/metric-cards-grid.tsx`
16. `src/components/features/dashboard/metric-cards.tsx`
17. `src/components/features/dashboard/recent-payments.tsx`
18. `src/components/features/dashboard/payment-chart.tsx`
19. `src/components/features/dashboard/overdue-charges-table.tsx`

### Owners
20. `src/app/(syndic)/dashboard/owners/page.tsx`
21. `src/components/features/owners/owners-table.tsx`
22. `src/components/features/owners/owner-panel.tsx`
23. `src/components/features/owners/delete-owner-dialog.tsx`

### Apartments
24. `src/app/(syndic)/dashboard/apartments/page.tsx`
25. `src/components/features/apartments/apartments-table.tsx`
26. `src/components/features/apartments/apartment-panel.tsx`
27. `src/components/features/apartments/delete-apartment-dialog.tsx`

### Charges
28. `src/app/(syndic)/dashboard/charges/page.tsx`
29. `src/components/features/charges/charges-table.tsx`
30. `src/components/features/charges/charge-panel.tsx`
31. `src/components/features/charges/delete-charge-dialog.tsx`

### Payments
32. `src/app/(syndic)/dashboard/payments/page.tsx`
33. `src/components/features/payments/payments-table.tsx`
34. `src/components/features/payments/owner-payments-view.tsx`
35. `src/components/features/payments/owner-payment-form.tsx`

### Meetings
36. `src/app/(syndic)/dashboard/meetings/page.tsx`
37. `src/components/features/meetings/meetings-table.tsx`
38. `src/components/features/meetings/meeting-panel.tsx`
39. `src/components/features/meetings/meeting-detail.tsx`
40. `src/components/features/meetings/delete-meeting-dialog.tsx`

### Settings
41. `src/app/(syndic)/dashboard/settings/page.tsx`
42. `src/components/features/settings/settings-form.tsx`

### Owner portal
43. `src/app/(owner)/portal/page.tsx`
44. `src/app/(owner)/payments/page.tsx`
45. `src/app/(owner)/notifications/page.tsx`
46. `src/components/features/portal/profile-view.tsx`
47. `src/components/features/notifications/notifications-list.tsx`

### Shared
48. `src/components/features/shared/StatusBadge.tsx`

### Landing & global
49. `src/app/page.tsx`
50. `src/app/not-found.tsx`
51. `src/app/error.tsx`
52. `src/app/layout.tsx`

### Validation schemas
53. `src/lib/validations/auth.ts`
54. `src/lib/validations/apartment.ts`
55. `src/lib/validations/charge.ts`
56. `src/lib/validations/meeting.ts`
57. `src/lib/validations/owner.ts`
58. `src/lib/validations/payment.ts`
59. `src/lib/validations/profile.ts`
60. `src/lib/validations/settings.ts`

### Infrastructure (non-string changes)
61. `middleware.ts`
62. `next.config.ts`

**Total: 62 files to modify + 42 new files to create (39 JSON + 2 config + 1 component).**

---

## Verification checklist

- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] `pnpm build` succeeds (all 26 routes compile)
- [ ] Default locale (French) — all text displays correctly, LTR layout
- [ ] English locale — all text displays in English, LTR layout
- [ ] Arabic locale — all text displays in Arabic, RTL layout, IBM Plex Arabic font active
- [ ] Sidebar renders on RIGHT side in Arabic mode
- [ ] `<html lang="ar" dir="rtl">` when Arabic is active
- [ ] `<html lang="fr" dir="ltr">` when French is active
- [ ] `<html lang="en" dir="ltr">` when English is active
- [ ] IBM Plex Arabic font CSS variable NOT present on `<body>` for `fr`/`en`
- [ ] Language switcher visible and functional in syndic sidebar
- [ ] Language switcher visible and functional in owner sidebar
- [ ] Language switcher visible and functional on login page
- [ ] Cookie `NEXT_LOCALE` is set after switching and persists across navigation
- [ ] Auth redirects (`/dashboard`, `/portal`, `/login`) work in all locales
- [ ] Rate limiting on `/login` POST still works
- [ ] Supabase session refresh still works (check `updateSession`)
- [ ] Toast notifications appear translated
- [ ] Zod validation errors appear translated in both form errors and server responses
- [ ] No hardcoded French strings remain in any component (grep for common patterns)
- [ ] `sonner` Toaster position flips to `bottom-left` in RTL mode
- [ ] Date formatting uses locale-aware formatting (via `date-fns` locale parameter)
- [ ] shadcn UI components render correctly in RTL (dropdown alignment, etc.)
