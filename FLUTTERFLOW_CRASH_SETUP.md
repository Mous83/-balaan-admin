# 📱 SETUP CRASHES DANS FLUTTERFLOW

## 🎯 ÉTAPES OBLIGATOIRES

### 1. CUSTOM ACTION - Envoyer Crash vers Firestore
```dart
// Nom: sendCrashToFirestore
// Type: Action
// Paramètres:
// - errorType (String)
// - message (String) 
// - severity (String)
// - stackTrace (String)
// - userId (String)

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'dart:io';

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
      'app_version': '1.2.3', // Remplacer par vraie version
      'timestamp': FieldValue.serverTimestamp(),
      'device_info': {
        'model': 'Unknown', // Récupérer vraie info si possible
        'os_version': 'Unknown',
      }
    });
    
    print('✅ Crash envoyé à Firestore et Crashlytics');
  } catch (e) {
    print('❌ Erreur envoi crash: $e');
  }
}
```

### 2. CUSTOM ACTION - Setup Handler Global
```dart
// Nom: setupCrashHandler
// Type: Action
// Paramètres: Aucun

import 'package:flutter/foundation.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

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

### 3. APPELER AU DÉMARRAGE
```dart
// Dans main.dart ou AppState
// Appel: setupCrashHandler()
// Quand: Au démarrage de l'app
```

### 4. WRAPPER TES ACTIONS CRITIQUES
```dart
// Exemple dans une action de chargement de salon
try {
  // Ton code existant
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
  // Ton code d'erreur existant
}
```

## 🚀 ALTERNATIVE SIMPLE - TEST MANUEL

### Créer un bouton de test dans FlutterFlow
```dart
// Action: testCrash
await sendCrashToFirestore(
  'TestError',
  'Test crash depuis FlutterFlow',
  'non-fatal',
  'Test stack trace',
  'test_user_123'
);
```

## 📊 VÉRIFICATION

1. **Créer le bouton de test** dans FlutterFlow
2. **Appuyer sur le bouton** 
3. **Vérifier dans Firebase Console** → Firestore → Collection `app_crashes`
4. **Vérifier dans l'admin** → Page Crashes

## ⚠️ IMPORTANT

- **Crashlytics** = Automatique (déjà configuré)
- **Firestore** = Manuel (besoin des Custom Actions)
- **Admin** = Prêt (attend les données Firestore)

Sans les Custom Actions, la page admin restera vide ! 🚫
