/**
 * 🎫 GESTION DES PROMOS - Tracking et remboursements
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add,
  LocalOffer,
  Euro,
  People,
  TrendingDown,
  History,
  Payment,
  Receipt,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import { collection, query, getDocs, addDoc, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackPageView, trackAdminAction } from '../utils/analytics';
import { exportToCSV } from '../utils/export';
import toast from 'react-hot-toast';

export default function PromoManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [promos, setPromos] = useState([]);
  const [promoUsage, setPromoUsage] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    type: 'percentage', // percentage ou fixed
    value: 0,
    description: '',
    max_uses: 100,
    expires_at: '',
    salon_impact: true // Si ça impacte les revenus salon
  });

  const [stats, setStats] = useState({
    totalPromos: 0,
    activePromos: 0,
    totalUsage: 0,
    totalDiscounts: 0,
    pendingReimbursements: 0
  });

  useEffect(() => {
    loadAllData();
    trackPageView('Promo Management', '/promos');
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Charger les promos
      const promosRef = collection(db, 'promos');
      const promosSnapshot = await getDocs(query(promosRef, orderBy('created_at', 'desc')));
      const promosData = promosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        expires_at: doc.data().expires_at?.toDate() || null
      }));
      setPromos(promosData);

      // Charger l'utilisation des promos
      const usageRef = collection(db, 'promo_usage');
      const usageSnapshot = await getDocs(query(usageRef, orderBy('used_at', 'desc')));
      const usageData = usageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        used_at: doc.data().used_at?.toDate() || new Date()
      }));
      setPromoUsage(usageData);

      // Charger les remboursements
      const reimbursementsRef = collection(db, 'salon_reimbursements');
      const reimbursementsSnapshot = await getDocs(query(reimbursementsRef, orderBy('created_at', 'desc')));
      const reimbursementsData = reimbursementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      }));
      setReimbursements(reimbursementsData);

      // Calculer les stats
      calculateStats(promosData, usageData, reimbursementsData);

    } catch (error) {
      console.error('Erreur chargement promos:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (promosData, usageData, reimbursementsData) => {
    const activePromos = promosData.filter(p => 
      p.status === 'active' && 
      (!p.expires_at || p.expires_at > new Date())
    ).length;

    const totalDiscounts = usageData.reduce((sum, usage) => 
      sum + (usage.discount_amount || 0), 0
    );

    const pendingReimbursements = reimbursementsData
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    setStats({
      totalPromos: promosData.length,
      activePromos,
      totalUsage: usageData.length,
      totalDiscounts,
      pendingReimbursements
    });
  };

  const createPromo = async () => {
    try {
      if (!newPromo.code || !newPromo.value) {
        toast.error('Code et valeur requis');
        return;
      }

      const promoData = {
        ...newPromo,
        status: 'active',
        uses_count: 0,
        created_at: new Date(),
        expires_at: newPromo.expires_at ? new Date(newPromo.expires_at) : null
      };

      await addDoc(collection(db, 'promos'), promoData);
      
      toast.success('Promo créée avec succès');
      trackAdminAction('promo_create', 'promo_management', { code: newPromo.code });
      
      setCreateDialog(false);
      setNewPromo({
        code: '',
        type: 'percentage',
        value: 0,
        description: '',
        max_uses: 100,
        expires_at: '',
        salon_impact: true
      });
      
      loadAllData();
    } catch (error) {
      console.error('Erreur création promo:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const processReimbursement = async (salonId, amount, reason) => {
    try {
      const reimbursementData = {
        salon_id: salonId,
        amount: amount,
        reason: reason,
        status: 'pending',
        created_at: new Date(),
        processed_at: null
      };

      await addDoc(collection(db, 'salon_reimbursements'), reimbursementData);
      
      toast.success('Remboursement programmé');
      trackAdminAction('reimbursement_create', 'promo_management', { salon_id: salonId, amount });
      
      loadAllData();
    } catch (error) {
      console.error('Erreur remboursement:', error);
      toast.error('Erreur lors du remboursement');
    }
  };

  const exportPromoData = () => {
    let exportData = [];
    
    switch (activeTab) {
      case 0: // Promos
        exportData = promos.map(promo => ({
          code: promo.code,
          type: promo.type,
          valeur: promo.value,
          utilise: promo.uses_count || 0,
          max_utilisations: promo.max_uses,
          statut: promo.status,
          expire_le: promo.expires_at?.toLocaleDateString('fr-FR') || 'Jamais',
          cree_le: promo.created_at.toLocaleDateString('fr-FR')
        }));
        exportToCSV(exportData, 'promos_balaan');
        break;
        
      case 1: // Utilisation
        exportData = promoUsage.map(usage => ({
          code_promo: usage.promo_code,
          salon_nom: usage.salon_name,
          client_email: usage.client_email,
          montant_remise: usage.discount_amount,
          utilise_le: usage.used_at.toLocaleDateString('fr-FR')
        }));
        exportToCSV(exportData, 'utilisation_promos_balaan');
        break;
        
      case 2: // Remboursements
        exportData = reimbursements.map(reimb => ({
          salon_id: reimb.salon_id,
          montant: reimb.amount,
          raison: reimb.reason,
          statut: reimb.status,
          cree_le: reimb.created_at.toLocaleDateString('fr-FR')
        }));
        exportToCSV(exportData, 'remboursements_salons_balaan');
        break;
    }
    
    trackAdminAction('export_promo_data', 'promo_management', { tab: activeTab });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Chargement des données promos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des Promos</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Receipt />}
            onClick={exportPromoData}
            sx={{ mr: 1 }}
          >
            Exporter
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
          >
            Créer Promo
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Promos
              </Typography>
              <Typography variant="h5">{stats.totalPromos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Promos Actives
              </Typography>
              <Typography variant="h5" color="success.main">
                {stats.activePromos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Utilisations
              </Typography>
              <Typography variant="h5" color="info.main">
                {stats.totalUsage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Remises Totales
              </Typography>
              <Typography variant="h5" color="warning.main">
                -{stats.totalDiscounts.toLocaleString()}€
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                À Rembourser
              </Typography>
              <Typography variant="h5" color="error.main">
                {stats.pendingReimbursements.toLocaleString()}€
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Promos" />
          <Tab label="Utilisation" />
          <Tab label="Remboursements" />
        </Tabs>

        <CardContent>
          {/* Tab 0: Liste des promos */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Valeur</TableCell>
                    <TableCell>Utilisé</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Expire</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promos.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{promo.code}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {promo.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={promo.type === 'percentage' ? 'Pourcentage' : 'Fixe'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value}€`}
                      </TableCell>
                      <TableCell>
                        {promo.uses_count || 0} / {promo.max_uses}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={promo.status} 
                          color={promo.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {promo.expires_at ? promo.expires_at.toLocaleDateString('fr-FR') : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab 1: Utilisation des promos */}
          {activeTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code Promo</TableCell>
                    <TableCell>Salon</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Remise</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promoUsage.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{usage.promo_code}</TableCell>
                      <TableCell>{usage.salon_name || 'N/A'}</TableCell>
                      <TableCell>{usage.client_email || 'N/A'}</TableCell>
                      <TableCell>-{usage.discount_amount || 0}€</TableCell>
                      <TableCell>{usage.used_at.toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Tooltip title="Programmer remboursement salon">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => processReimbursement(
                              usage.salon_id, 
                              usage.discount_amount, 
                              `Remboursement promo ${usage.promo_code}`
                            )}
                          >
                            <Payment />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab 2: Remboursements */}
          {activeTab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Salon ID</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Raison</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reimbursements.map((reimb) => (
                    <TableRow key={reimb.id}>
                      <TableCell>{reimb.salon_id}</TableCell>
                      <TableCell>{reimb.amount}€</TableCell>
                      <TableCell>{reimb.reason}</TableCell>
                      <TableCell>
                        <Chip 
                          label={reimb.status} 
                          color={reimb.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{reimb.created_at.toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        {reimb.status === 'pending' && (
                          <Button size="small" color="success">
                            Marquer payé
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog création promo */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une nouvelle promo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Code promo"
                value={newPromo.code}
                onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                placeholder="BALAAN20"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newPromo.type}
                  onChange={(e) => setNewPromo({...newPromo, type: e.target.value})}
                >
                  <MenuItem value="percentage">Pourcentage</MenuItem>
                  <MenuItem value="fixed">Montant fixe</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={newPromo.type === 'percentage' ? 'Pourcentage' : 'Montant (€)'}
                type="number"
                value={newPromo.value}
                onChange={(e) => setNewPromo({...newPromo, value: parseFloat(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newPromo.description}
                onChange={(e) => setNewPromo({...newPromo, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Utilisations max"
                type="number"
                value={newPromo.max_uses}
                onChange={(e) => setNewPromo({...newPromo, max_uses: parseInt(e.target.value)})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Date d'expiration"
                type="date"
                value={newPromo.expires_at}
                onChange={(e) => setNewPromo({...newPromo, expires_at: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Annuler</Button>
          <Button onClick={createPromo} variant="contained">Créer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
