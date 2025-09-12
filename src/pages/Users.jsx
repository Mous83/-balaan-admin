import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem
} from '@mui/material';
import {
  People,
  Block,
  CheckCircle,
  Email,
  Phone,
  LocationOn,
  Business,
  Person,
  Search,
  FilterList,
  Visibility
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(query(usersRef, orderBy('created_time', 'desc')));
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_time: doc.data().created_time?.toDate()?.toLocaleDateString() || 'N/A'
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        is_banned: true,
        banned_at: new Date()
      });
      
      toast.success('Utilisateur banni');
      loadUsers();
    } catch (error) {
      console.error('Erreur ban utilisateur:', error);
      toast.error('Erreur lors du bannissement');
    }
  };

  const unbanUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        is_banned: false,
        unbanned_at: new Date()
      });
      
      toast.success('Utilisateur débanni');
      loadUsers();
    } catch (error) {
      console.error('Erreur unban utilisateur:', error);
      toast.error('Erreur lors du débannissement');
    }
  };

  const getUserTypeChip = (user) => {
    if (user.user_type === 'salon_owner') {
      return <Chip icon={<Business />} label="Propriétaire" color="primary" size="small" />;
    } else {
      return <Chip icon={<Person />} label="Client" color="default" size="small" />;
    }
  };

  const getStatusChip = (user) => {
    if (user.is_banned) {
      return <Chip icon={<Block />} label="Banni" color="error" size="small" />;
    } else {
      return <Chip icon={<CheckCircle />} label="Actif" color="success" size="small" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'clients' && user.user_type !== 'salon_owner') ||
                         (filterType === 'owners' && user.user_type === 'salon_owner') ||
                         (filterType === 'banned' && user.is_banned);
    
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar 
          src={params.row.photo_url} 
          sx={{ width: 32, height: 32 }}
        >
          {params.row.display_name?.[0] || params.row.email?.[0]}
        </Avatar>
      ),
      sortable: false
    },
    {
      field: 'display_name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value || 'N/A'
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'user_type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => getUserTypeChip(params.row)
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 100,
      renderCell: (params) => getStatusChip(params.row)
    },
    {
      field: 'created_time',
      headerName: 'Inscrit le',
      width: 120
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => {
              setSelectedUser(params.row);
              setDetailDialog(true);
            }}
          >
            <Visibility />
          </IconButton>
          {params.row.is_banned ? (
            <Button
              size="small"
              color="success"
              onClick={() => unbanUser(params.row.id)}
            >
              Débannir
            </Button>
          ) : (
            <Button
              size="small"
              color="error"
              onClick={() => banUser(params.row.id)}
            >
              Bannir
            </Button>
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
            Gestion des Utilisateurs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {users.length} utilisateurs au total
          </Typography>
        </Box>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {users.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total utilisateurs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {users.filter(u => u.user_type !== 'salon_owner').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {users.filter(u => u.user_type === 'salon_owner').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Propriétaires
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Block />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {users.filter(u => u.is_banned).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bannis
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
                label="Type d'utilisateur"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="clients">Clients</MenuItem>
                <MenuItem value="owners">Propriétaires</MenuItem>
                <MenuItem value="banned">Bannis</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
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

      {/* Dialog détails utilisateur */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails de l'utilisateur
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar 
                    src={selectedUser.photo_url} 
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  >
                    {selectedUser.display_name?.[0] || selectedUser.email?.[0]}
                  </Avatar>
                  <Typography variant="h6">
                    {selectedUser.display_name || 'Nom non défini'}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {getUserTypeChip(selectedUser)}
                    {getStatusChip(selectedUser)}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 16 }} />
                  <Typography variant="body1">{selectedUser.email}</Typography>
                </Box>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 16 }} />
                  <Typography variant="body1">{selectedUser.phone_number || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Inscrit le</Typography>
                  <Typography variant="body1">{selectedUser.created_time}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">UID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {selectedUser.id}
                  </Typography>
                </Box>
              </Grid>

              {selectedUser.is_banned && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    Cet utilisateur est actuellement banni de la plateforme
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedUser && (
            <>
              {selectedUser.is_banned ? (
                <Button
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    unbanUser(selectedUser.id);
                    setDetailDialog(false);
                  }}
                >
                  Débannir
                </Button>
              ) : (
                <Button
                  color="error"
                  startIcon={<Block />}
                  onClick={() => {
                    banUser(selectedUser.id);
                    setDetailDialog(false);
                  }}
                >
                  Bannir
                </Button>
              )}
            </>
          )}
          <Button onClick={() => setDetailDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
