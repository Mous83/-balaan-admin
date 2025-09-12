# 🔗 SYNC CRASHLYTICS → FIRESTORE

## 📱 DANS TON APP FLUTTERFLOW

### 1. Custom Action - Envoyer Crash vers Firestore
```dart
// Custom Action: sendCrashToFirestore
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

Future<void> sendCrashToFirestore(
  String errorType,
  String message,
  String severity,
  String stackTrace,
  String userId,
) async {
  try {
    // Envoyer à Crashlytics (automatique)
    await FirebaseCrashlytics.instance.recordError(
      errorType,
      StackTrace.fromString(stackTrace),
      fatal: severity == 'fatal',
    );
    
    // AUSSI envoyer à Firestore pour l'admin
    await FirebaseFirestore.instance.collection('app_crashes').add({
      'error_type': errorType,
      'message': message,
      'severity': severity,
      'stack_trace': stackTrace,
      'user_id': userId,
      'platform': Platform.isAndroid ? 'Android' : 'iOS',
      'app_version': '1.2.3', // Récupérer la vraie version
      'timestamp': FieldValue.serverTimestamp(),
      'device_info': {
        'model': await getDeviceModel(),
        'os_version': await getOSVersion(),
      }
    });
    
    print('✅ Crash envoyé à Firestore et Crashlytics');
  } catch (e) {
    print('❌ Erreur envoi crash: $e');
  }
}
```

### 2. Wrapper pour Capturer Automatiquement
```dart
// Custom Action: setupCrashHandler
void setupCrashHandler() {
  // Capturer les erreurs Flutter
  FlutterError.onError = (FlutterErrorDetails details) async {
    // Envoyer à Crashlytics (automatique)
    FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    
    // AUSSI envoyer à Firestore
    await sendCrashToFirestore(
      'FlutterError',
      details.exception.toString(),
      'fatal',
      details.stack.toString(),
      FFAppState().currentUser?.uid ?? 'anonymous'
    );
  };
  
  // Capturer les erreurs async
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    
    // Envoyer à Firestore
    sendCrashToFirestore(
      'AsyncError',
      error.toString(),
      'fatal',
      stack.toString(),
      FFAppState().currentUser?.uid ?? 'anonymous'
    );
    
    return true;
  };
}
```

### 3. Usage dans tes Pages FlutterFlow
```dart
// Dans tes widgets/actions
try {
  // Code qui peut planter
  await loadSalonData();
} catch (e, stackTrace) {
  // Envoyer l'erreur
  await sendCrashToFirestore(
    'DataLoadError',
    e.toString(),
    'non-fatal',
    stackTrace.toString(),
    currentUser?.uid ?? 'anonymous'
  );
  
  // Afficher message à l'utilisateur
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Erreur de chargement'))
  );
}
```

## ☁️ CLOUD FUNCTION (Optionnel)

### Sync automatique Crashlytics → Firestore
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.syncCrashlytics = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      // Récupérer les nouveaux crashes depuis Crashlytics API
      // (Nécessite setup OAuth + API Crashlytics)
      
      const crashes = await getCrashlyticsData();
      
      // Sauvegarder dans Firestore
      const batch = admin.firestore().batch();
      
      crashes.forEach(crash => {
        const docRef = admin.firestore().collection('app_crashes').doc();
        batch.set(docRef, {
          ...crash,
          synced_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`✅ Synced ${crashes.length} crashes`);
      
    } catch (error) {
      console.error('❌ Sync error:', error);
    }
  });

// Trigger sur nouveaux crashes
exports.onNewCrash = functions.firestore
  .document('app_crashes/{crashId}')
  .onCreate(async (snap, context) => {
    const crash = snap.data();
    
    // Alertes pour crashes critiques
    if (crash.severity === 'fatal') {
      // Envoyer notification push aux admins
      await sendAdminAlert(crash);
      
      // Créer notification dans l'admin
      await admin.firestore().collection('admin_notifications').add({
        type: 'crash_fatal',
        title: 'Crash Fatal Détecté',
        message: `${crash.error_type}: ${crash.message}`,
        crash_id: context.params.crashId,
        priority: 'high',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });
    }
  });
```

## 🎯 STRUCTURE FIRESTORE

### Collection: `app_crashes`
```javascript
{
  "error_type": "NullPointerException",
  "message": "Attempt to invoke virtual method...",
  "severity": "fatal", // "fatal" | "non-fatal"
  "stack_trace": "at com.balaan.MainActivity...",
  "user_id": "user_123",
  "platform": "Android", // "Android" | "iOS"
  "app_version": "1.2.3",
  "timestamp": Timestamp,
  "device_info": {
    "model": "Samsung Galaxy S21",
    "os_version": "Android 12",
    "ram": "8GB",
    "storage": "128GB"
  },
  "session_id": "session_456",
  "breadcrumbs": [
    "User opened salon list",
    "User tapped on salon",
    "Loading salon details"
  ]
}
```

### Collection: `admin_notifications`
```javascript
{
  "type": "crash_fatal",
  "title": "Crash Fatal Détecté",
  "message": "NullPointerException dans MainActivity",
  "crash_id": "crash_789",
  "priority": "high", // "low" | "medium" | "high"
  "created_at": Timestamp,
  "read": false,
  "admin_id": "admin_123" // Si assigné à un admin
}
```

## 📊 AVANTAGES DE CETTE INTÉGRATION

### Pour l'Admin Interface
- **Dashboard unifié** : Crashes + Analytics + Business data
- **Alertes temps réel** : Notifications push pour crashes critiques
- **Corrélation données** : Lier crashes à utilisateurs/salons spécifiques
- **Export facile** : CSV des crashes pour analyse

### Pour le Développement
- **Debug facilité** : Stack traces complètes dans Firestore
- **Priorités claires** : Identifier les bugs les plus critiques
- **Tendances** : Voir l'évolution de la stabilité
- **A/B Testing** : Comparer stabilité entre versions

## 🚀 ÉTAPES D'IMPLÉMENTATION

1. **Ajouter les Custom Actions** dans FlutterFlow
2. **Appeler setupCrashHandler()** dans main.dart
3. **Wrapper les actions critiques** avec try/catch
4. **Ajouter la page CrashMonitoring** à l'admin
5. **Configurer les alertes** pour crashes fatals
6. **Tester** avec un crash volontaire

## 🔔 ALERTES RECOMMANDÉES

- **Crash fatal** → Notification immédiate
- **>10 crashes/heure** → Alerte dégradation
- **Nouveau type d'erreur** → Investigation requise
- **Crash rate >5%** → Rollback recommandé
