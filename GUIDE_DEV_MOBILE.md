# 📱 Guide Développeur Mobile (Flutter/Native) — AgroConnect BF

Ce guide explique comment connecter votre application mobile au backend AgroConnect BF.

## 📍 URLs de l'API

⚠️ Sur mobile, `localhost` ne fonctionne pas pour atteindre votre PC de développement.

| Contexte | URL de l'API |
| :--- | :--- |
| **Émulateur Android** | `http://10.0.2.2:3000/api` |
| **Simulateur iOS** | `http://localhost:3000/api` |
| **Appareil Physique (Wifi)** | `http://<IP_DE_VOTRE_PC>:3000/api` |
| **Production** | `https://agroconnect-backend.up.railway.app/api` |

---

## 🔐 Authentification (JWT)

Le token JWT doit être sauvegardé de manière sécurisée (ex: `flutter_secure_storage`).

**Header requis :** `Authorization: Bearer <token>`

---

## 🛠 Exemple d'Intégration (Flutter avec Dio)

```dart
import 'package:dio/dio.dart';

class ApiService {
  final Dio _dio = Dio(BaseOptions(
    // Utilisez 10.0.2.2 pour Android Emulator
    baseUrl: 'http://10.0.2.2:3000/api', 
    connectTimeout: Duration(seconds: 5),
    receiveTimeout: Duration(seconds: 3),
  ));

  void init() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Récupérer le token depuis le stockage sécurisé
        String? token = await getStoredToken(); 
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        if (e.response?.statusCode == 401) {
          // Gérer la déconnexion forcée
        }
        return handler.next(e);
      }
    ));
  }

  Future<List> getProducts() async {
    final res = await _dio.get('/products');
    return res.data;
  }
}
```

---

## 🚛 Fonctionnalités Spécifiques Mobile

### 1. Suivi GPS (Transporteur)
Le transporteur doit mettre à jour sa position régulièrement via :
`PATCH /orders/:id/position`
Body: `{ "lat": 12.37, "lng": -1.53 }`

### 2. Notifications (Simulation)
L'API ne supporte pas encore les notifications Push Firebase (FCM). Pour le moment, utilisez le **Long Polling** ou le rafraîchissement manuel de l'état des commandes.

---

## 🏁 Checklist d'Intégration
1. [ ] Tester la connexion avec le point `/health`.
2. [ ] Implémenter le flux Register -> OTP -> Login.
3. [ ] Gérer l'expiration du Token (Logout automatique).
