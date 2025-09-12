# 🚨 FIREBASE CRASHLYTICS SETUP POUR BALAAN

## 📱 POUR TON APP FLUTTERFLOW

### 1. Activer Crashlytics dans Firebase Console
```
1. Va dans Firebase Console → ton projet
2. Build → Crashlytics → Get started  
3. Suivre les étapes d'activation
```

### 2. Dans FlutterFlow - Ajouter le code
```dart
// Dans tes Custom Actions FlutterFlow
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

// Enregistrer une erreur
Future<void> recordError(String error, String context) async {
  await FirebaseCrashlytics.instance.recordError(
    error,
    StackTrace.current,
    fatal: false,
    information: [context],
  );
}

// Enregistrer un crash fatal
Future<void> recordFatalError(dynamic exception, StackTrace stackTrace) async {
  await FirebaseCrashlytics.instance.recordError(
    exception,
    stackTrace,
    fatal: true,
  );
}

// Ajouter des infos utilisateur
Future<void> setUserIdentifier(String userId) async {
  await FirebaseCrashlytics.instance.setUserIdentifier(userId);
}

// Ajouter des logs personnalisés
Future<void> logMessage(String message) async {
  await FirebaseCrashlytics.instance.log(message);
}
```

### 3. Utilisation dans tes pages FlutterFlow
```dart
// Dans tes widgets/pages
try {
  // Ton code qui peut crasher
  await makeApiCall();
} catch (e, stackTrace) {
  // Enregistrer l'erreur
  await FirebaseCrashlytics.instance.recordError(
    e,
    stackTrace,
    fatal: false,
    information: ['Page: HomePage', 'User: ${currentUser.email}'],
  );
}
```

### 4. Tracking automatique des erreurs
```dart
// Dans ton main.dart (Custom Code)
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Capturer toutes les erreurs Flutter
  FlutterError.onError = (errorDetails) {
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  };
  
  // Capturer les erreurs asynchrones
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };
  
  runApp(MyApp());
}
```

## 🌐 POUR L'ADMIN WEB - SENTRY

### Installation
```bash
npm install @sentry/react @sentry/tracing
```

### Configuration
```javascript
// src/utils/sentry.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN", // Tu auras ça après inscription
  environment: "production",
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filtrer les infos sensibles
    if (event.user) {
      delete event.user.email;
    }
    return event;
  }
});

export default Sentry;
```

### Utilisation
```javascript
// Dans tes composants React
import Sentry from '../utils/sentry';

try {
  // Code qui peut planter
  await loadData();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'Dashboard',
      action: 'loadData'
    },
    extra: {
      userId: user?.uid,
      timestamp: new Date().toISOString()
    }
  });
}
```

## 📊 DASHBOARDS DE MONITORING

### Firebase Crashlytics Dashboard
- **Crashes par version**
- **Erreurs les plus fréquentes** 
- **Utilisateurs affectés**
- **Stack traces détaillées**

### Sentry Dashboard  
- **Erreurs temps réel**
- **Performance monitoring**
- **Release tracking**
- **Alertes par email/Slack**

## 🎯 MÉTRIQUES À SURVEILLER

### App Mobile
- **Crashes au démarrage**
- **Erreurs de connexion Firebase**
- **Problèmes de paiement**
- **Erreurs de géolocalisation**

### Admin Web
- **Erreurs de chargement de données**
- **Timeouts Firebase**
- **Erreurs d'authentification**
- **Problèmes d'export**

## 🚀 ÉTAPES SUIVANTES

1. **Activer Crashlytics** dans Firebase Console
2. **Ajouter le code** dans FlutterFlow
3. **Tester** avec une erreur volontaire
4. **Configurer Sentry** pour l'admin web
5. **Mettre des alertes** par email
