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
import { collection, query, getDocs, doc, updateDoc, where, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalStats, setTotalStats] = useState({ clients: 0, etablissements: 0, bannis: 0 });
  const pageSize = 50;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (isNextPage = false) => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      
      // Compter le total et calculer les stats si c'est la première page
      if (!isNextPage) {
        const totalSnapshot = await getDocs(usersRef);
        setTotalCount(totalSnapshot.size);
        
        // Calculer les statistiques sur TOUS les utilisateurs
        let clients = 0, etablissements = 0, bannis = 0;
        totalSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.role === 'Client') clients++;
          else if (data.role === 'Établissement') etablissements++;
          if (data.is_banned) bannis++;
        });
        
        setTotalStats({ clients, etablissements, bannis });
        console.log(`📊 Stats totales: ${totalSnapshot.size} users (${clients} clients, ${etablissements} établissements, ${bannis} bannis)`);
      }
      
      // Pagination avec limite
      let q = query(usersRef, limit(pageSize));
      
      if (isNextPage && lastVisible) {
        q = query(usersRef, startAfter(lastVisible), limit(pageSize));
      }
      
      const usersSnapshot = await getDocs(q);
      const usersData = [];
      
      console.log(`📊 Chargement de ${usersSnapshot.docs.length} utilisateurs (page ${currentPage})...`);
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Debug: afficher le type d'utilisateur et tous les champs
        console.log(`👤 ${userDoc.id}:`, {
          role: userData.role,
          display_name: userData.display_name,
          email: userData.email,
          created_time: userData.created_time,
          allFields: Object.keys(userData).sort()
        });
        
        // Compter les réservations pour ce client
        let reservationCount = 0;
        if (userData.role === 'Client') {
          try {
            const reservationsQuery = query(
              collection(db, 'reservation'),
              where('client', '==', userDoc.id)
            );
            const reservationsSnapshot = await getDocs(reservationsQuery);
            reservationCount = reservationsSnapshot.size;
          } catch (error) {
            console.error('Erreur comptage réservations:', error);
          }
        }
        
        // Compter les réservations et clients uniques pour les établissements
        let salonReservations = 0;
        let uniqueClients = 0;
        if (userData.role === 'Établissement') {
          try {
            const salonsQuery = query(
              collection(db, 'salons'),
              where('owner_id', '==', userDoc.id)
            );
            const salonsSnapshot = await getDocs(salonsQuery);
            
            if (!salonsSnapshot.empty) {
              const salonId = salonsSnapshot.docs[0].id;
              
              const reservationsQuery = query(
                collection(db, 'reservation'),
                where('salon_ref', '==', salonId)
              );
              const reservationsSnapshot = await getDocs(reservationsQuery);
              salonReservations = reservationsSnapshot.size;
              
              const clientIds = new Set();
              reservationsSnapshot.docs.forEach(doc => {
                const resData = doc.data();
                if (resData.client) {
                  clientIds.add(resData.client);
                }
              });
              uniqueClients = clientIds.size;
            }
          } catch (error) {
            console.error('Erreur comptage salon:', error);
          }
        }
        
        usersData.push({
          id: userDoc.id,
          ...userData,
          created_time: userData.created_time?.toDate()?.toLocaleDateString() || 'N/A',
          last_sign_in_time: userData.last_sign_in_time?.toDate()?.toLocaleDateString() || 'Jamais',
          reservation_count: reservationCount,
          salon_reservations: salonReservations,
          unique_clients: uniqueClients
        });
      }
      
      if (isNextPage) {
        setUsers(prev => [...prev, ...usersData]);
      } else {
        setUsers(usersData);
      }
      
      // Gérer la pagination
      if (usersSnapshot.docs.length > 0) {
        setLastVisible(usersSnapshot.docs[usersSnapshot.docs.length - 1]);
        setHasNextPage(usersSnapshot.docs.length === pageSize);
      } else {
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = () => {
    if (hasNextPage && !loading) {
      setCurrentPage(prev => prev + 1);
      loadUsers(true);
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
    if (user.role === 'Établissement') {
      return <Chip icon={<Business />} label="Établissement" color="primary" size="small" />;
    } else if (user.role === 'Client') {
      return <Chip icon={<Person />} label="Client" color="default" size="small" />;
    } else {
      return <Chip icon={<Person />} label="Utilisateur" color="secondary" size="small" />;
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
                         (filterType === 'clients' && user.role === 'Client') ||
                         (filterType === 'owners' && user.role === 'Établissement') ||
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
            {users.length} sur {totalCount} utilisateurs au total
          </Typography>
          <Button 
            variant="text" 
            size="small" 
            onClick={() => {
              setUsers([]);
              setCurrentPage(1);
              setLastVisible(null);
              loadUsers();
            }}
            sx={{ mt: 1 }}
          >
            🔄 Actualiser
          </Button>
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
                    {totalStats.clients}
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
                    {totalStats.etablissements}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Établissements
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
                    {totalStats.bannis}
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
                <MenuItem value="owners">Établissements</MenuItem>
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
        
        {/* Bouton charger plus */}
        {hasNextPage && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={loadNextPage}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Chargement...' : `Charger plus (${users.length} utilisateurs chargés)`}
            </Button>
          </Box>
        )}
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
