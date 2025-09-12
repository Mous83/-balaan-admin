# 🚀 Balaan Admin - Interface d'Administration

Interface web d'administration pour la plateforme Balaan, construite avec **React** et **Material-UI**.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec emails autorisés
- 📊 **Dashboard** avec statistiques temps réel
- 🏪 **Gestion des salons** (approbation, modification, bannissement)
- ✅ **Vérification KYC** avec visualisation des documents
- 👥 **Gestion des utilisateurs** et modération
- 💬 **Support client** avec système de tickets
- 📈 **Analytics** détaillées avec graphiques
- ⚙️ **Paramètres** configurables

## 🛠️ Technologies

- **React 18** + **Vite**
- **Material-UI (MUI)** pour l'interface
- **Firebase** (Firestore, Auth, Storage)
- **Recharts** pour les graphiques
- **React Router** pour la navigation

## 🚀 Installation

1. **Cloner et installer les dépendances:**
```bash
cd balaan-admin-web
npm install
```

2. **Configuration Firebase:**
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer .env avec tes configurations Firebase
VITE_FIREBASE_API_KEY=ton_api_key
VITE_FIREBASE_AUTH_DOMAIN=ton_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ton_projet_id
VITE_FIREBASE_STORAGE_BUCKET=ton_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ton_sender_id
VITE_FIREBASE_APP_ID=ton_app_id

# Email(s) d'administration (séparer par des virgules)
VITE_ADMIN_EMAILS=ton-email@gmail.com,admin2@exemple.com
```

3. **Lancer en développement:**
```bash
npm run dev
```

4. **Build pour production:**
```bash
npm run build
```

## 🔐 Configuration Sécurité

### Emails Administrateurs
Les emails autorisés sont configurés dans le fichier `.env`:
```env
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Règles Firebase
Assure-toi que tes règles Firestore permettent la lecture admin:
```javascript
// Exemple de règle pour lecture admin
match /salons/{document} {
  allow read: if true; // Lecture publique OK pour admin
  allow write: if resource.data.Proprietaire == /databases/$(database)/documents/users/$(request.auth.uid);
}
```

## 📱 Pages Disponibles

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Vue d'ensemble avec métriques |
| Salons | `/salons` | Gestion et approbation des salons |
| Vérification KYC | `/kyc` | Validation des documents |
| Utilisateurs | `/users` | Gestion des comptes utilisateurs |
| Support | `/support` | Tickets de support client |
| Analytics | `/analytics` | Rapports et graphiques |
| Paramètres | `/settings` | Configuration de l'admin |

## 🎨 Interface

### Dashboard
- 📊 Métriques principales (salons, users, revenus)
- 📈 Graphiques de croissance
- 🔔 Activité récente
- 🎯 Statuts KYC en temps réel

### Gestion Salons
- ✅ Approbation/rejet en un clic
- 🔍 Recherche et filtres avancés
- 📋 Détails complets de chaque salon
- 📊 Tableau avec tri et pagination

### Vérification KYC
- 🖼️ Visualisation des documents
- ✅ Approbation individuelle par document
- ❌ Rejet avec motifs personnalisés
- 📁 Organisation par statut (pending/approved/rejected)

## 🚀 Déploiement

### Netlify (Recommandé)
```bash
# Build
npm run build

# Deploy sur Netlify
# Glisser-déposer le dossier 'dist' sur netlify.com
```

### Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Firebase Hosting
```bash
# Installer Firebase CLI
npm i -g firebase-tools

# Connecter au projet
firebase login
firebase init hosting

# Deploy
firebase deploy --only hosting
```

## 🔧 Personnalisation

### Thème Material-UI
Modifier le thème dans `src/App.jsx`:
```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Couleur principale
    },
    // ...
  },
});
```

### Ajout d'Emails Admin
Ajouter de nouveaux emails dans `.env`:
```env
VITE_ADMIN_EMAILS=ancien@email.com,nouveau@email.com
```

## 📊 Métriques Trackées

- 👥 Nombre total d'utilisateurs
- 🏪 Salons créés/approuvés
- ✅ Documents KYC en attente
- 💬 Tickets support ouverts
- 📈 Croissance mensuelle
- ⭐ Notes moyennes des salons

## 🛡️ Sécurité

- 🔐 Authentification Firebase
- 📧 Restriction par email autorisé
- 🔒 Validation côté client et serveur
- 🚫 Pas d'accès aux données sensibles
- 📝 Logs d'actions admin

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs console du navigateur
2. Tester la connexion Firebase
3. Vérifier la configuration des emails admin
4. Consulter la documentation Firebase

## 🎯 Roadmap

- [ ] Notifications push pour admin
- [ ] Export de données CSV/Excel
- [ ] Système de logs détaillé
- [ ] Mode hors ligne
- [ ] API REST pour intégrations

---

**🎉 Ton interface admin est prête !** 

Connecte-toi avec ton email autorisé pour accéder à toutes les fonctionnalités d'administration de Balaan.
