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
  ListItemText,
  ListItemAvatar,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  IconButton,
  ImageList,
  ImageListItem,
  Zoom
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Visibility,
  Download,
  ZoomIn,
  Business,
  Person,
  Assignment,
  Receipt,
  Edit
} from '@mui/icons-material';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export default function KycVerification() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadPendingKyc();
  }, []);

  const loadPendingKyc = async () => {
    try {
      setLoading(true);
      const salonsRef = collection(db, 'salons');
      
      // Charger tous les salons pour vérifier leur statut KYC
      const salonsSnapshot = await getDocs(salonsRef);
      
      const salonsWithKyc = [];
      
      for (const salonDoc of salonsSnapshot.docs) {
        const salonData = salonDoc.data();
        
        // Charger les documents KYC de ce salon
        const documentsRef = collection(db, 'salons', salonDoc.id, 'documents');
        const documentsSnapshot = await getDocs(documentsRef);
        
        const docsData = documentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Vérifier s'il y a des documents en attente
        const hasPendingDocs = docsData.some(doc => 
          doc.status === 'pending' || doc.status === undefined
        );
        
        if (hasPendingDocs || docsData.length > 0) {
          salonsWithKyc.push({
            id: salonDoc.id,
            ...salonData,
            documents: docsData,
            pendingCount: docsData.filter(doc => doc.status === 'pending' || doc.status === undefined).length,
            totalDocs: docsData.length
          });
        }
      }
      
      setSalons(salonsWithKyc);
    } catch (error) {
      console.error('Erreur chargement KYC:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openVerificationDialog = (salon) => {
    setSelectedSalon(salon);
    setDocuments(salon.documents || []);
    setVerificationDialog(true);
    setSelectedTab(0);
  };

  const approveDocument = async (documentId, salonId) => {
    try {
      const docRef = doc(db, 'salons', salonId, 'documents', documentId);
      await updateDoc(docRef, {
        status: 'approved',
        approved_at: new Date(),
        approved_by: 'admin' // Tu peux remplacer par l'email admin
      });
      
      toast.success('Document approuvé');
      loadPendingKyc();
      
      // Mettre à jour les documents localement
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'approved' } : doc
      ));
    } catch (error) {
      console.error('Erreur approbation document:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const rejectDocument = async (documentId, salonId, reason) => {
    try {
      const docRef = doc(db, 'salons', salonId, 'documents', documentId);
      await updateDoc(docRef, {
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date(),
        rejected_by: 'admin'
      });
      
      toast.success('Document rejeté');
      loadPendingKyc();
      
      // Mettre à jour les documents localement
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'rejected', rejection_reason: reason } : doc
      ));
      
      setRejectionReason('');
    } catch (error) {
      console.error('Erreur rejet document:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const getDocumentIcon = (docType) => {
    switch (docType) {
      case 'cni_recto':
      case 'cni_verso':
      case 'selfie_cni':
        return <Person />;
      case 'patente':
        return <Business />;
      case 'immatriculation':
        return <Assignment />;
      case 'releve_impots':
        return <Receipt />;
      case 'signature':
        return <Edit />;
      default:
        return <Assignment />;
    }
  };

  const getDocumentName = (docType) => {
    const names = {
      'cni_recto': 'CNI Recto',
      'cni_verso': 'CNI Verso', 
      'selfie_cni': 'Selfie avec CNI',
      'patente': 'Patente',
      'immatriculation': 'Certificat d\'immatriculation',
      'releve_impots': 'Relevé des impôts',
      'signature': 'Signature numérique'
    };
    return names[docType] || docType;
  };

  const getStatusChip = (status) => {
    if (status === 'approved') {
      return <Chip icon={<CheckCircle />} label="Approuvé" color="success" size="small" />;
    } else if (status === 'rejected') {
      return <Chip icon={<Cancel />} label="Rejeté" color="error" size="small" />;
    } else {
      return <Chip icon={<Pending />} label="En attente" color="warning" size="small" />;
    }
  };

  const pendingDocuments = documents.filter(doc => doc.status === 'pending' || doc.status === undefined);
  const approvedDocuments = documents.filter(doc => doc.status === 'approved');
  const rejectedDocuments = documents.filter(doc => doc.status === 'rejected');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Vérification KYC
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {salons.length} salons avec documents à vérifier
        </Typography>
      </Box>

      {/* Liste des salons */}
      <Grid container spacing={3}>
        {salons.map((salon) => (
          <Grid item xs={12} md={6} lg={4} key={salon.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={salon.photos?.[0]} sx={{ mr: 2 }}>
                    {salon.nom?.[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {salon.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {salon.ville} • {salon.typeEtablissement}
                    </Typography>
                  </Box>
                  <Badge badgeContent={salon.pendingCount} color="error">
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => openVerificationDialog(salon)}
                    >
                      Vérifier
                    </Button>
                  </Badge>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {salon.totalDocs} documents soumis
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {salon.pendingCount} en attente
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {salons.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Aucun document KYC en attente de vérification
        </Alert>
      )}

      {/* Dialog de vérification */}
      <Dialog 
        open={verificationDialog} 
        onClose={() => setVerificationDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Vérification KYC - {selectedSalon?.nom}
        </DialogTitle>
        <DialogContent>
          {selectedSalon && (
            <Box>
              {/* Informations salon */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Salon</Typography>
                    <Typography variant="body1">{selectedSalon.nom}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body1">{selectedSalon.typeEtablissement}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Onglets de documents */}
              <Tabs value={selectedTab} onChange={(e, val) => setSelectedTab(val)} sx={{ mb: 2 }}>
                <Tab 
                  label={`En attente (${pendingDocuments.length})`} 
                  icon={<Badge badgeContent={pendingDocuments.length} color="warning" />}
                />
                <Tab 
                  label={`Approuvés (${approvedDocuments.length})`}
                  icon={<Badge badgeContent={approvedDocuments.length} color="success" />}
                />
                <Tab 
                  label={`Rejetés (${rejectedDocuments.length})`}
                  icon={<Badge badgeContent={rejectedDocuments.length} color="error" />}
                />
              </Tabs>

              {/* Contenu des onglets */}
              {selectedTab === 0 && (
                <List>
                  {pendingDocuments.map((doc) => (
                    <Paper key={doc.id} sx={{ mb: 2, p: 2 }}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            {getDocumentIcon(doc.document_type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getDocumentName(doc.document_type)}
                          secondary={`Soumis le ${doc.submitted_at?.toDate?.()?.toLocaleDateString() || 'N/A'}`}
                        />
                        <Box sx={{ ml: 2 }}>
                          {getStatusChip(doc.status)}
                        </Box>
                      </ListItem>
                      
                      {/* Prévisualisation du document */}
                      {doc.file_url && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <img
                            src={doc.file_url}
                            alt={getDocumentName(doc.document_type)}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setImagePreview(doc.file_url)}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setImagePreview(doc.file_url)}
                            sx={{ ml: 1 }}
                          >
                            <ZoomIn />
                          </IconButton>
                        </Box>
                      )}

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => approveDocument(doc.id, selectedSalon.id)}
                        >
                          Approuver
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => {
                            const reason = prompt('Raison du rejet:');
                            if (reason) {
                              rejectDocument(doc.id, selectedSalon.id, reason);
                            }
                          }}
                        >
                          Rejeter
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                  {pendingDocuments.length === 0 && (
                    <Alert severity="info">Aucun document en attente</Alert>
                  )}
                </List>
              )}

              {selectedTab === 1 && (
                <List>
                  {approvedDocuments.map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemAvatar>
                        <Avatar>
                          {getDocumentIcon(doc.document_type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={getDocumentName(doc.document_type)}
                        secondary={`Approuvé le ${doc.approved_at?.toDate?.()?.toLocaleDateString() || 'N/A'}`}
                      />
                      {getStatusChip(doc.status)}
                    </ListItem>
                  ))}
                  {approvedDocuments.length === 0 && (
                    <Alert severity="info">Aucun document approuvé</Alert>
                  )}
                </List>
              )}

              {selectedTab === 2 && (
                <List>
                  {rejectedDocuments.map((doc) => (
                    <Paper key={doc.id} sx={{ mb: 2, p: 2 }}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            {getDocumentIcon(doc.document_type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getDocumentName(doc.document_type)}
                          secondary={`Rejeté le ${doc.rejected_at?.toDate?.()?.toLocaleDateString() || 'N/A'}`}
                        />
                        {getStatusChip(doc.status)}
                      </ListItem>
                      {doc.rejection_reason && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          <strong>Raison du rejet:</strong> {doc.rejection_reason}
                        </Alert>
                      )}
                    </Paper>
                  ))}
                  {rejectedDocuments.length === 0 && (
                    <Alert severity="info">Aucun document rejeté</Alert>
                  )}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog prévisualisation image */}
      <Dialog
        open={Boolean(imagePreview)}
        onClose={() => setImagePreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Document"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagePreview(null)}>
            Fermer
          </Button>
          <Button
            href={imagePreview}
            target="_blank"
            startIcon={<Download />}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
