import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Business,
  People,
  VerifiedUser,
  Euro,
  TrendingUp,
  Warning,
  CheckCircle,
  Pending,
  Visibility,
  SupportAgent,
  Today
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSalons: 0,
    totalUsers: 0,
    pendingKyc: 0,
    totalRevenue: 0,
    salonsApproved: 0,
    supportTickets: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [kycPieData, setKycPieData] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les statistiques en parallèle
      const [salonsData, usersData, kycData, supportData] = await Promise.all([
        loadSalonsStats(),
        loadUsersStats(), 
        loadKycStats(),
        loadSupportStats()
      ]);

      setStats({
        totalSalons: salonsData.total,
        salonsApproved: salonsData.approved,
        totalUsers: usersData.total,
        pendingKyc: kycData.pending,
        supportTickets: supportData.total,
        totalRevenue: 12540 // Simulation
      });

      // Données pour graphiques
      setChartData([
        { name: 'Jan', salons: 65, users: 120 },
        { name: 'Fév', salons: 89, users: 156 },
        { name: 'Mar', salons: 123, users: 234 },
        { name: 'Avr', salons: 145, users: 298 },
        { name: 'Mai', salons: 167, users: 345 },
        { name: 'Juin', salons: 189, users: 412 }
      ]);

      setKycPieData([
        { name: 'Approuvés', value: kycData.approved },
        { name: 'En attente', value: kycData.pending },
        { name: 'Rejetés', value: kycData.rejected }
      ]);

      // Activité récente simulée
      setRecentActivity([
        { type: 'salon', action: 'Nouveau salon créé', name: 'Beauty Salon Paris', time: '2 min' },
        { type: 'kyc', action: 'KYC soumis', name: 'Coiffure Deluxe', time: '5 min' },
        { type: 'user', action: 'Nouvel utilisateur', name: 'Marie Dubois', time: '8 min' },
        { type: 'support', action: 'Ticket support', name: 'Problème réservation', time: '12 min' },
        { type: 'salon', action: 'Salon approuvé', name: 'Nails & Beauty', time: '15 min' }
      ]);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalonsStats = async () => {
    const salonsRef = collection(db, 'salons');
    const [allSalons, approvedSalons] = await Promise.all([
      getDocs(salonsRef),
      getDocs(query(salonsRef, where('isApproved', '==', true)))
    ]);
    
    return {
      total: allSalons.size,
      approved: approvedSalons.size
    };
  };

  const loadUsersStats = async () => {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    return {
      total: usersSnapshot.size
    };
  };

  const loadKycStats = async () => {
    const salonsRef = collection(db, 'salons');
    const salonsSnapshot = await getDocs(salonsRef);
    
    let pending = 0, approved = 0, rejected = 0;
    
    salonsSnapshot.forEach(doc => {
      const data = doc.data();
      // Corriger les valeurs réelles de Firebase
      if (data.kyc_status === 'under_review' || data.kyc_status === 'pending') pending++;
      else if (data.kyc_status === 'approved' || data.kyc_status === 'verified') approved++;
      else if (data.kyc_status === 'rejected' || data.kyc_status === 'denied') rejected++;
    });
    
    console.log('🔍 KYC Stats:', { pending, approved, rejected });
    return { pending, approved, rejected };
  };

  const loadSupportStats = async () => {
    const supportRef = collection(db, 'support_tickets');
    const supportSnapshot = await getDocs(supportRef);
    
    return {
      total: supportSnapshot.size
    };
  };

  const StatCard = ({ title, value, icon, color, onClick, subtitle }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {loading ? <CircularProgress size={20} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'salon': return <Business color="primary" />;
      case 'kyc': return <VerifiedUser color="warning" />;
      case 'user': return <People color="success" />;
      case 'support': return <SupportAgent color="error" />;
      default: return <Today />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Dashboard Administrateur
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vue d'ensemble de votre plateforme Balaan
        </Typography>
      </Box>

      {/* Cartes statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Salons totaux"
            value={stats.totalSalons}
            subtitle={`${stats.salonsApproved} approuvés`}
            icon={<Business />}
            color="primary.main"
            onClick={() => navigate('/salons')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers}
            subtitle="Total inscrits"
            icon={<People />}
            color="success.main"
            onClick={() => navigate('/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="KYC en attente"
            value={stats.pendingKyc}
            subtitle="À vérifier"
            icon={<VerifiedUser />}
            color="warning.main"
            onClick={() => navigate('/kyc')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Support"
            value={stats.supportTickets}
            subtitle="Tickets ouverts"
            icon={<SupportAgent />}
            color="error.main"
            onClick={() => navigate('/support')}
          />
        </Grid>
      </Grid>

      {/* Graphiques et activité */}
      <Grid container spacing={3}>
        {/* Graphique croissance */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Croissance des Salons & Utilisateurs
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="salons" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Statut KYC */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Statut KYC
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={kycPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {kycPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {kycPieData.map((entry, index) => (
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

        {/* Activité récente */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Activité Récente
                </Typography>
                <Button size="small" onClick={() => navigate('/analytics')}>
                  Voir tout
                </Button>
              </Box>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.action}
                        secondary={activity.name}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="caption" color="textSecondary">
                          {activity.time}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
