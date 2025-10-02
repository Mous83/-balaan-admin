import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const PaymentValidation = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [validationDialog, setValidationDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Instructions Wafi pour affichage
  const WAFI_INSTRUCTIONS = {
    number: '+253 77 XX XX XX', // Remplacez par votre vrai numéro
    instructions: [
      'Ouvrir l\'application Wafi',
      'Sélectionner "Envoyer de l\'argent"',
      'Saisir le numéro ci-dessus',
      'Montant selon le plan choisi',
      'Dans commentaire: "SALON-[NOM_SALON]"',
      'Confirmer l\'envoi'
    ]
  };

  useEffect(() => {
    // Écouter les abonnements en attente de paiement
    const q = query(
      collection(db, 'subscriptions'),
      where('status', '==', 'pending_payment'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const payments = [];
      
      for (const docSnap of snapshot.docs) {
        const subscriptionData = { id: docSnap.id, ...docSnap.data() };
        
        // Récupérer les infos du salon
        if (subscriptionData.salon_ref) {
          try {
            const salonDoc = await subscriptionData.salon_ref.get();
            if (salonDoc.exists()) {
              subscriptionData.salon = { id: salonDoc.id, ...salonDoc.data() };
            }
          } catch (error) {
            console.error('Erreur récupération salon:', error);
          }
        }
        
        payments.push(subscriptionData);
      }
      
      setPendingPayments(payments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleValidatePayment = async (payment) => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', payment.id);
      
      await updateDoc(subscriptionRef, {
        status: 'active',
        is_paid: true,
        payment_date: new Date(),
        updated_at: new Date(),
        validated_by: 'admin', // Vous pouvez mettre votre ID admin
      });

      toast.success(`Paiement validé pour ${payment.salon?.nom_salon || 'le salon'}`);
      setValidationDialog(false);
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectPayment = async (payment) => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', payment.id);
      
      await updateDoc(subscriptionRef, {
        status: 'payment_rejected',
        rejection_reason: rejectReason,
        updated_at: new Date(),
        rejected_by: 'admin',
      });

      toast.error(`Paiement rejeté pour ${payment.salon?.nom_salon || 'le salon'}`);
      setRejectDialog(false);
      setSelectedPayment(null);
      setRejectReason('');
      
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'currency',
      currency: 'DJF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'freemium': return 'default';
      case 'standard': return 'primary';
      case 'premium': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Chargement des paiements...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Validation des Paiements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez les paiements Wafi en attente de validation
          </Typography>
        </Box>
        <Badge badgeContent={pendingPayments.length} color="error">
          <PaymentIcon sx={{ fontSize: 40 }} />
        </Badge>
      </Box>

      {/* Instructions Wafi */}
      <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Instructions Wafi pour les salons</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Numéro Wafi Balaan:
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontFamily: 'monospace' }}>
                {WAFI_INSTRUCTIONS.number}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Format commentaire:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                SALON-[NOM_DU_SALON]
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Liste des paiements en attente */}
      {pendingPayments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Aucun paiement en attente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tous les paiements sont à jour !
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {pendingPayments.map((payment) => (
            <Grid item xs={12} md={6} lg={4} key={payment.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  {/* En-tête de la carte */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" noWrap>
                        {payment.salon?.nom_salon || 'Salon inconnu'}
                      </Typography>
                      <Chip 
                        label={payment.plan_type.toUpperCase()} 
                        color={getPlanColor(payment.plan_type)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Chip 
                      label="EN ATTENTE" 
                      color="warning" 
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Détails du paiement */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" color="primary.main" gutterBottom>
                      {formatPrice(payment.price_fdj)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Créé le:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(payment.created_at)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Expire le:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(payment.end_date)}
                      </Typography>
                    </Box>

                    {payment.is_promotional && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          PROMOTION: {payment.promo_description}
                        </Typography>
                      </Alert>
                    )}
                  </Box>

                  {/* Boutons d'action */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setValidationDialog(true);
                      }}
                      fullWidth
                    >
                      Valider
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setRejectDialog(true);
                      }}
                      fullWidth
                    >
                      Rejeter
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de validation */}
      <Dialog open={validationDialog} onClose={() => setValidationDialog(false)}>
        <DialogTitle>
          Confirmer la validation du paiement
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography gutterBottom>
                Vous êtes sur le point de valider le paiement pour :
              </Typography>
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle1">
                  <strong>{selectedPayment.salon?.nom_salon}</strong>
                </Typography>
                <Typography variant="body2">
                  Plan: {selectedPayment.plan_type.toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  Montant: {formatPrice(selectedPayment.price_fdj)}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Assurez-vous d'avoir reçu le paiement Wafi avant de valider !
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidationDialog(false)}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => handleValidatePayment(selectedPayment)}
          >
            Confirmer la validation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
        <DialogTitle>
          Rejeter le paiement
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography gutterBottom>
                Rejeter le paiement pour : <strong>{selectedPayment.salon?.nom_salon}</strong>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Raison du rejet"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Ex: Paiement non reçu, montant incorrect..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => handleRejectPayment(selectedPayment)}
            disabled={!rejectReason.trim()}
          >
            Confirmer le rejet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentValidation;
