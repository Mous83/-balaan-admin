import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Divider,
  Alert,
  Menu,
  MenuItem,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  MoreVert,
  Visibility,
  Edit,
  Block,
  Phone,
  Email,
  LocationOn,
  Star,
  Add,
  Search,
  FilterList
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export default function Salons() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const salonsRef = collection(db, 'salons');
      const salonsSnapshot = await getDocs(query(salonsRef, orderBy('created_at', 'desc')));
      
      const salonsData = salonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()?.toLocaleDateString() || 'N/A'
      }));
      
      setSalons(salonsData);
    } catch (error) {
      console.error('Erreur chargement salons:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (salonId) => {
    try {
      await updateDoc(doc(db, 'salons', salonId), {
        isApproved: true,
        status: 'approved',
        approved_at: new Date()
      });
      
      toast.success('Salon approuvé avec succès');
      loadSalons();
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (salonId, reason = '') => {
    try {
      await updateDoc(doc(db, 'salons', salonId), {
        isApproved: false,
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date()
      });
      
      toast.success('Salon rejeté');
      loadSalons();
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const getStatusChip = (salon) => {
    if (salon.isApproved === true) {
      return <Chip icon={<CheckCircle />} label="Approuvé" color="success" size="small" />;
    } else if (salon.isApproved === false) {
      return <Chip icon={<Cancel />} label="Rejeté" color="error" size="small" />;
    } else {
      return <Chip icon={<Pending />} label="En attente" color="warning" size="small" />;
    }
  };

  const getKycStatusChip = (salon) => {
    const status = salon.kyc_status || 'pending';
    const colors = {
      approved: 'success',
      rejected: 'error', 
      pending: 'warning'
    };
    const labels = {
      approved: 'KYC Validé',
      rejected: 'KYC Rejeté',
      pending: 'KYC En attente'
    };
    
    return <Chip label={labels[status]} color={colors[status]} size="small" variant="outlined" />;
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.ville?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'approved' && salon.isApproved === true) ||
                         (filterStatus === 'pending' && salon.isApproved === undefined) ||
                         (filterStatus === 'rejected' && salon.isApproved === false);
    
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar 
          src={params.row.photos?.[0]} 
          sx={{ width: 32, height: 32 }}
        >
          {params.row.nom?.[0]}
        </Avatar>
      ),
      sortable: false
    },
    {
      field: 'nom',
      headerName: 'Nom du salon',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'ville',
      headerName: 'Ville',
      width: 150
    },
    {
      field: 'categoriesPrincipales',
      headerName: 'Catégorie',
      width: 150,
      renderCell: (params) => params.value?.[0] || 'N/A'
    },
    {
      field: 'note_moyenne',
      headerName: 'Note',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Star sx={{ fontSize: 16, color: 'gold' }} />
          {params.value?.toFixed(1) || 'N/A'}
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 130,
      renderCell: (params) => getStatusChip(params.row)
    },
    {
      field: 'kyc_status',
      headerName: 'KYC',
      width: 130,
      renderCell: (params) => getKycStatusChip(params.row)
    },
    {
      field: 'created_at',
      headerName: 'Créé le',
      width: 120
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => {
              setSelectedSalon(params.row);
              setDetailDialog(true);
            }}
          >
            <Visibility />
          </IconButton>
          {params.row.isApproved === undefined && (
            <>
              <IconButton 
                size="small" 
                color="success"
                onClick={() => handleApprove(params.row.id)}
              >
                <CheckCircle />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleReject(params.row.id)}
              >
                <Cancel />
              </IconButton>
            </>
          )}
        </Box>
      ),
      sortable: false
    }
  ];

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Gestion des Salons
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {salons.length} salons au total
          </Typography>
        </Box>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Statut"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="approved">Approuvés</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="rejected">Rejetés</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                >
                  Réinitialiser
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tableau des salons */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredSalons}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            loading={loading}
            getRowId={(row) => row.id}
          />
        </Box>
      </Card>

      {/* Dialog détails salon */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails du Salon
        </DialogTitle>
        <DialogContent>
          {selectedSalon && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Informations générales
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Nom</Typography>
                    <Typography variant="body1">{selectedSalon.nom}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Ville</Typography>
                    <Typography variant="body1">{selectedSalon.ville}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body1">{selectedSalon.typeEtablissement}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {getStatusChip(selectedSalon)}
                    {getKycStatusChip(selectedSalon)}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Contact
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16 }} />
                    <Typography variant="body1">{selectedSalon.telephone || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 16 }} />
                    <Typography variant="body1">{selectedSalon.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 16 }} />
                    <Typography variant="body1">{selectedSalon.adresse || 'N/A'}</Typography>
                  </Box>
                </Paper>
              </Grid>

              {selectedSalon.isApproved === undefined && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Ce salon est en attente d'approbation
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        handleApprove(selectedSalon.id);
                        setDetailDialog(false);
                      }}
                    >
                      Approuver
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => {
                        handleReject(selectedSalon.id);
                        setDetailDialog(false);
                      }}
                    >
                      Rejeter
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
