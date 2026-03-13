# 🌐 Guide Développeur Web (Frontend) — AgroConnect BF

Ce guide explique comment intégrer le backend AgroConnect BF dans une application Web (React, Vue, Angular, etc.).

## 📍 URLs de l'API

| Environnement | Base URL |
| :--- | :--- |
| **Développement Local** | `http://localhost:3000/api` |
| **Production (Railway)** | `https://agroconnect-backend.up.railway.app/api` |
| **Documentation (Swagger)**| `http://localhost:3000/api/docs` |

---

## 🔐 Authentification (JWT)

Le backend utilise des **JSON Web Tokens (JWT)**. Le token doit être envoyé dans le header de chaque requête protégée.

**Format :** `Authorization: Bearer <votre_token>`

### Gestion recommandée
1. Stockez le token dans le `localStorage` ou dans un `Secure Cookie`.
2. Redirigez vers `/login` si une requête retourne une erreur `401`.

---

## 🛠 Exemple d'Intégration (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Intercepteur pour ajouter le Token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exemple : Récupérer le catalogue
export const getCatalog = async () => {
  const response = await api.get('/products');
  return response.data;
};
```

---

## 🚦 Routes Importantes

### 1. Authentification
- `POST /auth/register` : Inscription
- `POST /auth/login` : Connexion (retourne le token)
- `POST /auth/verify-otp` : Vérification de l'email

### 2. Profil
- `GET /auth/me` : Infos de l'utilisateur connecté
- `PATCH /auth/capabilities` : Changer de rôle (Vendeur/Acheteur)

### 3. Ventes (Farmer)
- `POST /products` : Créer un produit
- `GET /products/mine` : Mes produits en ligne

---

## ⚠️ Notes Techniques
- **CORS** : Le backend autorise `http://localhost:5173` et `http://localhost:3001` par défaut.
- **Images** : Pour l'instant, envoyez les URLs d'images ou utilisez le `multipart/form-data` pour l'upload (configuré via Multer).
