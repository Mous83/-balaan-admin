# 📊 Monitoring Firestore - Admin Web

## Installation

Le monitoring Firestore est maintenant intégré dans ta plateforme admin web !

## Accès

Ouvre ton navigateur et va sur :
```
http://localhost:5173/firestore-monitoring
```

Ou en production :
```
https://ton-domaine.com/firestore-monitoring
```

## Fonctionnalités

### 1. Widget de monitoring en temps réel
- **Lectures par session** : Nombre de lectures depuis l'ouverture de l'app
- **Moyenne par minute** : Taux de lectures moyen
- **Total cumulé** : Total depuis le début (stocké en localStorage)
- **Statut visuel** :
  - 🟢 Vert : < 100 lectures/min (normal)
  - 🟠 Orange : 100-500 lectures/min (attention)
  - 🔴 Rouge : > 500 lectures/min (problème)

### 2. Top collections
Affiche les 5 collections les plus consommées avec :
- Nom de la collection
- Nombre de lectures
- Barre de progression

### 3. Tests de requêtes
Bouton "Lancer les tests" qui exécute :
- Lecture de 50 salons
- Lecture de 50 users
- Lecture de 50 réservations
- Mesure du temps d'exécution

### 4. Objectifs et métriques
- Objectifs de performance
- Impact en production
- Économies estimées

## Utilisation dans d'autres composants

### Tracker automatiquement les lectures

Dans n'importe quel composant React :

```jsx
import { useFirestoreTracking } from '../components/FirestoreMonitor';

function MonComposant() {
  const { trackRead } = useFirestoreTracking();

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'salons'), limit(50));
      const snapshot = await getDocs(q);
      
      // Tracker la lecture
      trackRead('salons', snapshot.docs.length);
    };
    
    fetchData();
  }, []);
}
```

### Ou directement via window

```javascript
// Après une requête Firestore
const snapshot = await getDocs(query);
if (window.trackFirestoreRead) {
  window.trackFirestoreRead('nom_collection', snapshot.docs.length);
}
```

## Ajouter au menu de navigation

Édite `src/components/Layout/AdminLayout.jsx` et ajoute :

```jsx
import { Speed } from '@mui/icons-material';

// Dans la liste des menu items
{
  text: 'Monitoring Firestore',
  icon: <Speed />,
  path: '/firestore-monitoring'
}
```

## Conseils d'utilisation

1. **Pendant le développement** :
   - Garde la page ouverte dans un onglet
   - Surveille les pics de lectures
   - Identifie les requêtes problématiques

2. **Tests de performance** :
   - Lance les tests avant/après optimisations
   - Compare les résultats
   - Vérifie que les limites sont respectées

3. **Production** :
   - Surveille régulièrement (1x/semaine)
   - Alerte si > 100k lectures/jour
   - Ajuste les limites si nécessaire

## Seuils recommandés

| Métrique | Objectif | Alerte |
|----------|----------|--------|
| Lectures/minute | < 100 | > 500 |
| Lectures/session | < 500 | > 2000 |
| Lectures/jour (1 user) | < 5k | > 20k |
| Lectures/jour (prod) | < 500k | > 2M |

## Optimisations appliquées

✅ Listeners limités (50 docs max)  
✅ Filtres temporels (30 jours)  
✅ Cache optimisé (10 minutes)  
✅ Pagination sur listes longues  
✅ Réduction globale : **-93%**

## Dépannage

### Le monitoring ne s'affiche pas
- Vérifie que tu as bien importé le composant
- Vérifie la route dans `App.jsx`
- Regarde la console pour les erreurs

### Les lectures ne sont pas trackées
- Assure-toi d'appeler `trackRead()` après chaque requête
- Vérifie que `window.trackFirestoreRead` existe
- Regarde les logs console : `📊 Firestore: X lectures...`

### Les tests échouent
- Vérifie que tu as des données dans Firestore
- Vérifie les permissions Firestore
- Regarde les erreurs dans la console

## Support

Pour toute question ou problème, consulte :
- `FIRESTORE_INVESTIGATION_REPORT.md`
- `OPTIMISATIONS_APPLIQUEES.md`
- `VERIFICATION_FINALE.md`

---

*Monitoring créé le 2 octobre 2025*
