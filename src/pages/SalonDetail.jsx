/**
 * 🏢 DÉTAIL SALON - Vue complète avec revenus et promos
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Euro,
  People,
  Star,
  Phone,
  Email,
  LocationOn,
  Schedule,
  TrendingUp,
  Receipt,
  LocalOffer,
  History,
  Edit,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackPageView, trackSalonAction } from '../utils/analytics';
import { exportToCSV } from '../utils/export';
import toast from 'react-hot-toast';

const COLORS = ['#D4AF37', '#F5E6A3', '#8B7355', '#A68B5B'];

export default function SalonDetail() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [promoUsage, setPromoUsage] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageRating: 0,
    promoDiscounts: 0,
    netRevenue: 0
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (salonId) {
      loadSalonData();
      trackPageView(`Salon Detail - ${salonId}`, `/salon/${salonId}`);
    }
  }, [salonId]);

  const loadSalonData = async () => {
    try {
      setLoading(true);

      // Charger les données du salon
      const salonDoc = await getDoc(doc(db, 'salons', salonId));
      if (!salonDoc.exists()) {
        toast.error('Salon introuvable');
        navigate('/salons');
        return;
      }

      const salonData = { id: salonDoc.id, ...salonDoc.data() };
      setSalon(salonData);

      // Charger les réservations du salon
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(
        bookingsRef,
        where('salon_id', '==', salonId),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      }));
      setBookings(bookingsData);

      // Charger l'utilisation des promos
      const promoQuery = query(
        collection(db, 'promo_usage'),
        where('salon_id', '==', salonId),
        orderBy('used_at', 'desc')
      );
      const promoSnapshot = await getDocs(promoQuery);
      const promoData = promoSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        used_at: doc.data().used_at?.toDate() || new Date()
      }));
      setPromoUsage(promoData);

      // Calculer les statistiques
      calculateStats(bookingsData, promoData);
      generateChartData(bookingsData);

    } catch (error) {
      console.error('Erreur chargement salon:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData, promoData) => {
    const totalRevenue = bookingsData
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const totalBookings = bookingsData.filter(b => b.status === 'completed').length;
    
    const ratingsSum = bookingsData
      .filter(b => b.rating > 0)
      .reduce((sum, b) => sum + b.rating, 0);
    const ratingsCount = bookingsData.filter(b => b.rating > 0).length;
    const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    const promoDiscounts = promoData.reduce((sum, p) => sum + (p.discount_amount || 0), 0);
    const netRevenue = totalRevenue - promoDiscounts;

    setStats({
      totalRevenue,
      totalBookings,
      averageRating,
      promoDiscounts,
      netRevenue
    });
  };

  const generateChartData = (bookingsData) => {
    // Grouper par mois
    const monthlyData = {};
    bookingsData.forEach(booking => {
      if (booking.status === 'completed') {
        const month = booking.created_at.toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, bookings: 0 };
        }
        monthlyData[month].revenue += booking.amount || 0;
        monthlyData[month].bookings += 1;
      }
    });

    const chartData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        bookings: data.bookings
      }))
      .slice(-6); // 6 derniers mois

    setChartData(chartData);
  };

  const exportSalonData = () => {
    const exportData = bookings.map(booking => ({
      date: booking.created_at.toLocaleDateString('fr-FR'),
      client_nom: booking.client_name || 'N/A',
      service: booking.service_name || 'N/A',
      montant: booking.amount || 0,
      statut: booking.status || 'N/A',
      note: booking.rating || 'N/A'
    }));

    exportToCSV(exportData, `salon_${salon?.nom}_reservations`);
    trackSalonAction('export_bookings', salonId, salon);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Chargement des données du salon...</Typography>
      </Box>
    );
  }

  if (!salon) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Salon introuvable</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/salons')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {salon.nom}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Receipt />}
          onClick={exportSalonData}
          sx={{ mr: 1 }}
        >
          Exporter
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Infos principales */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6">{salon.nom}</Typography>
                  <Chip 
                    label={salon.kyc_status || 'pending'} 
                    color={salon.kyc_status === 'approved' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemAvatar><Email /></ListItemAvatar>
                  <ListItemText primary={salon.email} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar><Phone /></ListItemAvatar>
                  <ListItemText primary={salon.telephone} />
                </ListItem>
                <ListItem>
                  <ListItemAvatar><LocationOn /></ListItemAvatar>
                  <ListItemText 
                    primary={`${salon.adresse?.ville || 'N/A'}`}
                    secondary={salon.adresse?.code_postal}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar><Star /></ListItemAvatar>
                  <ListItemText 
                    primary={`${stats.averageRating.toFixed(1)}/5`}
                    secondary={`${stats.totalBookings} avis`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques financières */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    CA Total
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {stats.totalRevenue.toLocaleString()}€
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Réservations
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {stats.totalBookings}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Promos utilisées
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    -{stats.promoDiscounts.toLocaleString()}€
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    CA Net
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {stats.netRevenue.toLocaleString()}€
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graphique évolution */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution du chiffre d'affaires
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value + '€', 'CA']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Historique des réservations */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dernières réservations
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.slice(0, 10).map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {booking.created_at.toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{booking.client_name || 'N/A'}</TableCell>
                        <TableCell>{booking.service_name || 'N/A'}</TableCell>
                        <TableCell>{booking.amount || 0}€</TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.status} 
                            color={booking.status === 'completed' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Utilisation des promos */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Promos utilisées ({promoUsage.length})
              </Typography>
              <List dense>
                {promoUsage.slice(0, 5).map((promo) => (
                  <ListItem key={promo.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <LocalOffer />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={promo.promo_code || 'PROMO'}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            -{promo.discount_amount || 0}€
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {promo.used_at.toLocaleDateString('fr-FR')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              {promoUsage.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                  Aucune promo utilisée
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
