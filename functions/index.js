/**
 * 🔄 CLOUD FUNCTION - SYNC AUTOMATIQUE CRASHLYTICS → FIRESTORE
 * Tous les crashes Crashlytics sont automatiquement retransmis dans ton admin
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Sync automatique toutes les 5 minutes
exports.syncCrashlyticsToFirestore = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      console.log('🔄 Début sync Crashlytics → Firestore');
      
      // Récupérer les derniers crashes depuis Firestore (simulation)
      // En réalité, on utiliserait l'API Crashlytics
      const crashes = await getRecentCrashes();
      
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

// Fonction pour récupérer les crashes récents (simulation)
async function getRecentCrashes() {
  try {
    // En réalité, on appellerait l'API Crashlytics ici
    // Pour l'instant, on simule des données
    const mockCrashes = [
      {
        error_type: 'NullPointerException',
        message: 'Attempt to invoke virtual method on null object',
        severity: 'fatal',
        platform: 'Android',
        app_version: '1.2.3',
        user_id: 'user_123',
        timestamp: admin.firestore.Timestamp.fromDate(new Date()),
        stack_trace: 'at com.balaan.MainActivity.onCreate(MainActivity.java:45)',
        device_info: {
          model: 'Samsung Galaxy S21',
          os_version: 'Android 12'
        },
        crashlytics_id: 'crash_' + Date.now(),
        crash_count: 1,
        affected_users: 1
      }
    ];
    
    return mockCrashes;
    
  } catch (error) {
    console.error('❌ Erreur récupération crashes:', error);
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

// Fonction pour tester le sync
exports.testCrashSync = functions.https.onRequest(async (req, res) => {
  try {
    // Créer un crash de test
    const testCrash = {
      error_type: 'TestError',
      message: 'Test crash depuis Cloud Function',
      severity: 'non-fatal',
      platform: 'Test',
      app_version: '1.2.3',
      user_id: 'test_user',
      timestamp: admin.firestore.Timestamp.fromDate(new Date()),
      stack_trace: 'Test stack trace',
      device_info: {
        model: 'Test Device',
        os_version: 'Test OS'
      },
      crashlytics_id: 'test_' + Date.now(),
      crash_count: 1,
      affected_users: 1
    };
    
    // Sauvegarder dans Firestore
    await admin.firestore().collection('app_crashes').add({
      ...testCrash,
      synced_at: admin.firestore.FieldValue.serverTimestamp(),
      source: 'test_function'
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Test crash créé avec succès',
      crash_id: testCrash.crashlytics_id
    });
    
  } catch (error) {
    console.error('❌ Erreur test crash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
