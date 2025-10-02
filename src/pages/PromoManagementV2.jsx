/**
 * 🎫 GESTION DES PROMOS GLOBALES ADMIN - Version 2.0
 * Gère les promotions globales Balaan avec compensation automatique
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
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
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
  Visibility,
  CheckCircle,
  Warning,
  Store
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  orderBy, 
  where,
  Timestamp,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackPageView, trackAdminAction } from '../utils/analytics';
import { exportToCSV } from '../utils/export';
import toast from 'react-hot-toast';

export default function PromoManagementV2() {
  const [activeTab, setActiveTab] = useState(0);
  const [promos, setPromos] = useState([]);
  const [compensations, setCompensations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  
  const [newPromo, setNewPromo] = useState({
    nom_promotion: '',
    description: '',
    type_reduction: 'pourcentage',
    valeur_reduction: 0,
    type_promotion: 'global', // global ou salon
    auto_apply: true,
    code_promo: '',
    utilisation_max: 1000,
    montant_minimum: 0,
    date_debut: '',
    date_fin: '',
    app_vertical: 'beauty',
    allow_cumul: false,
  });

  const [stats, setStats] = useState({
    totalPromosGlobales: 0,
    promosActives: 0,
    totalUtilisations: 0,
    totalCompensations: 0,
    compensationsPendantes: 0
  });

  useEffect(() => {
    loadAllData();
    trackPageView('Promo Management V2', '/admin/promos');
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // ✅ Charger les promos GLOBALES depuis la collection 'promotions'
      const promosRef = collection(db, 'promotions');
      const promosQuery = query(
        promosRef,
        where('type_promotion', '==', 'global'),
        where('created_by', '==', 'admin'),
        orderBy('created_time', 'desc')
      );
      
      const promosSnapshot = await getDocs(promosQuery);
      const promosData = promosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date_debut: doc.data().date_debut?.toDate() || null,
        date_fin: doc.data().date_fin?.toDate() || null,
        created_time: doc.data().created_time?.toDate() || new Date()
      }));
      setPromos(promosData);

      // ✅ Calculer les compensations depuis les réservations
      await calculateCompensations();

      // Calculer les stats
      calculateStats(promosData);

    } catch (error) {
      console.error('❌ Erreur chargement promos:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompensations = async () => {
    try {
      // ✅ Récupérer TOUTES les réservations avec compensation Balaan
      // Utiliser collectionGroup pour chercher dans toutes les sous-collections 'reservation'
      const reservationsQuery = query(
        collectionGroup(db, 'reservation'),
        where('PromotionApplied.balaan_compensated', '==', true),
        where('status', '==', 'Terminée')
      );

      const reservationsSnapshot = await getDocs(reservationsQuery);
      
      // Grouper par salon
      const compensationsBySalon = {};
      
      reservationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const salonId = data.salon_ref?.id || 'unknown';
        const compensationAmount = data.PromotionApplied?.compensation_amount || 0;
        const promoName = data.PromotionApplied?.promotion_name || 'Promo inconnue';
        
        if (!compensationsBySalon[salonId]) {
          compensationsBySalon[salonId] = {
            salonId,
            salonName: data.salon_name || 'Salon inconnu',
            totalCompensation: 0,
            reservations: [],
            status: 'pending'
          };
        }
        
        compensationsBySalon[salonId].totalCompensation += compensationAmount;
        compensationsBySalon[salonId].reservations.push({
          id: doc.id,
          date: data.DateOfReservation?.toDate() || new Date(),
          clientName: data.display_name || 'Client',
          amount: compensationAmount,
          promoName
        });
      });

      setCompensations(Object.values(compensationsBySalon));
      
    } catch (error) {
      console.error('❌ Erreur calcul compensations:', error);
    }
  };

  const calculateStats = (promosData) => {
    const now = new Date();
    const promosActives = promosData.filter(p => 
      p.est_active && 
      (!p.date_fin || p.date_fin > now)
    ).length;

    const totalUtilisations = promosData.reduce((sum, p) => 
      sum + (p.utilisation_actuelle || 0), 0
    );

    const totalCompensations = compensations.reduce((sum, c) => 
      sum + c.totalCompensation, 0
    );

    const compensationsPendantes = compensations
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.totalCompensation, 0);

    setStats({
      totalPromosGlobales: promosData.length,
      promosActives,
      totalUtilisations,
      totalCompensations,
      compensationsPendantes
    });
  };

  const createPromo = async () => {
    try {
      // ✅ Validation
      if (!newPromo.nom_promotion || !newPromo.description) {
        toast.error('Nom et description requis');
        return;
      }

      if (newPromo.valeur_reduction <= 0) {
        toast.error('Valeur de réduction invalide');
        return;
      }

      if (!newPromo.auto_apply && !newPromo.code_promo) {
        toast.error('Code promo requis si non automatique');
        return;
      }

      // ✅ Créer la promo dans la collection 'promotions'
      const promoData = {
        nom_promotion: newPromo.nom_promotion,
        description: newPromo.description,
        type_reduction: newPromo.type_reduction,
        valeur_reduction: parseFloat(newPromo.valeur_reduction),
        type_promotion: 'global', // ✅ TOUJOURS global pour admin
        created_by: 'admin',      // ✅ Créé par admin
        auto_apply: newPromo.auto_apply,
        code_promo: newPromo.auto_apply ? null : newPromo.code_promo.toUpperCase(),
        est_active: true,
        allow_cumul: newPromo.allow_cumul,
        utilisation_max: parseInt(newPromo.utilisation_max) || 0,
        utilisation_actuelle: 0,
        montant_minimum: parseFloat(newPromo.montant_minimum) || 0,
        date_debut: newPromo.date_debut ? Timestamp.fromDate(new Date(newPromo.date_debut)) : serverTimestamp(),
        date_fin: newPromo.date_fin ? Timestamp.fromDate(new Date(newPromo.date_fin)) : null,
        app_vertical: newPromo.app_vertical,
        salon_ref: null, // ✅ null pour promo globale
        clients_eligibles: [],
        prestations_eligibles: [],
        categories_eligibles: [],
        jours_semaine: [],
        heures_debut: null,
        heures_fin: null,
        created_time: serverTimestamp(),
        updated_time: serverTimestamp()
      };

      await addDoc(collection(db, 'promotions'), promoData);
      
      toast.success('✅ Promo globale créée !');
      trackAdminAction('promo_global_create', 'promo_management', { 
        nom: newPromo.nom_promotion,
        type: newPromo.type_reduction,
        valeur: newPromo.valeur_reduction
      });
      
      setCreateDialog(false);
      setNewPromo({
        nom_promotion: '',
        description: '',
        type_reduction: 'pourcentage',
        valeur_reduction: 0,
        type_promotion: 'global',
        auto_apply: true,
        code_promo: '',
        utilisation_max: 1000,
        montant_minimum: 0,
        date_debut: '',
        date_fin: '',
        app_vertical: 'beauty',
        allow_cumul: false,
      });
      
      loadAllData();
    } catch (error) {
      console.error('❌ Erreur création promo:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const markCompensationPaid = async (salonId) => {
    try {
      // Créer un document de remboursement
      const compensation = compensations.find(c => c.salonId === salonId);
      
      await addDoc(collection(db, 'salon_reimbursements'), {
        salon_id: salonId,
        salon_name: compensation.salonName,
        amount: compensation.totalCompensation,
        currency: 'FDJ',
        reservations_count: compensation.reservations.length,
        status: 'paid',
        paid_at: serverTimestamp(),
        created_at: serverTimestamp(),
        created_by: 'admin',
        payment_method: 'manual', // À adapter selon votre système
        notes: `Compensation promos globales - ${compensation.reservations.length} réservations`
      });

      toast.success(`✅ Remboursement de ${compensation.totalCompensation} FDJ marqué comme payé`);
      trackAdminAction('compensation_paid', 'promo_management', { 
        salon_id: salonId,
        amount: compensation.totalCompensation
      });

      loadAllData();
    } catch (error) {
      console.error('❌ Erreur marquage paiement:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const exportCompensations = () => {
    const exportData = compensations.map(comp => ({
      salon_id: comp.salonId,
      salon_nom: comp.salonName,
      montant_total: comp.totalCompensation,
      nombre_reservations: comp.reservations.length,
      statut: comp.status === 'pending' ? 'En attente' : 'Payé',
      devise: 'FDJ'
    }));
    
    exportToCSV(exportData, `compensations_balaan_${new Date().toISOString().split('T')[0]}`);
    toast.success('Export CSV généré');
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          🎁 Gestion Promotions Globales
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Créez et gérez les promotions globales Balaan avec compensation automatique
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalOffer sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">{stats.totalPromosGlobales}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Promos Globales
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">{stats.promosActives}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Actives
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">{stats.totalUtilisations}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Utilisations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Euro sx={{ mr: 1, color: 'warning.dark' }} />
                <Typography variant="h6">{stats.compensationsPendantes.toFixed(0)}</Typography>
              </Box>
              <Typography variant="body2" color="warning.dark">
                FDJ à rembourser
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Promotions Globales" />
          <Tab label="Compensations Salons" />
        </Tabs>

        {/* Tab 0: Promotions */}
        {activeTab === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Promotions Globales Actives</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialog(true)}
              >
                Créer Promo Globale
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Valeur</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Utilisations</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promos.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {promo.nom_promotion}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {promo.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={promo.type_reduction === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {promo.type_reduction === 'pourcentage' 
                          ? `${promo.valeur_reduction}%` 
                          : `${promo.valeur_reduction} FDJ`}
                      </TableCell>
                      <TableCell>
                        {promo.auto_apply ? (
                          <Chip label="Auto" size="small" color="success" />
                        ) : (
                          <Chip label={promo.code_promo} size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.utilisation_actuelle || 0} / {promo.utilisation_max || '∞'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {promo.date_debut?.toLocaleDateString('fr-FR')} → {promo.date_fin?.toLocaleDateString('fr-FR') || '∞'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {promo.est_active && (!promo.date_fin || promo.date_fin > new Date()) ? (
                          <Chip label="Active" size="small" color="success" />
                        ) : (
                          <Chip label="Inactive" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Tab 1: Compensations */}
        {activeTab === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Compensations à verser aux salons</Typography>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                onClick={exportCompensations}
              >
                Exporter CSV
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Total à rembourser : <strong>{stats.compensationsPendantes.toFixed(0)} FDJ</strong>
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Salon</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Réservations</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compensations.map((comp) => (
                    <TableRow key={comp.salonId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Store sx={{ mr: 1, color: 'text.secondary' }} />
                          <div>
                            <Typography variant="body2" fontWeight={600}>
                              {comp.salonName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {comp.salonId}
                            </Typography>
                          </div>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="warning.main">
                          {comp.totalCompensation.toFixed(0)} FDJ
                        </Typography>
                      </TableCell>
                      <TableCell>{comp.reservations.length}</TableCell>
                      <TableCell>
                        {comp.status === 'pending' ? (
                          <Chip label="En attente" size="small" color="warning" />
                        ) : (
                          <Chip label="Payé" size="small" color="success" />
                        )}
                      </TableCell>
                      <TableCell>
                        {comp.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<Payment />}
                            onClick={() => markCompensationPaid(comp.salonId)}
                          >
                            Marquer payé
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
      </Card>

      {/* Dialog Création Promo */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>🎁 Créer une Promotion Globale Balaan</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Les promotions globales sont compensées par Balaan. Le montant sera déduit de vos revenus.
          </Alert>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de la promotion"
                value={newPromo.nom_promotion}
                onChange={(e) => setNewPromo({ ...newPromo, nom_promotion: e.target.value })}
                placeholder="Ex: Black Friday Balaan"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newPromo.description}
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                placeholder="Ex: 20% de réduction sur toutes les prestations"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type de réduction</InputLabel>
                <Select
                  value={newPromo.type_reduction}
                  onChange={(e) => setNewPromo({ ...newPromo, type_reduction: e.target.value })}
                >
                  <MenuItem value="pourcentage">Pourcentage</MenuItem>
                  <MenuItem value="montant_fixe">Montant fixe</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label={newPromo.type_reduction === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (FDJ)'}
                value={newPromo.valeur_reduction}
                onChange={(e) => setNewPromo({ ...newPromo, valeur_reduction: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newPromo.auto_apply}
                    onChange={(e) => setNewPromo({ ...newPromo, auto_apply: e.target.checked })}
                  />
                }
                label="Application automatique (sans code promo)"
              />
            </Grid>

            {!newPromo.auto_apply && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Code promo"
                  value={newPromo.code_promo}
                  onChange={(e) => setNewPromo({ ...newPromo, code_promo: e.target.value.toUpperCase() })}
                  placeholder="Ex: BLACKFRIDAY"
                />
              </Grid>
            )}

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Utilisation max"
                value={newPromo.utilisation_max}
                onChange={(e) => setNewPromo({ ...newPromo, utilisation_max: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Montant minimum (FDJ)"
                value={newPromo.montant_minimum}
                onChange={(e) => setNewPromo({ ...newPromo, montant_minimum: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Date début"
                value={newPromo.date_debut}
                onChange={(e) => setNewPromo({ ...newPromo, date_debut: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Date fin"
                value={newPromo.date_fin}
                onChange={(e) => setNewPromo({ ...newPromo, date_fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vertical</InputLabel>
                <Select
                  value={newPromo.app_vertical}
                  onChange={(e) => setNewPromo({ ...newPromo, app_vertical: e.target.value })}
                >
                  <MenuItem value="beauty">Beauty</MenuItem>
                  <MenuItem value="wellness">Wellness</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newPromo.allow_cumul}
                    onChange={(e) => setNewPromo({ ...newPromo, allow_cumul: e.target.checked })}
                  />
                }
                label="Autoriser le cumul avec d'autres promos"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={createPromo}>
            Créer la promotion
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
