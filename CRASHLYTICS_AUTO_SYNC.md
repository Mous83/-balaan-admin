# 🔄 SYNC AUTOMATIQUE CRASHLYTICS → FIRESTORE

## 🎯 OBJECTIF
Faire en sorte que **TOUS** les crashes Crashlytics soient **AUTOMATIQUEMENT** retransmis dans ton admin Firestore.

## ☁️ CLOUD FUNCTION - SYNC AUTOMATIQUE

### 1. Créer la Cloud Function
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');

admin.initializeApp();

// Configuration pour accéder à l'API Crashlytics
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/firebase.readonly']
});

// Sync automatique toutes les 5 minutes
exports.syncCrashlyticsToFirestore = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      console.log('🔄 Début sync Crashlytics → Firestore');
      
      // Récupérer les nouveaux crashes depuis Crashlytics
      const crashes = await getCrashlyticsData();
      
      if (crashes.length === 0) {
        console.log('✅ Aucun nouveau crash à sync');
        return;
      }
      
      // Sauvegarder dans Firestore
      const batch = admin.firestore().batch();
      
      for (const crash of crashes) {
        const docRef = admin.firestore().collection('app_crashes').doc();
        batch.set(docRef, {
          ...crash,
          synced_at: admin.firestore.FieldValue.serverTimestamp(),
          source: 'crashlytics_auto_sync'
        });
      }
      
      await batch.commit();
      console.log(`✅ ${crashes.length} crashes syncés vers Firestore`);
      
    } catch (error) {
      console.error('❌ Erreur sync Crashlytics:', error);
    }
  });

// Fonction pour récupérer les données Crashlytics
async function getCrashlyticsData() {
  try {
    // Récupérer le token d'authentification
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    // Appel à l'API Crashlytics
    const response = await fetch('https://firebase.googleapis.com/v1beta1/projects/YOUR_PROJECT_ID/crashlytics/issues', {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Transformer les données Crashlytics en format Firestore
    return data.issues?.map(issue => ({
      error_type: issue.title || 'Unknown Error',
      message: issue.subtitle || 'No message available',
      severity: issue.fatal ? 'fatal' : 'non-fatal',
      platform: issue.platform || 'Unknown',
      app_version: issue.appVersion || 'Unknown',
      user_id: issue.userId || 'anonymous',
      timestamp: admin.firestore.Timestamp.fromDate(new Date(issue.lastOccurrenceTime)),
      stack_trace: issue.stackTrace || 'No stack trace available',
      device_info: {
        model: issue.deviceModel || 'Unknown',
        os_version: issue.osVersion || 'Unknown'
      },
      crashlytics_id: issue.issueId,
      crash_count: issue.crashCount || 1,
      affected_users: issue.affectedUsers || 1
    })) || [];
    
  } catch (error) {
    console.error('❌ Erreur récupération Crashlytics:', error);
    return [];
  }
}

// Trigger sur nouveaux crashes (si possible)
exports.onCrashlyticsCrash = functions.pubsub
  .topic('crashlytics-crashes')
  .onPublish(async (message) => {
    try {
      const crashData = message.data;
      
      // Sauvegarder immédiatement dans Firestore
      await admin.firestore().collection('app_crashes').add({
        ...crashData,
        synced_at: admin.firestore.FieldValue.serverTimestamp(),
        source: 'crashlytics_realtime'
      });
      
      // Créer notification admin si crash fatal
      if (crashData.severity === 'fatal') {
        await admin.firestore().collection('admin_notifications').add({
          type: 'crash_fatal',
          title: '🚨 Crash Fatal Détecté',
          message: `${crashData.error_type}: ${crashData.message}`,
          priority: 'high',
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          crash_id: crashData.crashlytics_id
        });
      }
      
      console.log('✅ Crash syncé en temps réel');
      
    } catch (error) {
      console.error('❌ Erreur sync temps réel:', error);
    }
  });
```

### 2. Configuration Firebase
```json
// firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### 3. Déployer la Cloud Function
```bash
# Installer les dépendances
cd functions
npm install google-auth-library

# Déployer
firebase deploy --only functions
```

## 🔧 ALTERNATIVE SIMPLE - WEBHOOK CRASHLYTICS

### 1. Configurer Webhook dans Firebase Console
1. Aller dans **Crashlytics** → **Settings** → **Integrations**
2. Créer un **Webhook** vers ton admin
3. URL: `https://balaan-admin.netlify.app/api/crash-webhook`

### 2. Endpoint dans ton Admin
```javascript
// src/pages/api/crash-webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const crashData = req.body;
    
    // Sauvegarder dans Firestore
    await addDoc(collection(db, 'app_crashes'), {
      ...crashData,
      timestamp: serverTimestamp(),
      source: 'crashlytics_webhook'
    });
    
    // Notification admin
    if (crashData.severity === 'fatal') {
      await addDoc(collection(db, 'admin_notifications'), {
        type: 'crash_fatal',
        title: '🚨 Crash Fatal Détecté',
        message: `${crashData.error_type}: ${crashData.message}`,
        priority: 'high',
        created_at: serverTimestamp(),
        read: false
      });
    }
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Erreur webhook crash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## 🚀 ÉTAPES D'IMPLÉMENTATION

### Option 1 - Cloud Function (Recommandée)
1. **Créer le dossier `functions/`** dans ton projet
2. **Copier le code** de la Cloud Function
3. **Déployer** avec `firebase deploy --only functions`
4. **Vérifier** que ça marche dans ton admin

### Option 2 - Webhook (Plus simple)
1. **Configurer le webhook** dans Firebase Console
2. **Créer l'endpoint** dans ton admin
3. **Tester** avec un crash volontaire

## 📊 RÉSULTAT ATTENDU

- **Crash dans ton app** → **Crashlytics** → **Automatiquement** → **Firestore** → **Ton admin**
- **Temps réel** : 1-2 minutes de délai
- **Notifications** : Alertes immédiates pour crashes fatals
- **Dashboard** : Données toujours à jour

## ⚠️ IMPORTANT

- **Crashlytics** = Continue de fonctionner normalement
- **Firestore** = Reçoit automatiquement tous les crashes
- **Admin** = Affiche les données en temps réel
- **Pas de modification** de ton app FlutterFlow nécessaire !

**Veux-tu qu'on implémente la Cloud Function ?** 🚀
