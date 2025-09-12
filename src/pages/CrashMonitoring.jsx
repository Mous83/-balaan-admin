/**
 * 🚨 MONITORING DES CRASHES BALAAN
 * Intégration Crashlytics + Firestore
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning,
  BugReport,
  TrendingUp,
  TrendingDown,
  Visibility,
  Refresh,
  GetApp,
  Phone,
  Computer,
  Schedule,
  Person,
  Code
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, query, getDocs, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackPageView, trackAdminAction } from '../utils/analytics';
import { exportToCSV } from '../utils/export';
import { generateTestCrashData } from '../utils/testCrashData';
import toast from 'react-hot-toast';

const COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50'];

export default function CrashMonitoring() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [crashData, setCrashData] = useState({
    overview: {
      totalCrashes: 0,
      affectedUsers: 0,
      crashFreeRate: 0,
      topError: ''
    },
    crashes: [],
    trends: [],
    errorTypes: []
  });
  const [selectedCrash, setSelectedCrash] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    loadCrashData();
    trackPageView('Crash Monitoring', '/crashes');
    
    // Écouter les nouveaux crashes en temps réel
    const crashesRef = collection(db, 'app_crashes');
    const unsubscribe = onSnapshot(
      query(crashesRef, orderBy('timestamp', 'desc'), limit(10)),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const crashData = change.doc.data();
            if (crashData.severity === 'fatal') {
              toast.error(`🚨 Crash fatal détecté: ${crashData.error_type}`);
            }
          }
        });
      }
    );

    return () => unsubscribe();
  }, [timeFilter]);

  const loadCrashData = async () => {
    try {
      setLoading(true);
      
      // Calculer la période
      const now = new Date();
      let startTime;
      switch (timeFilter) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Charger les crashes depuis Firestore
      const crashesRef = collection(db, 'app_crashes');
      const crashesQuery = query(
        crashesRef,
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const crashesSnapshot = await getDocs(crashesQuery);
      const crashes = crashesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Calculer les métriques
      const overview = calculateOverview(crashes);
      const trends = generateTrends(crashes);
      const errorTypes = analyzeErrorTypes(crashes);

      setCrashData({
        overview,
        crashes,
        trends,
        errorTypes
      });

    } catch (error) {
      console.error('Erreur chargement crashes:', error);
      // Données simulées si pas de collection crashes
      setCrashData({
        overview: {
          totalCrashes: 12,
          affectedUsers: 8,
          crashFreeRate: 98.5,
          topError: 'NullPointerException'
        },
        crashes: generateMockCrashes(),
        trends: generateMockTrends(),
        errorTypes: [
          { name: 'NullPointer', value: 45, color: '#f44336' },
          { name: 'Network', value: 30, color: '#ff9800' },
          { name: 'UI Thread', value: 15, color: '#ffeb3b' },
          { name: 'Memory', value: 10, color: '#4caf50' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOverview = (crashes) => {
    const totalCrashes = crashes.length;
    const uniqueUsers = new Set(crashes.map(c => c.user_id)).size;
    const fatalCrashes = crashes.filter(c => c.severity === 'fatal').length;
    
    // Calculer le crash-free rate (simulé)
    const totalSessions = 1000; // À remplacer par vraies données
    const crashFreeRate = ((totalSessions - fatalCrashes) / totalSessions) * 100;
    
    // Erreur la plus fréquente
    const errorCount = {};
    crashes.forEach(crash => {
      errorCount[crash.error_type] = (errorCount[crash.error_type] || 0) + 1;
    });
    const topError = Object.entries(errorCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucune';

    return {
      totalCrashes,
      affectedUsers: uniqueUsers,
      crashFreeRate: crashFreeRate.toFixed(1),
      topError
    };
  };

  const generateTrends = (crashes) => {
    // Grouper par heure pour les dernières 24h
    const hourlyData = {};
    crashes.forEach(crash => {
      const hour = crash.timestamp.toISOString().substring(0, 13);
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return Object.entries(hourlyData)
      .map(([hour, count]) => ({
        time: new Date(hour).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        crashes: count
      }))
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .slice(-12); // 12 dernières heures
  };

  const analyzeErrorTypes = (crashes) => {
    const typeCount = {};
    crashes.forEach(crash => {
      typeCount[crash.error_type] = (typeCount[crash.error_type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([type, count]) => ({ name: type, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const generateMockCrashes = () => {
    const mockCrashes = [
      {
        id: '1',
        error_type: 'NullPointerException',
        message: 'Attempt to invoke virtual method on null object',
        severity: 'fatal',
        platform: 'Android',
        app_version: '1.2.3',
        user_id: 'user_123',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        stack_trace: 'at com.balaan.MainActivity.onCreate(MainActivity.java:45)'
      },
      {
        id: '2',
        error_type: 'NetworkException',
        message: 'Unable to resolve host firebase.com',
        severity: 'non-fatal',
        platform: 'iOS',
        app_version: '1.2.3',
        user_id: 'user_456',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        stack_trace: 'at URLSession.dataTask'
      }
    ];
    return mockCrashes;
  };

  const generateMockTrends = () => {
    return [
      { time: '09:00', crashes: 2 },
      { time: '10:00', crashes: 1 },
      { time: '11:00', crashes: 4 },
      { time: '12:00', crashes: 0 },
      { time: '13:00', crashes: 3 },
      { time: '14:00', crashes: 1 },
      { time: '15:00', crashes: 2 }
    ];
  };

  const exportCrashData = () => {
    const exportData = crashData.crashes.map(crash => ({
      timestamp: crash.timestamp.toLocaleString('fr-FR'),
      error_type: crash.error_type,
      message: crash.message,
      severity: crash.severity,
      platform: crash.platform,
      app_version: crash.app_version,
      user_id: crash.user_id
    }));

    exportToCSV(exportData, `crashes_balaan_${timeFilter}`);
    trackAdminAction('export_crash_data', 'crash_monitoring', { time_filter: timeFilter });
  };

  const generateTestData = async () => {
    try {
      setLoading(true);
      const success = await generateTestCrashData();
      if (success) {
        toast.success('🧪 Données de test générées !');
        await loadCrashData(); // Recharger les données
        trackAdminAction('generate_test_crash_data', 'crash_monitoring');
      } else {
        toast.error('❌ Erreur génération données test');
      }
    } catch (error) {
      console.error('Erreur génération test:', error);
      toast.error('❌ Erreur génération données test');
    } finally {
      setLoading(false);
    }
  };

  const viewCrashDetail = (crash) => {
    setSelectedCrash(crash);
    setDetailDialog(true);
    trackAdminAction('view_crash_detail', 'crash_monitoring', { crash_id: crash.id });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Chargement des données de crash...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Monitoring des Crashes</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Période</InputLabel>
            <Select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              label="Période"
            >
              <MenuItem value="1h">Dernière heure</MenuItem>
              <MenuItem value="24h">Dernières 24h</MenuItem>
              <MenuItem value="7d">7 derniers jours</MenuItem>
              <MenuItem value="30d">30 derniers jours</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={exportCrashData}
          >
            Exporter
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<BugReport />}
            onClick={generateTestData}
            disabled={loading}
          >
            Générer Test
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCrashData}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography color="textSecondary">Total Crashes</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {crashData.overview.totalCrashes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ color: 'warning.main', mr: 1 }} />
                <Typography color="textSecondary">Utilisateurs Affectés</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {crashData.overview.affectedUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography color="textSecondary">Taux Sans Crash</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {crashData.overview.crashFreeRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BugReport sx={{ color: 'info.main', mr: 1 }} />
                <Typography color="textSecondary">Erreur Principale</Typography>
              </Box>
              <Typography variant="h6" color="info.main" sx={{ fontSize: '1.2rem' }}>
                {crashData.overview.topError}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Graphique des tendances */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des crashes ({timeFilter})
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={crashData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="crashes" 
                    stroke="#f44336" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Types d'erreurs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Types d'erreurs
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={crashData.errorTypes}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {crashData.errorTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Liste des crashes récents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Crashes récents
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Type d'erreur</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Sévérité</TableCell>
                      <TableCell>Plateforme</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {crashData.crashes.slice(0, 10).map((crash) => (
                      <TableRow key={crash.id}>
                        <TableCell>
                          {crash.timestamp.toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell>{crash.error_type}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {crash.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={crash.severity} 
                            color={crash.severity === 'fatal' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {crash.platform === 'Android' ? <Phone /> : <Computer />}
                          {crash.platform}
                        </TableCell>
                        <TableCell>{crash.app_version}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => viewCrashDetail(crash)}
                            title="Voir détails"
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog détail crash */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails du Crash - {selectedCrash?.error_type}
        </DialogTitle>
        <DialogContent>
          {selectedCrash && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Timestamp:</Typography>
                  <Typography variant="body2">{selectedCrash.timestamp.toLocaleString('fr-FR')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Sévérité:</Typography>
                  <Chip label={selectedCrash.severity} color={selectedCrash.severity === 'fatal' ? 'error' : 'warning'} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Plateforme:</Typography>
                  <Typography variant="body2">{selectedCrash.platform}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Version:</Typography>
                  <Typography variant="body2">{selectedCrash.app_version}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Message d'erreur:</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {selectedCrash.message}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Stack Trace:</Typography>
                  <Typography 
                    variant="body2" 
                    component="pre"
                    sx={{ 
                      bgcolor: 'grey.900', 
                      color: 'white', 
                      p: 2, 
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    {selectedCrash.stack_trace || 'Stack trace non disponible'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
