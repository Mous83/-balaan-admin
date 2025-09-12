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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  MenuItem
} from '@mui/material';
import {
  SupportAgent,
  CheckCircle,
  Pending,
  PriorityHigh as Priority,
  Person,
  Email,
  Phone,
  Image,
  Reply,
  Close,
  Search,
  FilterList
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, query, getDocs, doc, updateDoc, addDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsRef = collection(db, 'support_tickets');
      const ticketsSnapshot = await getDocs(query(ticketsRef, orderBy('created_at', 'desc')));
      
      const ticketsData = ticketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()?.toLocaleDateString() || 'N/A',
        created_time: doc.data().created_at?.toDate()?.toLocaleTimeString() || 'N/A'
      }));
      
      setTickets(ticketsData);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (ticketId) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: 'resolved',
        resolved_at: new Date()
      });
      
      toast.success('Ticket marqué comme résolu');
      loadTickets();
    } catch (error) {
      console.error('Erreur résolution ticket:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  const sendResponse = async () => {
    if (!responseText.trim() || !selectedTicket) return;

    try {
      // Ajouter la réponse dans une sous-collection
      const responsesRef = collection(db, 'support_tickets', selectedTicket.id, 'responses');
      await addDoc(responsesRef, {
        message: responseText,
        sender: 'admin',
        created_at: new Date(),
        sender_email: 'admin@balaan.com' // Tu peux remplacer par l'email admin connecté
      });

      // Mettre à jour le statut du ticket
      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        status: 'responded',
        last_response: new Date()
      });

      toast.success('Réponse envoyée');
      setResponseText('');
      setDetailDialog(false);
      loadTickets();
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'resolved':
        return <Chip icon={<CheckCircle />} label="Résolu" color="success" size="small" />;
      case 'responded':
        return <Chip icon={<Reply />} label="Répondu" color="info" size="small" />;
      case 'open':
      default:
        return <Chip icon={<Pending />} label="Ouvert" color="warning" size="small" />;
    }
  };

  const getPriorityChip = (priority) => {
    const colors = {
      high: 'error',
      medium: 'warning', 
      low: 'default'
    };
    const labels = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse'
    };
    
    return (
      <Chip 
        icon={<Priority />} 
        label={labels[priority] || 'Moyenne'} 
        color={colors[priority] || 'default'} 
        size="small" 
        variant="outlined"
      />
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'open' && (!ticket.status || ticket.status === 'open')) ||
                         (filterStatus === 'responded' && ticket.status === 'responded') ||
                         (filterStatus === 'resolved' && ticket.status === 'resolved');
    
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <SupportAgent sx={{ fontSize: 16 }} />
        </Avatar>
      ),
      sortable: false
    },
    {
      field: 'subject',
      headerName: 'Sujet',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'user_email',
      headerName: 'Email utilisateur',
      width: 200,
      renderCell: (params) => params.value || 'Anonyme'
    },
    {
      field: 'priority',
      headerName: 'Priorité',
      width: 120,
      renderCell: (params) => getPriorityChip(params.value)
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => getStatusChip(params.value)
    },
    {
      field: 'created_at',
      headerName: 'Créé le',
      width: 120
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            startIcon={<Reply />}
            onClick={() => {
              setSelectedTicket(params.row);
              setDetailDialog(true);
            }}
          >
            Voir
          </Button>
          {params.row.status !== 'resolved' && (
            <Button
              size="small"
              color="success"
              onClick={() => markAsResolved(params.row.id)}
              sx={{ ml: 1 }}
            >
              Résoudre
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Support Client
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {tickets.length} tickets au total
        </Typography>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Pending />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {tickets.filter(t => !t.status || t.status === 'open').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ouverts
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
                  <Reply />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {tickets.filter(t => t.status === 'responded').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Répondus
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
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {tickets.filter(t => t.status === 'resolved').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Résolus
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
                  <Priority />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {tickets.filter(t => t.priority === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Priorité haute
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
                placeholder="Rechercher par sujet ou email..."
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
                <MenuItem value="open">Ouverts</MenuItem>
                <MenuItem value="responded">Répondus</MenuItem>
                <MenuItem value="resolved">Résolus</MenuItem>
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

      {/* Tableau des tickets */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredTickets}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            loading={loading}
            getRowId={(row) => row.id}
          />
        </Box>
      </Card>

      {/* Dialog détails ticket */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Ticket Support #{selectedTicket?.id?.slice(-8)}
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              {/* Informations du ticket */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Sujet</Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>{selectedTicket.subject}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Statut</Typography>
                    <Box sx={{ mb: 2 }}>
                      {getStatusChip(selectedTicket.status)}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Utilisateur</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedTicket.user_email || 'Utilisateur anonyme'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Créé le</Typography>
                    <Typography variant="body1">
                      {selectedTicket.created_at} à {selectedTicket.created_time}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Message du ticket */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Message de l'utilisateur
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.message}
                </Typography>
                
                {/* Image jointe si présente */}
                {selectedTicket.screenshot_url && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Capture d'écran jointe
                    </Typography>
                    <img
                      src={selectedTicket.screenshot_url}
                      alt="Screenshot"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                    />
                  </Box>
                )}
              </Paper>

              {/* Zone de réponse */}
              {selectedTicket.status !== 'resolved' && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Votre réponse
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Tapez votre réponse à l'utilisateur..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Reply />}
                      onClick={sendResponse}
                      disabled={!responseText.trim()}
                    >
                      Envoyer réponse
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        markAsResolved(selectedTicket.id);
                        setDetailDialog(false);
                      }}
                    >
                      Marquer comme résolu
                    </Button>
                  </Box>
                </Paper>
              )}

              {selectedTicket.status === 'resolved' && (
                <Alert severity="success">
                  Ce ticket a été marqué comme résolu
                </Alert>
              )}
            </Box>
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
