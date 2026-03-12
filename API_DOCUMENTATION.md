# 237 Urgences — Documentation API

## Vue d'ensemble

L'application **237 Urgences** envoie les signalements d'incidents au service tiers via une requête **HTTP POST multipart/form-data**. Le service tiers reçoit les données structurées (JSON) ainsi que les fichiers médias (selfie obligatoire, audio optionnel) et se charge d'alerter les autorités compétentes.

---

## Endpoint

```
POST /api/v1/incidents
Content-Type: multipart/form-data
```

---

## Authentification

Le service tiers doit définir le mécanisme d'authentification. Suggestions :
- **API Key** via header : `Authorization: Bearer <API_KEY>`
- **HMAC signature** sur le payload

---

## Corps de la requête (multipart/form-data)

La requête contient **3 champs** :

| Champ      | Type                 | Requis | Description                              |
|------------|----------------------|--------|------------------------------------------|
| `payload`  | `application/json`   | Oui    | Données JSON du signalement              |
| `selfie`   | `image/jpeg`         | Oui    | Photo selfie du déclarant                |
| `audio`    | `audio/mp4` (m4a)    | Non    | Message vocal enregistré par le déclarant|

---

## Structure du payload JSON

```json
{
  "id": "INC-M5KA9B2F",
  "timestamp": "2026-03-11T15:30:00.000Z",
  "type": "incendie",
  "typeLabel": "Incendie",
  "description": "Un incendie s'est déclaré dans un immeuble au quartier Bastos...",
  "audio": {
    "uri": "file:///data/.../INC-M5KA9B2F_audio.m4a",
    "durationSeconds": 15
  },
  "declarant": {
    "userId": "+237693484484",
    "nom": "MBARGA",
    "prenom": "Jean",
    "phone": "+237693484484",
    "selfieUri": "file:///data/.../INC-M5KA9B2F_selfie.jpg"
  },
  "contactUrgence": {
    "nom": "Marie Mbarga",
    "phone": "699112233",
    "countryCode": "CM",
    "countryDial": "+237"
  },
  "location": {
    "mode": "gps",
    "latitude": 3.8480,
    "longitude": 11.5021,
    "address": "Rue 1.234, Bastos, Yaoundé",
    "city": "Yaoundé",
    "region": "Centre",
    "villeManuelle": null,
    "quartierManuel": null
  },
  "status": "pending",
  "platform": "android"
}
```

---

## Détail des champs

### Racine

| Champ         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| `id`          | string   | Identifiant unique du signalement (format `INC-XXXXXXXX`) |
| `timestamp`   | string   | Date/heure de création au format ISO 8601 (UTC)  |
| `type`        | string   | Code du type d'incident (voir types ci-dessous)  |
| `typeLabel`   | string   | Libellé lisible du type (en français)             |
| `description` | string   | Description libre de l'incident                   |
| `status`      | string   | Toujours `"pending"` à la création                |
| `platform`    | string   | Plateforme d'envoi : `"android"`, `"ios"`, `"web"` |

### Types d'incidents (`type`)

| Code          | Libellé FR            | Libellé EN           |
|---------------|-----------------------|----------------------|
| `incendie`    | Incendie              | Fire                 |
| `agression`   | Agression             | Assault              |
| `accident`    | Accident de route     | Road Accident        |
| `vol`         | Urgence médicale      | Medical Emergency    |
| `vandalisme`  | Catastrophe naturelle | Natural Disaster     |
| `arnaque`     | Arnaque / Scam        | Scam / Fraud         |
| `disparition` | Disparition           | Disappearance        |
| `autre`       | Autre urgence         | Other Emergency      |

### Audio

| Champ             | Type         | Description                                    |
|-------------------|--------------|------------------------------------------------|
| `audio.uri`       | string/null  | URI locale du fichier audio (`null` si pas d'audio) |
| `audio.durationSeconds` | number | Durée en secondes (0 si pas d'audio)           |

> **Note** : Le fichier audio réel est envoyé dans le champ multipart `audio`. Le champ `uri` dans le JSON est la référence locale (informative).

### Déclarant (`declarant`)

| Champ               | Type   | Description                                     |
|---------------------|--------|-------------------------------------------------|
| `declarant.userId`  | string | Numéro de téléphone de l'utilisateur (identifiant unique) |
| `declarant.nom`     | string | Nom de famille                                   |
| `declarant.prenom`  | string | Prénom                                           |
| `declarant.phone`   | string | Numéro de téléphone vérifié (format `+237XXXXXXXXX`) |
| `declarant.selfieUri` | string | URI locale du selfie (informative)             |

> **Note** : Le selfie réel est envoyé dans le champ multipart `selfie`. Le numéro de téléphone est vérifié par OTP Firebase.

### Contact d'urgence (`contactUrgence`)

| Champ                         | Type   | Description                              |
|-------------------------------|--------|------------------------------------------|
| `contactUrgence.nom`          | string | Nom de la personne à contacter           |
| `contactUrgence.phone`        | string | Numéro de téléphone (sans indicatif)     |
| `contactUrgence.countryCode`  | string | Code pays ISO 3166-1 alpha-2 (ex: `CM`) |
| `contactUrgence.countryDial`  | string | Indicatif téléphonique (ex: `+237`)      |

**Pays supportés** :

| Code | Indicatif | Pays                 |
|------|-----------|----------------------|
| CM   | +237      | Cameroun             |
| CI   | +225      | Côte d'Ivoire        |
| SN   | +221      | Sénégal              |
| GA   | +241      | Gabon                |
| CG   | +242      | Congo                |
| CD   | +243      | RD Congo             |
| TD   | +235      | Tchad                |
| CF   | +236      | Centrafrique         |
| GQ   | +240      | Guinée Équatoriale   |
| NG   | +234      | Nigeria              |
| GH   | +233      | Ghana                |
| BJ   | +229      | Bénin                |
| TG   | +228      | Togo                 |
| FR   | +33       | France               |
| BE   | +32       | Belgique             |
| CH   | +41       | Suisse               |
| CA   | +1        | Canada               |
| US   | +1        | États-Unis           |

### Localisation (`location`)

| Champ                     | Type         | Description                                       |
|---------------------------|--------------|---------------------------------------------------|
| `location.mode`           | string       | `"gps"` (automatique) ou `"manual"` (saisie manuelle) |
| `location.latitude`       | number/null  | Latitude GPS (`null` si mode manual)               |
| `location.longitude`      | number/null  | Longitude GPS (`null` si mode manual)              |
| `location.address`        | string/null  | Adresse complète (reverse geocoding)               |
| `location.city`           | string/null  | Ville détectée par GPS                             |
| `location.region`         | string/null  | Région détectée par GPS                            |
| `location.villeManuelle`  | string/null  | Ville saisie manuellement (`null` si mode gps)     |
| `location.quartierManuel` | string/null  | Quartier saisi manuellement (`null` si mode gps)   |

---

## Fichiers joints

### Selfie (obligatoire)

- **Champ multipart** : `selfie`
- **Format** : JPEG (`image/jpeg`)
- **Nom du fichier** : `{incident_id}_selfie.jpg` (ex: `INC-M5KA9B2F_selfie.jpg`)
- **Source** : Caméra frontale uniquement (garantit l'identité du déclarant)
- **Taille max estimée** : ~5 Mo

### Audio (optionnel)

- **Champ multipart** : `audio`
- **Format** : M4A (`audio/mp4`)
- **Nom du fichier** : `{incident_id}_audio.m4a` (ex: `INC-M5KA9B2F_audio.m4a`)
- **Source** : Enregistrement microphone via l'application
- **Taille max estimée** : ~2 Mo (enregistrements courts)

---

## Exemple de requête cURL

```bash
curl -X POST https://api.service-tiers.com/api/v1/incidents \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F 'payload={
    "id": "INC-M5KA9B2F",
    "timestamp": "2026-03-11T15:30:00.000Z",
    "type": "incendie",
    "typeLabel": "Incendie",
    "description": "Incendie dans un immeuble au quartier Bastos",
    "audio": { "uri": null, "durationSeconds": 0 },
    "declarant": {
      "userId": "+237693484484",
      "nom": "MBARGA",
      "prenom": "Jean",
      "phone": "+237693484484",
      "selfieUri": "file:///selfie.jpg"
    },
    "contactUrgence": {
      "nom": "Marie Mbarga",
      "phone": "699112233",
      "countryCode": "CM",
      "countryDial": "+237"
    },
    "location": {
      "mode": "gps",
      "latitude": 3.8480,
      "longitude": 11.5021,
      "address": "Bastos, Yaoundé",
      "city": "Yaoundé",
      "region": "Centre",
      "villeManuelle": null,
      "quartierManuel": null
    },
    "status": "pending",
    "platform": "android"
  };type=application/json' \
  -F 'selfie=@/path/to/selfie.jpg;type=image/jpeg' \
  -F 'audio=@/path/to/audio.m4a;type=audio/mp4'
```

---

## Réponse attendue du service tiers

### Succès (201 Created)

```json
{
  "success": true,
  "incidentId": "INC-M5KA9B2F",
  "message": "Signalement reçu et transmis aux autorités compétentes",
  "referenceNumber": "REF-2026-00142"
}
```

### Erreur (4xx / 5xx)

```json
{
  "success": false,
  "error": "INVALID_PAYLOAD",
  "message": "Le champ 'description' est requis"
}
```

**Codes d'erreur possibles** :

| Code HTTP | Error Code          | Description                          |
|-----------|---------------------|--------------------------------------|
| 400       | `INVALID_PAYLOAD`   | Payload JSON invalide ou incomplet   |
| 400       | `MISSING_SELFIE`    | Selfie obligatoire non fourni        |
| 401       | `UNAUTHORIZED`      | Clé API invalide                     |
| 413       | `FILE_TOO_LARGE`    | Fichier trop volumineux (>10 Mo)     |
| 429       | `RATE_LIMIT`        | Trop de requêtes (anti-spam)         |
| 500       | `INTERNAL_ERROR`    | Erreur serveur interne               |

---

## Flux de données

```
┌──────────────┐     multipart/form-data      ┌───────────────────┐
│              │  ─────────────────────────►   │                   │
│  237 Urgences│  payload (JSON)               │  Service Tiers    │
│  (Mobile App)│  + selfie (JPEG)              │  (API Backend)    │
│              │  + audio (M4A, optionnel)      │                   │
└──────────────┘                               └─────────┬─────────┘
                                                         │
                                                         ▼
                                               ┌───────────────────┐
                                               │  Dispatch vers    │
                                               │  autorités selon  │
                                               │  type d'incident  │
                                               │  et localisation  │
                                               └───────────────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    ▼                    ▼                    ▼
                              ┌──────────┐        ┌──────────┐        ┌──────────┐
                              │  Police  │        │ Pompiers │        │   SAMU   │
                              │   117    │        │   118    │        │   119    │
                              └──────────┘        └──────────┘        └──────────┘
```

---

## Notes d'intégration

1. **Authentification utilisateur** : Le numéro de téléphone du déclarant est vérifié par Firebase Phone Auth (OTP SMS). Le service tiers peut considérer ce numéro comme fiable.

2. **Selfie obligatoire** : Pris uniquement avec la caméra frontale pour garantir l'identité du déclarant et dissuader les faux signalements.

3. **Idempotence** : Chaque signalement a un `id` unique (`INC-XXXXXXXX`). Le service tiers doit gérer les doublons (rejeter un `id` déjà traité).

4. **Localisation** : En mode `gps`, les coordonnées sont précises. En mode `manual`, seuls `villeManuelle` et `quartierManuel` sont renseignés — le service tiers devra les géocoder si nécessaire.

5. **Stockage** : L'application ne stocke PAS les incidents dans Firebase. Le service tiers est le seul récepteur et responsable du stockage et du dispatch.

6. **Hors ligne** : Actuellement, l'app ne gère pas le mode hors ligne. L'envoi nécessite une connexion internet active.

---

## Stack technique de l'application

| Composant           | Technologie                        |
|---------------------|------------------------------------|
| Framework           | React Native (Expo SDK 55)         |
| Authentification    | Firebase Auth (Phone OTP)          |
| Base de données     | Cloud Firestore (profils users)    |
| Envoi d'incidents   | HTTP multipart/form-data           |
| Plateforme cible    | Android, iOS, Web                  |
| Langage             | TypeScript                         |

---

*237 Urgences — Application d'urgence pour le Cameroun*
*Version 1.0.0*
