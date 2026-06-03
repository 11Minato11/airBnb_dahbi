# 🧪 Guide de Test Redis - AirBEMI

## ✅ Prérequis

- Redis est en train de fonctionner (Upstash ou local)
- `npm run start:dev` est lancé
- Postman installé (optionnel)

---

## 📋 Plan de Test

### 1️⃣ Vérifier la Connexion Redis

Au démarrage du serveur, vérifiez les logs :

```bash
npm run start:dev
```

Attendez le message :
```
[RedisService] Redis connected successfully
```

**Test d'endpoint** :
```bash
curl http://localhost:3000/test/redis/ping
```

Réponse attendue :
```json
{
  "status": "OK",
  "message": "Redis is connected",
  "result": "PONG"
}
```

---

### 2️⃣ Importer la Collection Postman

1. Ouvrez **Postman**
2. Cliquez sur **Import** (en haut à gauche)
3. Sélectionnez le fichier : `Redis-Tests.postman_collection.json`
4. La collection **"Redis Test Suite - AirBEMI"** apparaît

---

### 3️⃣ Tests dans Postman (par ordre)

#### **SECTION 1 : CONNECTION**
- ✅ Ping Redis

#### **SECTION 2 : SET/GET/DELETE**
- ✅ Set Key (crée `test:demo = "Hello Redis"`)
- ✅ Get Key (récupère la valeur)
- ✅ Delete Key (supprime la clé)

#### **SECTION 3 : CALENDAR/BOOKING**

1. **Add Booked Dates**
   - Ajoute 3 dates à `prop123`
   - Réponse : `status: OK`

2. **Check Availability (Booked - Should be false)**
   - Teste si les dates 2026-06-10 et 2026-06-11 sont disponibles
   - Réponse : `available: false` ✅ (dates réservées)

3. **Check Availability (Free - Should be true)**
   - Teste si les dates 2026-06-20 et 2026-06-21 sont disponibles
   - Réponse : `available: true` ✅ (dates libres)

#### **SECTION 4 : LOCK (Anti Double-booking)**

1. **Acquire Lock**
   - Acquiert un verrou pour `prop123`
   - Réponse : `acquired: true` ✅

2. **Try Acquire Same Lock (Should fail)**
   - Essaie d'acquérir le même verrou
   - Réponse : `acquired: false` ✅ (impossible, déjà verrouillé)

3. **Release Lock**
   - Libère le verrou
   - Réponse : `status: OK` ✅

#### **SECTION 5 : RATING**

1. **Set Rating**
   - Stocke une note 4.8/5 avec 25 avis
   - Réponse : `status: OK`

2. **Get Rating**
   - Récupère la note stockée
   - Réponse : `rating: 4.8, count: 25` ✅

#### **SECTION 6 : REVIEWS**

1. **Add Review 1**
   - Ajoute un premier avis
   - Réponse : `status: OK`

2. **Add Review 2**
   - Ajoute un deuxième avis
   - Réponse : `status: OK`

3. **Get Reviews**
   - Récupère les 10 derniers avis (max)
   - Réponse : tableau avec les 2 avis ✅

#### **SECTION 7 : UNREAD MESSAGES**

1. **Increment Unread**
   - Ajoute 3 messages non-lus de `user2` pour `user1`
   - Réponse : `status: OK`

2. **Get Unread Counts**
   - Récupère les compteurs de `user1`
   - Réponse : `{ "user2": 3 }` ✅

#### **SECTION 8 : UTILITIES**

1. **Show All Redis Keys**
   - Liste toutes les clés Redis en mémoire
   - Vous devriez voir :
     ```
     calendar:prop123
     lock:prop123 (si pas libéré)
     rating:prop123
     reviews:prop123
     unread:user1
     test:demo (si pas supprimé)
     ```

2. **Flush All Keys** ⚠️
   - Supprime toutes les clés (utiliser avec prudence!)
   - Vérifiez avec "Show All Redis Keys" après

---

## 🖥️ Tests via Terminal (cURL)

**Test 1 : Ping**
```bash
curl http://localhost:3000/test/redis/ping | jq .
```

**Test 2 : Set une clé**
```bash
curl -X POST http://localhost:3000/test/redis/set \
  -H "Content-Type: application/json" \
  -d '{"key":"mykey","value":"myvalue","ttl":300}' | jq .
```

**Test 3 : Get une clé**
```bash
curl http://localhost:3000/test/redis/get/mykey | jq .
```

**Test 4 : Vérifier les dates disponibles**
```bash
curl -X POST http://localhost:3000/test/redis/calendar/check \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"prop123","dates":["2026-06-10","2026-06-11"]}' | jq .
```

---

## 📊 Résultats Attendus

| Test | Résultat Attendu | Statut |
|------|-----------------|--------|
| Ping | PONG | ✅ |
| Set/Get | Clé stockée et récupérée | ✅ |
| Calendar Available | `true/false` correct | ✅ |
| Lock Acquire | 1ère fois `true`, 2ème fois `false` | ✅ |
| Rating | Format `"4.8:25"` | ✅ |
| Reviews | Array avec max 10 items | ✅ |
| Unread | Hash avec compteurs | ✅ |

---

## 🐛 Troubleshooting

### ❌ Erreur : "Redis connection failed"

**Causes possibles :**
1. Redis n'est pas lancé
2. `REDIS_URL` mal configurée dans `.env`
3. Connexion réseau bloquée

**Solution :**
```bash
# Vérifier la variable d'environnement
echo $REDIS_URL

# Vérifier la connexion (pour Upstash)
redis-cli -u $REDIS_URL PING
```

### ❌ Endpoint retourne 404

- Vérifier que `TestModule` est importé dans `app.module.ts` ✅
- Vérifier que le serveur redémarre (`npm run start:dev`)

### ❌ Locks ne se libèrent pas

- Vérifiez la TTL (par défaut 600 secondes = 10 min)
- Utilisez `/test/redis/keys/all` pour voir les clés actuelles
- Utilisez `/test/redis/lock/release` pour libérer manuellement

---

## 🚀 Test du WebSocket Chat

1. Utilisez **WebSocket King** ou **Postman WebSocket**
2. Connectez à : `ws://localhost:3000?userId=user123`
3. Envoyez un message :
```json
{
  "event": "send_message",
  "data": {
    "toUserId": "user456",
    "message": "Hello!"
  }
}
```
4. Vérifiez que le message est publié sur Redis

---

## 📝 Notes Importantes

✅ **Tous les tests passent** = Redis fonctionne correctement
✅ Le serveur continue de marcher même si Redis est down (fallback MongoDB)
✅ Les clés ont des TTL appropriés pour éviter la perte mémoire
✅ Les locks anti double-booking sont robustes

---

## 🧹 Nettoyer les Tests

Après les tests, utilisez :
```bash
curl -X POST http://localhost:3000/test/redis/keys/flush
```

Ou supprimer manuellement les clés de test dans redis-cli :
```bash
DEL test:demo
DEL calendar:prop123
DEL rating:prop123
DEL reviews:prop123
DEL unread:user1
```
