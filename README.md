# PIMP — Product Information Management Platform

Plateforme d'ingestion de fiches produit. Un fournisseur **dépose une étiquette**
(image JPG/PNG), un **OCR local** lit l'étiquette et un **parseur maison** renvoie des
**données structurées** que le fournisseur **valide** avant enregistrement en base.

User story : _« En tant que fournisseur, je dépose une étiquette et la base produit
se remplit automatiquement (id_produit, étiquette, nom, fabricant, …). »_

## Stack

- **Frontend** : React + Vite
- **Backend** : Node.js + Express
- **Base** : SQL Server (via Docker) — repli automatique en mémoire si la base est absente
- **Extraction** : OCR local **Tesseract.js** (gratuit, aucune clé, aucun appel externe) + parseur maison

## Fonctionnalités

- Drag-and-drop d'une étiquette (JPG / PNG)
- Extraction automatique en local : EAN, contenance, composition (minéraux), catégorie, marque…
- **Revue humaine** : on corrige les champs avant d'enregistrer (un bon PIM ne fait jamais d'insert aveugle)
- **Upsert sur l'EAN** (`MERGE` SQL Server) : pas de doublon, mise à jour si le produit existe
- Catalogue avec recherche et filtre par catégorie
- Fiche détaillée + suppression
- Tableau de bord (total, répartition par catégorie)
- Requêtes **paramétrées** partout (anti-injection SQL)

---

## Démarrage rapide (3 étapes)

### 1. Le serveur (API)

```bash
cd server
npm install
cp .env.example .env        # rien à configurer pour démarrer
npm run dev
```

> Par défaut `DB_DRIVER=memory` : l'appli démarre **sans base** (données en RAM).
> Idéal pour tester tout de suite. Passe à SQL Server quand tu veux (voir plus bas).
>
> L'extraction utilise un **OCR local (Tesseract.js)** : aucune clé, aucun coût.
> Au tout premier dépôt d'étiquette, Tesseract télécharge ses données de langue
> françaises (quelques Mo, une seule fois) — une connexion internet est donc
> nécessaire ce premier coup-là. Formats : **images JPG / PNG** (pour un PDF, le convertir en image).

L'API tourne sur http://localhost:4000

### 2. Le client (interface)

Dans un **second terminal** :

```bash
cd client
npm install
npm run dev
```

L'interface tourne sur http://localhost:5173 (le proxy renvoie `/api` vers le port 4000).

### 3. Tester

Ouvre http://localhost:5173, onglet **Ingestion**, glisse une étiquette → la fiche se remplit.

---

## Passer en SQL Server (persistant)

1. Lance la base :

```bash
docker compose up -d
```

2. Dans `server/.env`, mets :

```
DB_DRIVER=sqlserver
```

3. Relance le serveur (`npm run dev`). Au démarrage il crée la base `PIMP`
   et les tables `produit` + `composition` automatiquement.

> Si SQL Server est injoignable, le serveur bascule tout seul en mode mémoire
> et te le signale dans la console.

---

## Schéma de la base

```
produit (1) ───< (N) composition

produit
  id_produit   INT IDENTITY PK   ← généré par la BDD
  ean          VARCHAR UNIQUE    ← clé naturelle (anti-doublon)
  nom_produit  NVARCHAR NOT NULL
  marque, fabricant, categorie, contenance, pays_origine, description, etiquette
  statut, date_import

composition
  id_composition INT IDENTITY PK
  id_produit     INT FK → produit  (ON DELETE CASCADE)
  libelle, valeur
```

## API (REST)

| Méthode | Route                      | Rôle                                   |
|---------|----------------------------|----------------------------------------|
| POST    | `/api/produits/extract`    | OCR + parsing de l'étiquette, renvoie le JSON (sans sauvegarder) |
| POST    | `/api/produits`            | Enregistre / met à jour (upsert EAN)   |
| GET     | `/api/produits`            | Liste (`?search=`, `?categorie=`)      |
| GET     | `/api/produits/:id`        | Détail + composition                   |
| DELETE  | `/api/produits/:id`        | Supprime                               |
| GET     | `/api/stats`               | Statistiques du tableau de bord        |
| GET     | `/api/health`              | État + driver de base actif            |

## Arborescence

```
pimp-platform/
├─ docker-compose.yml         SQL Server
├─ server/                    API Express
│  ├─ src/
│  │  ├─ index.js             point d'entrée
│  │  ├─ db/                  mémoire + SQL Server (interface commune)
│  │  ├─ routes/produits.js
│  │  ├─ services/extraction.js   OCR (Tesseract) + parseur
│  │  └─ schema.sql
│  └─ .env.example
└─ client/                    React + Vite
   └─ src/
      ├─ App.jsx
      ├─ api.js
      └─ components/          Ingest, Catalog, ProductDetail, Dashboard
```

## Idées d'évolutions

- Authentification (rôles fournisseur / validateur) + JWT
- Stockage de l'image d'étiquette (chemin ou blob) et aperçu dans la fiche
- Export CSV / Excel du catalogue
- File d'attente de validation (statut « brouillon » → « validé »)
- Historique des modifications (audit)
