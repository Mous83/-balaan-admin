/**
 * 📊 BALAAN ADMIN ANALYTICS
 * Utilitaires pour tracker les actions admin
 */

// Vérifier si gtag est disponible
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// 👤 Identifier l'admin connecté
export const setAdminUser = (adminEmail, adminId) => {
  if (!isGtagAvailable()) return;
  
  window.gtag('config', 'G-7R1BV7W875', {
    user_id: adminId,
    custom_map: {
      'dimension1': adminEmail
    }
  });
  
  console.log('📊 Analytics: Admin identifié', adminEmail);
};

// 📄 Tracker les pages vues
export const trackPageView = (pageName, pageUrl) => {
  if (!isGtagAvailable()) return;
  
  window.gtag('event', 'page_view', {
    page_title: `Balaan Admin - ${pageName}`,
    page_location: pageUrl,
    page_path: pageUrl
  });
  
  console.log('📊 Analytics: Page vue', pageName);
};

// 🎯 Tracker les actions admin
export const trackAdminAction = (action, category, data = {}) => {
  if (!isGtagAvailable()) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: data.label || '',
    value: data.value || 0,
    custom_map: {
      'dimension2': action
    },
    ...data
  });
  
  console.log('📊 Analytics: Action trackée', { action, category, data });
};

// 🏢 Actions spécifiques SALONS
export const trackSalonAction = (action, salonId, salonData = {}) => {
  trackAdminAction(action, 'salon_management', {
    salon_id: salonId,
    salon_name: salonData.nom || 'Unknown',
    salon_city: salonData.adresse?.ville || 'Unknown',
    label: `${action}_${salonId}`
  });
};

// ✅ Actions spécifiques KYC
export const trackKycAction = (action, salonId, decision = null) => {
  trackAdminAction(action, 'kyc_verification', {
    salon_id: salonId,
    kyc_decision: decision,
    label: `kyc_${action}_${salonId}`
  });
};

// 🎫 Actions spécifiques SUPPORT
export const trackSupportAction = (action, ticketId, ticketData = {}) => {
  trackAdminAction(action, 'support_management', {
    ticket_id: ticketId,
    ticket_type: ticketData.type || 'Unknown',
    ticket_priority: ticketData.priority || 'normal',
    label: `support_${action}_${ticketId}`
  });
};

// 📊 Tracker les métriques business
export const trackBusinessMetric = (metric, value, unit = 'count') => {
  if (!isGtagAvailable()) return;
  
  window.gtag('event', 'business_metric', {
    event_category: 'business_intelligence',
    metric_name: metric,
    metric_value: value,
    metric_unit: unit,
    value: typeof value === 'number' ? value : 0
  });
  
  console.log('📊 Analytics: Métrique business', { metric, value, unit });
};

// 🚨 Tracker les erreurs
export const trackError = (error, context = '') => {
  if (!isGtagAvailable()) return;
  
  window.gtag('event', 'exception', {
    description: error.message || error,
    fatal: false,
    error_context: context
  });
  
  console.log('📊 Analytics: Erreur trackée', { error, context });
};

// 📈 Événements prédéfinis
export const ANALYTICS_EVENTS = {
  // Pages
  PAGE_DASHBOARD: 'dashboard_view',
  PAGE_SALONS: 'salons_view', 
  PAGE_KYC: 'kyc_view',
  PAGE_SUPPORT: 'support_view',
  PAGE_USERS: 'users_view',
  
  // Actions Salons
  SALON_VIEW: 'salon_view',
  SALON_EDIT: 'salon_edit',
  SALON_DELETE: 'salon_delete',
  SALON_ACTIVATE: 'salon_activate',
  SALON_DEACTIVATE: 'salon_deactivate',
  
  // Actions KYC
  KYC_APPROVE: 'kyc_approve',
  KYC_REJECT: 'kyc_reject',
  KYC_REQUEST_INFO: 'kyc_request_info',
  
  // Actions Support
  TICKET_VIEW: 'ticket_view',
  TICKET_RESPOND: 'ticket_respond',
  TICKET_CLOSE: 'ticket_close',
  TICKET_ESCALATE: 'ticket_escalate',
  
  // Business
  STATS_LOAD: 'stats_load',
  EXPORT_DATA: 'export_data',
  SEARCH_PERFORMED: 'search_performed'
};

export default {
  setAdminUser,
  trackPageView,
  trackAdminAction,
  trackSalonAction,
  trackKycAction,
  trackSupportAction,
  trackBusinessMetric,
  trackError,
  ANALYTICS_EVENTS
};
