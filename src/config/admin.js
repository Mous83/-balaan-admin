// Configuration des administrateurs
const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];

// Vérification si un utilisateur est admin
export const isAdmin = (userEmail) => {
  if (!userEmail || !ADMIN_EMAILS.length) return false;
  return ADMIN_EMAILS.includes(userEmail.toLowerCase());
};

// Export des emails pour debug
export const getAdminEmails = () => ADMIN_EMAILS;

console.log('🔐 Emails admin configurés:', ADMIN_EMAILS);
