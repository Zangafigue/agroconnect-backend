# 🌾 AgroConnect BF — Backend API

**AgroConnect BF** est une plateforme digitale B2B/B2C connectant **agriculteurs**, **acheteurs** et **transporteurs** au Burkina Faso.

## Stack Technique

- **Runtime** : Node.js ≥ 18
- **Framework** : Express.js
- **Base de données** : MongoDB Atlas
- **Auth** : JWT + OTP Email (Resend.com)
- **Docs** : Swagger UI

## 📖 Guides d'Intégration

Pour faciliter le travail des équipes frontend, des guides spécifiques sont disponibles :

- [**🌐 Guide Développeur Web**](./GUIDE_DEV_WEB.md) : URLs local/prod, Axios, gestion JWT.
- [**📱 Guide Développeur Mobile**](./GUIDE_DEV_MOBILE.md) : IPs émulateurs, Dio (Flutter), suivi GPS.

---

## Installation

```bash
npm install
cp .env.example .env
# Remplir les variables dans .env
```

## Scripts

| Commande       | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Démarrer en mode dev (nodemon)       |
| `npm start`    | Démarrer en mode production          |
| `npm run seed:admin` | Créer le compte administrateur|

## Endpoints

| URL                                          | Description          |
|----------------------------------------------|----------------------|
| `http://localhost:3000/api/health`           | Health check         |
| `http://localhost:3000/api/docs`             | Documentation Swagger|

## Variables d'environnement

Copier `.env.example` en `.env` et remplir :

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@agroconnect.bf
ADMIN_EMAIL=admin@agroconnect.bf
ADMIN_PASSWORD=...
COMMISSION_RATE=0.03
```

## Structure

```
src/
├── config/       # DB + Swagger
├── middleware/   # Auth JWT + RBAC
├── models/       # Schémas Mongoose
├── routes/       # Express Router
├── controllers/  # Logique métier
├── services/     # Email + Paiements
├── utils/        # Fonctions utilitaires
└── seed/         # Données initiales
```

## Membres

| Membre | Rôle | Modules |
|--------|------|---------|
| **Membre 1** | Lead Dev | Setup, Deliveries, Payments, Admin |
| **Membre 2** | Backend Dev | Auth, Products, Orders, Messaging, Disputes |
| **Membre 5** | DevOps | MongoDB Atlas, Swagger, Postman, README |
