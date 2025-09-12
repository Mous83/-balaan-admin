import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { isAdmin } from '../config/admin';
import toast from 'react-hot-toast';
import { setAdminUser } from '../utils/analytics';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // Vérifier le mode test
    if (localStorage.getItem('admin_test_mode') === 'true') {
      const testUser = { email: 'admin@balaan.com', uid: 'test-admin' };
      setUser(testUser);
      setIsAdminUser(true);
      setLoading(false);
      // 📊 Tracker l'admin en mode test
      setAdminUser(testUser.email, testUser.uid);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isAdmin(user.email)) {
        setUser(user);
        setIsAdminUser(true);
        console.log('✅ Admin connecté:', user.email);
        // 📊 Tracker l'admin connecté
        setAdminUser(user.email, user.uid);
      } else if (user) {
        // Utilisateur connecté mais pas admin
        setUser(null);
        setIsAdminUser(false);
        signOut(auth);
        toast.error('Accès non autorisé - Admin uniquement');
      } else {
        setUser(null);
        setIsAdminUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Vérification admin avant connexion
      if (!isAdmin(email)) {
        throw new Error('Accès non autorisé - Admin uniquement');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
      return userCredential.user;
    } catch (error) {
      console.error('Erreur login:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Nettoyer le mode test
      localStorage.removeItem('admin_test_mode');
      await signOut(auth);
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur logout:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return {
    user,
    loading,
    isAdminUser,
    login,
    logout
  };
};
