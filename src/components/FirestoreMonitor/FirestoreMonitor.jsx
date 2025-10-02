import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import {
  Speed,
  Analytics,
  PlayCircleOutline,
  Refresh,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { collection, query, getDocs, onSnapshot, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Composant de monitoring des lectures Firestore en temps réel
 * Affiche les statistiques d'utilisation et détecte les problèmes de performance
 */
export default function FirestoreMonitor({ showDetails = true, autoRefresh = true }) {
  const [stats, setStats] = useState({
    sessionReads: 0,
    totalReads: 0,
    lastMinuteReads: 0,
    avgReadsPerMinute: 0,
    readsByCollection: {},
    recentReads: []
  });
  
  const [status, setStatus] = useState('good'); // 'good', 'warning', 'danger'
  const [sessionStart] = useState(new Date());
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Seuils d'alerte
  const WARNING_THRESHOLD = 100;
  const DANGER_THRESHOLD = 500;

  // Charger les stats depuis localStorage
  useEffect(() => {
    const savedTotal = localStorage.getItem('firestore_total_reads');
    if (savedTotal) {
      setStats(prev => ({ ...prev, totalReads: parseInt(savedTotal) }));
    }
  }, []);

  // Sauvegarder les stats
  useEffect(() => {
    localStorage.setItem('firestore_total_reads', stats.totalReads.toString());
  }, [stats.totalReads]);

  // Déterminer le statut
  useEffect(() => {
    if (stats.lastMinuteReads >= DANGER_THRESHOLD) {
      setStatus('danger');
    } else if (stats.lastMinuteReads >= WARNING_THRESHOLD) {
      setStatus('warning');
    } else {
      setStatus('good');
    }
  }, [stats.lastMinuteReads]);

  // Reset compteur par minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, lastMinuteReads: 0 }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculer moyenne par minute
  useEffect(() => {
    const sessionDuration = (new Date() - sessionStart) / 60000; // minutes
    const avg = sessionDuration > 0 ? Math.round(stats.sessionReads / sessionDuration) : 0;
    setStats(prev => ({ ...prev, avgReadsPerMinute: avg }));
  }, [stats.sessionReads, sessionStart]);

  // Fonction pour tracker une lecture (à appeler depuis d'autres composants)
  const trackRead = (collectionName, count) => {
    setStats(prev => {
      const newReadsByCollection = { ...prev.readsByCollection };
      newReadsByCollection[collectionName] = (newReadsByCollection[collectionName] || 0) + count;

      const newRecentReads = [
        { collection: collectionName, count, timestamp: new Date() },
        ...prev.recentReads.slice(0, 49) // Garder les 50 derniers
      ];

      return {
        ...prev,
        sessionReads: prev.sessionReads + count,
        totalReads: prev.totalReads + count,
        lastMinuteReads: prev.lastMinuteReads + count,
        readsByCollection: newReadsByCollection,
        recentReads: newRecentReads
      };
    });

    console.log(`📊 Firestore: ${count} lectures sur ${collectionName} | Total session: ${stats.sessionReads + count}`);
  };

  // Exposer la fonction globalement pour l'utiliser dans d'autres composants
  useEffect(() => {
    window.trackFirestoreRead = trackRead;
  }, [stats.sessionReads]);

  // Test de monitoring (optionnel)
  const startMonitoring = async () => {
    setIsMonitoring(true);
    try {
      // Exemple: surveiller les salons
      const salonsQuery = query(collection(db, 'salons'), firestoreLimit(10));
      const snapshot = await getDocs(salonsQuery);
      trackRead('salons', snapshot.docs.length);
      
      console.log('✅ Monitoring démarré - Exemple: lecture de 10 salons');
    } catch (error) {
      console.error('❌ Erreur monitoring:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  const resetSession = () => {
    setStats(prev => ({
      ...prev,
      sessionReads: 0,
      lastMinuteReads: 0,
      readsByCollection: {},
      recentReads: []
    }));
  };

  const getStatusColor = () => {
    switch (status) {
      case 'danger': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'danger': return <ErrorIcon />;
      case 'warning': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  const getStatusEmoji = () => {
    switch (status) {
      case 'danger': return '🔴';
      case 'warning': return '🟠';
      default: return '🟢';
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Top 5 collections
  const topCollections = Object.entries(stats.readsByCollection)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Card elevation={3}>
      <CardContent>
        {/* En-tête */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight="bold">
              {getStatusEmoji()} Monitoring Firestore
            </Typography>
            <Chip
              icon={getStatusIcon()}
              label={`${stats.lastMinuteReads}/min`}
              color={getStatusColor()}
              size="small"
            />
          </Box>
          <Box>
            <Tooltip title="Tester le monitoring">
              <IconButton 
                onClick={startMonitoring} 
                disabled={isMonitoring}
                size="small"
              >
                <PlayCircleOutline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Réinitialiser session">
              <IconButton onClick={resetSession} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Statistiques principales */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <PlayCircleOutline sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatNumber(stats.sessionReads)}
              </Typography>
              <Typography variant="caption">Session</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <Speed sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.avgReadsPerMinute}
              </Typography>
              <Typography variant="caption">Moyenne/min</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
              <Analytics sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {formatNumber(stats.totalReads)}
              </Typography>
              <Typography variant="caption">Total</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Détails */}
        {showDetails && (
          <>
            <Divider sx={{ my: 2 }} />
            
            {/* Top collections */}
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>
              Top collections
            </Typography>
            {topCollections.length > 0 ? (
              <Box mb={2}>
                {topCollections.map(([name, count]) => (
                  <Box key={name} mb={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{name}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(count / stats.sessionReads) * 100}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" mb={2}>
                Aucune lecture enregistrée. Cliquez sur ▶ pour tester.
              </Typography>
            )}

            {/* Alertes */}
            {status === 'danger' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>Trop de lectures !</strong> Vérifiez vos listeners et ajoutez des limites.
              </Alert>
            )}
            {status === 'warning' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Lectures élevées. Surveillez la tendance.
              </Alert>
            )}

            {/* Conseils */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
              <Typography variant="caption" color="text.secondary">
                💡 <strong>Conseils :</strong> Utilisez <code>.limit()</code> sur vos requêtes,
                privilégiez <code>getDocs()</code> au lieu de <code>onSnapshot()</code> pour
                les données statiques, et ajoutez des filtres temporels.
              </Typography>
            </Paper>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Hook personnalisé pour tracker facilement les lectures
export const useFirestoreTracking = () => {
  const trackRead = (collectionName, count) => {
    if (window.trackFirestoreRead) {
      window.trackFirestoreRead(collectionName, count);
    }
  };

  return { trackRead };
};
