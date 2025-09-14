import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Block,
  Person,
  Restore,
  Visibility,
  Search,
  FilterList,
  Warning,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, query, getDocs, doc, updateDoc, addDoc, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export default function BannedUsers() {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDialog, setBanDialog] = useState(false);
  const [unbanDialog, setUnbanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadBannedUsers();
  }, []);

  const loadBannedUsers = async () => {
    try {
      setLoading(true);
      const bannedRef = collection(db, 'banned_users');
      const bannedSnapshot = await getDocs(query(bannedRef, orderBy('banned_at', 'desc')));
      
      const bannedData = [];
      
      for (const banDoc of bannedSnapshot.docs) {
        const banData = banDoc.data();
        
        // Charger les données utilisateur
        try {
          const userRef = doc(db, 'users', banData.user_id);
          const userSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', '==', banData.user_id)));
          
          let userData = { email: 'Utilisateur supprimé', display_name: 'N/A' };
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data();
          }
          
          bannedData.push({
            id: banDoc.id,
            ...banData,
            user_email: userData.email || 'N/A',
            user_name: userData.display_name || userData.nom || 'N/A',
            banned_at: banData.banned_at?.toDate() || new Date(),
            ban_expires: banData.ban_expires?.toDate() || null,
            is_active: banData.ban_expires ? new Date() < banData.ban_expires.toDate() : true
          });
        } catch (error) {
          console.error('Erreur chargement utilisateur:', error);
          bannedData.push({
            id: banDoc.id,
            ...banData,
            user_email: 'Erreur chargement',
            user_name: 'N/A',
            banned_at: banData.banned_at?.toDate() || new Date(),
            ban_expires: banData.ban_expires?.toDate() || null,
            is_active: banData.ban_expires ? new Date() < banData.ban_expires.toDate() : true
          });
        }
      }
      
      setBannedUsers(bannedData);
    } catch (error) {
      console.error('Erreur chargement utilisateurs bannis:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (userId, reason, duration) => {
    if (!window.confirm('Êtes-vous sûr de vouloir bannir cet utilisateur ?')) {
      return;
    }
    
    try {
      let banExpires = null;
      if (duration !== 'permanent') {
        const days = parseInt(duration);
        banExpires = new Date();
        banExpires.setDate(banExpires.getDate() + days);
      }
      
      await addDoc(collection(db, 'banned_users'), {
        user_id: userId,
        reason: reason,
        banned_at: new Date(),
        banned_by: 'admin',
        ban_expires: banExpires,
        status: 'active'
      });
      
      // Désactiver l'utilisateur
      await updateDoc(doc(db, 'users', userId), {
        is_banned: true,
        banned_at: new Date(),
        ban_reason: reason
      });
      
      toast.success('✅ Utilisateur banni avec succès');
      loadBannedUsers();
      setBanDialog(false);
      setBanReason('');
    } catch (error) {
      console.error('Erreur bannissement:', error);
      toast.error('❌ Erreur lors du bannissement: ' + error.message);
    }
  };

  const unbanUser = async (banId, userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir débannir cet utilisateur ?')) {
      return;
    }
    
    try {
      // Supprimer l'entrée de bannissement
      await deleteDoc(doc(db, 'banned_users', banId));
      
      // Réactiver l'utilisateur
      await updateDoc(doc(db, 'users', userId), {
        is_banned: false,
        banned_at: null,
        ban_reason: null,
        unbanned_at: new Date()
      });
      
      toast.success('✅ Utilisateur débanni avec succès');
      loadBannedUsers();
      setUnbanDialog(false);
    } catch (error) {
      console.error('Erreur débannissement:', error);
      toast.error('❌ Erreur lors du débannissement: ' + error.message);
    }
  };

  const getStatusChip = (user) => {
    if (!user.is_active) {
      return <Chip icon={<CheckCircle />} label="Expiré" color="success" size="small" />;
    } else if (user.ban_expires) {
      return <Chip icon={<Schedule />} label="Temporaire" color="warning" size="small" />;
    } else {
      return <Chip icon={<Block />} label="Permanent" color="error" size="small" />;
    }
  };

  const filteredUsers = bannedUsers.filter(user => {
    const matchesSearch = user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'expired' && !user.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32 }}>
          <Person />
        </Avatar>
      ),
      sortable: false
    },
    {
      field: 'user_name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'user_email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'reason',
      headerName: 'Raison',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'banned_at',
      headerName: 'Banni le',
      width: 120,
      renderCell: (params) => params.value?.toLocaleDateString() || 'N/A'
    },
    {
      field: 'ban_expires',
      headerName: 'Expire le',
      width: 120,
      renderCell: (params) => params.value?.toLocaleDateString() || 'Permanent'
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 130,
      renderCell: (params) => getStatusChip(params.row)
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
              setSelectedUser(params.row);
              setUnbanDialog(true);
            }}
            title="Débannir"
          >
            <Restore />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => {
              setSelectedUser(params.row);
            }}
            title="Voir détails"
          >
            <Visibility />
          </IconButton>
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
            Utilisateurs Bannis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {bannedUsers.length} utilisateurs bannis au total
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
                placeholder="Rechercher par nom ou email..."
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
                <MenuItem value="active">Actifs</MenuItem>
                <MenuItem value="expired">Expirés</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs bannis */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            loading={loading}
            getRowId={(row) => row.id}
          />
        </Box>
      </Card>

      {/* Dialog débannissement */}
      <Dialog 
        open={unbanDialog} 
        onClose={() => setUnbanDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Débannir l'utilisateur
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Êtes-vous sûr de vouloir débannir cet utilisateur ?
              </Alert>
              <Typography variant="body1">
                <strong>Nom:</strong> {selectedUser.user_name}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {selectedUser.user_email}
              </Typography>
              <Typography variant="body1">
                <strong>Raison du ban:</strong> {selectedUser.reason}
              </Typography>
              <Typography variant="body1">
                <strong>Banni le:</strong> {selectedUser.banned_at?.toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnbanDialog(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Restore />}
            onClick={() => {
              if (selectedUser) {
                unbanUser(selectedUser.id, selectedUser.user_id);
              }
            }}
          >
            Débannir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
