import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save,
  Email,
  Notifications,
  Security,
  Palette,
  Language,
  Storage,
  AdminPanelSettings,
  Backup,
  Update
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getAdminEmails } from '../config/admin';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    maintenanceMode: false,
    autoApproval: false,
    maxFileSize: 5,
    sessionTimeout: 30,
    darkMode: false
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSettings = () => {
    // Ici tu sauvegarderais les paramètres
    toast.success('Paramètres sauvegardés');
  };

  const adminEmails = getAdminEmails();

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Paramètres de l'Administration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configuration et préférences de l'interface d'administration
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Informations administrateur */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                  <AdminPanelSettings sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Administrateur
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                <Chip 
                  label="Admin" 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Emails autorisés:
              </Typography>
              {adminEmails.map((email, index) => (
                <Chip 
                  key={index}
                  label={email} 
                  size="small" 
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Paramètres généraux */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Paramètres Généraux
              </Typography>

              <Grid container spacing={3}>
                {/* Notifications */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Notifications />
                      Notifications
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Notifications par email"
                    />
                    <br />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.pushNotifications}
                          onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                        />
                      }
                      label="Notifications push"
                    />
                  </Paper>
                </Grid>

                {/* Sécurité */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security />
                      Sécurité
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Timeout de session (minutes)"
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Taille max fichier (MB)"
                          type="number"
                          value={settings.maxFileSize}
                          onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Modération */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Modération Automatique
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoApproval}
                          onChange={(e) => handleSettingChange('autoApproval', e.target.checked)}
                        />
                      }
                      label="Approbation automatique des salons"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Approuve automatiquement les salons après vérification KYC
                    </Typography>
                  </Paper>
                </Grid>

                {/* Maintenance */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Mode Maintenance
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.maintenanceMode}
                          onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                          color="warning"
                        />
                      }
                      label="Activer le mode maintenance"
                    />
                    {settings.maintenanceMode && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Le mode maintenance empêchera les utilisateurs d'accéder à l'application
                      </Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Interface */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Palette />
                      Interface
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.darkMode}
                          onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                        />
                      }
                      label="Mode sombre"
                    />
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={saveSettings}
                >
                  Sauvegarder
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSettings({
                      emailNotifications: true,
                      pushNotifications: false,
                      maintenanceMode: false,
                      autoApproval: false,
                      maxFileSize: 5,
                      sessionTimeout: 30,
                      darkMode: false
                    });
                  }}
                >
                  Réinitialiser
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions système */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Actions Système
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Backup sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Sauvegarde
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Créer une sauvegarde complète des données
                    </Typography>
                    <Button variant="outlined" fullWidth>
                      Créer sauvegarde
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Storage sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Cache
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Vider le cache de l'application
                    </Typography>
                    <Button variant="outlined" fullWidth>
                      Vider cache
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Update sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Mise à jour
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Vérifier les mises à jour disponibles
                    </Typography>
                    <Button variant="outlined" fullWidth>
                      Vérifier MAJ
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations système */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Informations Système
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Version de l'interface"
                    secondary="v1.0.0"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Base de données"
                    secondary="Firebase Firestore"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Connecté" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Stockage"
                    secondary="Firebase Storage"
                  />
                  <ListItemSecondaryAction>
                    <Chip label="Opérationnel" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Dernière sauvegarde"
                    secondary="12/09/2024 - 14:30"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
