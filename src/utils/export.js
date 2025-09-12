/**
 * 📋 BALAAN ADMIN EXPORT UTILITIES
 * Export des données en CSV/Excel
 */

import { trackAdminAction } from './analytics';

// Convertir les données en CSV
export const exportToCSV = (data, filename, columns = null) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    // Utiliser les colonnes spécifiées ou toutes les clés du premier objet
    const headers = columns || Object.keys(data[0]);
    
    // Créer l'en-tête CSV
    const csvHeaders = headers.join(',');
    
    // Créer les lignes CSV
    const csvRows = data.map(item => {
      return headers.map(header => {
        let value = item[header];
        
        // Traiter les différents types de données
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          if (value instanceof Date) {
            value = value.toLocaleDateString('fr-FR');
          } else if (Array.isArray(value)) {
            value = value.join('; ');
          } else {
            value = JSON.stringify(value);
          }
        } else if (typeof value === 'string') {
          // Échapper les guillemets et virgules
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
        }
        
        return value;
      }).join(',');
    });
    
    // Combiner en-tête et données
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Créer et télécharger le fichier
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Analytics
    trackAdminAction('export_csv', 'data_export', {
      filename,
      rows_count: data.length,
      columns_count: headers.length
    });
    
    console.log('✅ Export CSV réussi:', filename, data.length + ' lignes');
    return true;
  } catch (error) {
    console.error('❌ Erreur export CSV:', error);
    throw error;
  }
};

// Export spécialisé pour les salons
export const exportSalons = (salons) => {
  const columns = [
    'nom',
    'email',
    'telephone',
    'adresse.ville',
    'adresse.code_postal',
    'kyc_status',
    'rating',
    'created_at',
    'services'
  ];
  
  const processedData = salons.map(salon => ({
    nom: salon.nom || '',
    email: salon.email || '',
    telephone: salon.telephone || '',
    'adresse.ville': salon.adresse?.ville || '',
    'adresse.code_postal': salon.adresse?.code_postal || '',
    kyc_status: salon.kyc_status || '',
    rating: salon.rating || 0,
    created_at: salon.created_at || salon.created_time?.toDate?.() || '',
    services: Array.isArray(salon.services) ? salon.services.join('; ') : salon.services || ''
  }));
  
  return exportToCSV(processedData, 'salons_balaan', Object.keys(processedData[0]));
};

// Export spécialisé pour les utilisateurs
export const exportUsers = (users) => {
  const processedData = users.map(user => ({
    nom: user.display_name || user.nom || '',
    email: user.email || '',
    telephone: user.phone_number || user.telephone || '',
    ville: user.ville || '',
    date_inscription: user.created_time?.toDate?.() || user.created_at || '',
    derniere_connexion: user.last_sign_in_time?.toDate?.() || '',
    statut: user.disabled ? 'Désactivé' : 'Actif',
    reservations_total: user.bookings_count || 0
  }));
  
  return exportToCSV(processedData, 'utilisateurs_balaan');
};

// Export spécialisé pour les tickets support
export const exportSupportTickets = (tickets) => {
  const processedData = tickets.map(ticket => ({
    id: ticket.id || '',
    type: ticket.type || '',
    sujet: ticket.subject || ticket.sujet || '',
    description: ticket.description || '',
    statut: ticket.status || '',
    priorite: ticket.priority || '',
    email_client: ticket.user_email || '',
    date_creation: ticket.created_at?.toDate?.() || '',
    date_reponse: ticket.responded_at?.toDate?.() || '',
    resolu: ticket.resolved ? 'Oui' : 'Non'
  }));
  
  return exportToCSV(processedData, 'support_tickets_balaan');
};

// Export des statistiques dashboard
export const exportDashboardStats = (stats) => {
  const processedData = [{
    date_export: new Date().toLocaleDateString('fr-FR'),
    total_salons: stats.totalSalons || 0,
    salons_approuves: stats.salonsApproved || 0,
    salons_actifs: stats.activeSalons || 0,
    total_utilisateurs: stats.totalUsers || 0,
    kyc_en_attente: stats.pendingKyc || 0,
    tickets_support: stats.supportTickets || 0,
    satisfaction_client: stats.clientSatisfaction || 0,
    temps_reponse_moyen: stats.averageResponseTime || 0,
    croissance_mensuelle: stats.monthlyGrowth || 0
  }];
  
  return exportToCSV(processedData, 'statistiques_balaan');
};

// Export avec filtres avancés
export const exportWithFilters = (data, type, filters) => {
  let processedData = [...data];
  
  // Appliquer les filtres
  if (filters.dateFrom) {
    processedData = processedData.filter(item => {
      const itemDate = item.created_at || item.created_time?.toDate?.();
      return itemDate >= filters.dateFrom;
    });
  }
  
  if (filters.dateTo) {
    processedData = processedData.filter(item => {
      const itemDate = item.created_at || item.created_time?.toDate?.();
      return itemDate <= filters.dateTo;
    });
  }
  
  if (filters.city) {
    processedData = processedData.filter(item => 
      item.adresse?.ville?.toLowerCase().includes(filters.city.toLowerCase()) ||
      item.ville?.toLowerCase().includes(filters.city.toLowerCase())
    );
  }
  
  if (filters.status) {
    processedData = processedData.filter(item => 
      item.status === filters.status || 
      item.kyc_status === filters.status
    );
  }
  
  // Exporter selon le type
  switch (type) {
    case 'salons':
      return exportSalons(processedData);
    case 'users':
      return exportUsers(processedData);
    case 'support':
      return exportSupportTickets(processedData);
    default:
      return exportToCSV(processedData, `export_${type}_filtre`);
  }
};

// Utilitaire pour créer un rapport complet
export const exportFullReport = async (data) => {
  try {
    const { salons, users, support, stats } = data;
    
    // Créer un rapport consolidé
    const reportData = [{
      type: 'RAPPORT COMPLET BALAAN',
      date_generation: new Date().toLocaleDateString('fr-FR'),
      heure_generation: new Date().toLocaleTimeString('fr-FR'),
      ...stats
    }];
    
    // Exporter le rapport principal
    await exportToCSV(reportData, 'rapport_complet_balaan');
    
    // Exporter chaque section si des données existent
    if (salons?.length > 0) {
      await exportSalons(salons);
    }
    
    if (users?.length > 0) {
      await exportUsers(users);
    }
    
    if (support?.length > 0) {
      await exportSupportTickets(support);
    }
    
    trackAdminAction('export_full_report', 'data_export', {
      salons_count: salons?.length || 0,
      users_count: users?.length || 0,
      support_count: support?.length || 0
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erreur export rapport complet:', error);
    throw error;
  }
};

export default {
  exportToCSV,
  exportSalons,
  exportUsers,
  exportSupportTickets,
  exportDashboardStats,
  exportWithFilters,
  exportFullReport
};
