import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  CircularProgress,
  Chip,
  Button,
  TextField,
  MenuItem
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Business,
  Euro,
  Star,
  Assessment,
  DateRange
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalSalons: 0,
    avgRating: 0,
    reservations: 0
  });
  
  const [chartData, setChartData] = useState({
    userGrowth: [],
    salonGrowth: [], 
    revenue: [],
    cityDistribution: [],
    categoryDistribution: []
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Charger les données en parallèle
      const [usersData, salonsData, reservationsData] = await Promise.all([
        loadUsersAnalytics(),
        loadSalonsAnalytics(),
        loadReservationsAnalytics()
      ]);

      // Calculer les métriques
      setMetrics({
        totalRevenue: 15420, // Simulation
        totalUsers: usersData.total,
        totalSalons: salonsData.total,
        avgRating: salonsData.avgRating,
        reservations: reservationsData.total
      });

      // Préparer les données de graphiques
      setChartData({
        userGrowth: generateGrowthData('users', 30),
        salonGrowth: generateGrowthData('salons', 30),
        revenue: generateRevenueData(30),
        cityDistribution: salonsData.cityDistribution,
        categoryDistribution: salonsData.categoryDistribution
      });

    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersAnalytics = async () => {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    return {
      total: usersSnapshot.size
    };
  };

  const loadSalonsAnalytics = async () => {
    const salonsRef = collection(db, 'salons');
    const salonsSnapshot = await getDocs(salonsRef);
    
    const salons = salonsSnapshot.docs.map(doc => doc.data());
    
    // Calcul note moyenne
    const notedSalons = salons.filter(s => s.note_moyenne);
    const avgRating = notedSalons.length > 0 
      ? notedSalons.reduce((sum, s) => sum + s.note_moyenne, 0) / notedSalons.length 
      : 0;

    // Distribution par ville
    const cityCount = {};
    salons.forEach(salon => {
      const city = salon.ville || 'Non défini';
      cityCount[city] = (cityCount[city] || 0) + 1;
    });

    const cityDistribution = Object.entries(cityCount)
      .map(([city, count]) => ({ name: city, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Distribution par catégorie
    const categoryCount = {};
    salons.forEach(salon => {
      const categories = salon.categoriesPrincipales || [];
      categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });

    const categoryDistribution = Object.entries(categoryCount)
      .map(([category, count]) => ({ name: category, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      total: salons.length,
      avgRating: avgRating,
      cityDistribution,
      categoryDistribution
    };
  };

  const loadReservationsAnalytics = async () => {
    // Simulation - dans un vrai projet, tu ferais une requête collection group
    return {
      total: 1247 // Simulation
    };
  };

  const generateGrowthData = (type, days) => {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulation de croissance
      const baseValue = type === 'users' ? 50 : 20;
      const growth = Math.floor(Math.random() * 10) + baseValue - (i * 0.5);
      
      data.push({
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        value: Math.max(0, growth)
      });
    }
    return data;
  };

  const generateRevenueData = (days) => {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulation de revenus
      const baseRevenue = 200;
      const variance = Math.floor(Math.random() * 300) + baseRevenue;
      
      data.push({
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        revenue: variance
      });
    }
    return data;
  };

  const StatCard = ({ title, value, icon, color, change, changeType }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {loading ? <CircularProgress size={20} /> : value}
            </Typography>
            {change && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {changeType === 'up' ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={changeType === 'up' ? 'success.main' : 'error.main'}
                >
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Analytics & Rapports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analyse détaillée de la performance de votre plateforme
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="7days">7 derniers jours</MenuItem>
            <MenuItem value="30days">30 derniers jours</MenuItem>
            <MenuItem value="90days">90 derniers jours</MenuItem>
            <MenuItem value="1year">1 an</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Revenus totaux"
            value={`${metrics.totalRevenue.toLocaleString()}€`}
            icon={<Euro />}
            color="success.main"
            change="+12.5%"
            changeType="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Utilisateurs"
            value={metrics.totalUsers.toLocaleString()}
            icon={<People />}
            color="primary.main"
            change="+8.2%"
            changeType="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Salons"
            value={metrics.totalSalons.toLocaleString()}
            icon={<Business />}
            color="info.main"
            change="+15.3%"
            changeType="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Note moyenne"
            value={metrics.avgRating.toFixed(1)}
            icon={<Star />}
            color="warning.main"
            change="+0.2"
            changeType="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Réservations"
            value={metrics.reservations.toLocaleString()}
            icon={<Assessment />}
            color="error.main"
            change="+24.1%"
            changeType="up"
          />
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3}>
        {/* Croissance des utilisateurs */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Croissance des Utilisateurs
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par ville */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Salons par Ville
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.cityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.cityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {chartData.cityDistribution.map((entry, index) => (
                  <Chip
                    key={entry.name}
                    label={`${entry.name}: ${entry.value}`}
                    size="small"
                    sx={{ 
                      m: 0.5, 
                      backgroundColor: COLORS[index % COLORS.length],
                      color: 'white'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenus */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Évolution des Revenus
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}€`, 'Revenus']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00C49F" 
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Catégories populaires */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Catégories Populaires
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Résumé des performances */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Résumé des Performances
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      +28%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Croissance mensuelle
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                      <People />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      85%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taux de rétention
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                      <Star />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      4.8/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Satisfaction client
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
