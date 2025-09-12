/**
 * 🧪 GÉNÉRATEUR DE DONNÉES DE TEST POUR CRASHES
 * À utiliser pour tester l'interface admin sans FlutterFlow
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const generateTestCrashData = async () => {
  const testCrashes = [
    {
      error_type: 'NullPointerException',
      message: 'Attempt to invoke virtual method on null object reference',
      severity: 'fatal',
      platform: 'Android',
      app_version: '1.2.3',
      user_id: 'user_123',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      stack_trace: 'at com.balaan.MainActivity.onCreate(MainActivity.java:45)\nat android.app.Activity.performCreate(Activity.java:7136)',
      device_info: {
        model: 'Samsung Galaxy S21',
        os_version: 'Android 12',
        ram: '8GB'
      }
    },
    {
      error_type: 'NetworkException',
      message: 'Unable to resolve host "firebase.com"',
      severity: 'non-fatal',
      platform: 'iOS',
      app_version: '1.2.3',
      user_id: 'user_456',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
      stack_trace: 'at URLSession.dataTask\nat NetworkManager.loadData',
      device_info: {
        model: 'iPhone 13',
        os_version: 'iOS 15.4',
        ram: '6GB'
      }
    },
    {
      error_type: 'OutOfMemoryError',
      message: 'Java heap space',
      severity: 'fatal',
      platform: 'Android',
      app_version: '1.2.2',
      user_id: 'user_789',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)),
      stack_trace: 'at java.util.ArrayList.grow(ArrayList.java:267)\nat com.balaan.ImageLoader.loadImages',
      device_info: {
        model: 'Xiaomi Redmi Note 10',
        os_version: 'Android 11',
        ram: '4GB'
      }
    },
    {
      error_type: 'FlutterError',
      message: 'RenderFlex overflowed by 42 pixels',
      severity: 'non-fatal',
      platform: 'iOS',
      app_version: '1.2.3',
      user_id: 'user_101',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)),
      stack_trace: 'at RenderFlex.performLayout\nat RenderObject.layout',
      device_info: {
        model: 'iPhone 12',
        os_version: 'iOS 15.2',
        ram: '4GB'
      }
    },
    {
      error_type: 'FirebaseException',
      message: 'Permission denied',
      severity: 'non-fatal',
      platform: 'Android',
      app_version: '1.2.3',
      user_id: 'user_202',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
      stack_trace: 'at FirebaseFirestore.getDocument\nat SalonService.loadSalon',
      device_info: {
        model: 'OnePlus 9',
        os_version: 'Android 12',
        ram: '8GB'
      }
    }
  ];

  try {
    console.log('🧪 Génération des données de test...');
    
    for (const crash of testCrashes) {
      await addDoc(collection(db, 'app_crashes'), crash);
      console.log(`✅ Crash ajouté: ${crash.error_type}`);
    }
    
    console.log('🎉 Données de test générées avec succès !');
    return true;
  } catch (error) {
    console.error('❌ Erreur génération données test:', error);
    return false;
  }
};

export const clearTestCrashData = async () => {
  try {
    // Note: Cette fonction nécessiterait une Cloud Function pour supprimer en masse
    // Pour l'instant, on peut supprimer manuellement depuis Firebase Console
    console.log('⚠️ Suppression manuelle requise depuis Firebase Console');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression données test:', error);
    return false;
  }
};
