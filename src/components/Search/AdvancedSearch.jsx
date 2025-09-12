/**
 * 🔍 RECHERCHE AVANCÉE BALAAN ADMIN
 * Filtres multiples et recherche intelligente
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Collapse,
  Autocomplete,
  DatePicker,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  LocationOn,
  Business,
  Person,
  CalendarToday
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import { fr } from 'date-fns/locale';
import { trackAdminAction } from '../../utils/analytics';

const SALON_STATUSES = [
  { value: 'active', label: 'Actif', color: 'success' },
  { value: 'inactive', label: 'Inactif', color: 'default' },
  { value: 'pending', label: 'En attente', color: 'warning' },
  { value: 'suspended', label: 'Suspendu', color: 'error' }
];

const KYC_STATUSES = [
  { value: 'under_review', label: 'En cours', color: 'warning' },
  { value: 'approved', label: 'Approuvé', color: 'success' },
  { value: 'rejected', label: 'Rejeté', color: 'error' },
  { value: 'pending', label: 'En attente', color: 'info' }
];

const CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 
  'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 
  'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble'
];

const SERVICES = [
  'Coiffure', 'Manucure', 'Pédicure', 'Massage', 'Soins du visage',
  'Épilation', 'Maquillage', 'Extensions', 'Coloration', 'Brushing'
];

export default function AdvancedSearch({ onSearch, onClear, searchType = 'salons' }) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    // Recherche générale
    query: '',
    
    // Filtres communs
    city: '',
    status: '',
    dateFrom: null,
    dateTo: null,
    
    // Filtres spécifiques salons
    kycStatus: '',
    services: [],
    rating: '',
    verified: null,
    
    // Filtres spécifiques utilisateurs
    userType: '',
    lastLoginFrom: null,
    lastLoginTo: null,
    
    // Options avancées
    sortBy: 'created_time',
    sortOrder: 'desc',
    limit: 20
  });

  const [activeFilters, setActiveFilters] = useState([]);

  // Mettre à jour les filtres actifs
  useEffect(() => {
    const active = [];
    
    if (filters.query) active.push({ key: 'query', label: `Recherche: "${filters.query}"`, value: filters.query });
    if (filters.city) active.push({ key: 'city', label: `Ville: ${filters.city}`, value: filters.city });
    if (filters.status) {
      const statusLabel = SALON_STATUSES.find(s => s.value === filters.status)?.label || filters.status;
      active.push({ key: 'status', label: `Statut: ${statusLabel}`, value: filters.status });
    }
    if (filters.kycStatus) {
      const kycLabel = KYC_STATUSES.find(s => s.value === filters.kycStatus)?.label || filters.kycStatus;
      active.push({ key: 'kycStatus', label: `KYC: ${kycLabel}`, value: filters.kycStatus });
    }
    if (filters.services.length > 0) {
      active.push({ key: 'services', label: `Services: ${filters.services.length}`, value: filters.services });
    }
    if (filters.dateFrom) {
      active.push({ key: 'dateFrom', label: `Depuis: ${filters.dateFrom.toLocaleDateString()}`, value: filters.dateFrom });
    }
    if (filters.dateTo) {
      active.push({ key: 'dateTo', label: `Jusqu'au: ${filters.dateTo.toLocaleDateString()}`, value: filters.dateTo });
    }
    if (filters.verified !== null) {
      active.push({ key: 'verified', label: `Vérifié: ${filters.verified ? 'Oui' : 'Non'}`, value: filters.verified });
    }

    setActiveFilters(active);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    // Analytics
    trackAdminAction('advanced_search', searchType, {
      query: filters.query,
      filters_count: activeFilters.length,
      search_type: searchType
    });

    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      query: '',
      city: '',
      status: '',
      dateFrom: null,
      dateTo: null,
      kycStatus: '',
      services: [],
      rating: '',
      verified: null,
      userType: '',
      lastLoginFrom: null,
      lastLoginTo: null,
      sortBy: 'created_time',
      sortOrder: 'desc',
      limit: 20
    };
    
    setFilters(clearedFilters);
    onClear();
    
    trackAdminAction('search_clear', searchType);
  };

  const removeFilter = (filterKey) => {
    if (filterKey === 'services') {
      handleFilterChange('services', []);
    } else if (filterKey === 'verified') {
      handleFilterChange('verified', null);
    } else {
      handleFilterChange(filterKey, filterKey.includes('date') || filterKey.includes('Date') ? null : '');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Recherche principale */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recherche générale"
                placeholder={searchType === 'salons' ? "Nom du salon, ville, propriétaire..." : "Nom, email, téléphone..."}
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
                size="large"
              >
                Rechercher
              </Button>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setExpanded(!expanded)}
                startIcon={<FilterList />}
                endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              >
                Filtres
              </Button>
            </Grid>
            
            <Grid item xs={12} md={1}>
              <IconButton onClick={handleClear} title="Effacer">
                <Clear />
              </IconButton>
            </Grid>
          </Grid>

          {/* Filtres actifs */}
          {activeFilters.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                Filtres actifs:
              </Typography>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  onDelete={() => removeFilter(filter.key)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}

          {/* Filtres avancés */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={3}>
                {/* Filtres communs */}
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={CITIES}
                    value={filters.city}
                    onChange={(e, value) => handleFilterChange('city', value || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Ville"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                        }}
                      />
                    )}
                  />
                </Grid>

                {searchType === 'salons' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Statut salon</InputLabel>
                        <Select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          {SALON_STATUSES.map(status => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Statut KYC</InputLabel>
                        <Select
                          value={filters.kycStatus}
                          onChange={(e) => handleFilterChange('kycStatus', e.target.value)}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          {KYC_STATUSES.map(status => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        multiple
                        options={SERVICES}
                        value={filters.services}
                        onChange={(e, value) => handleFilterChange('services', value)}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Services"
                            placeholder="Sélectionner des services"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={filters.verified === true}
                            onChange={(e) => handleFilterChange('verified', e.target.checked ? true : null)}
                          />
                        }
                        label="Salon vérifié uniquement"
                      />
                    </Grid>
                  </>
                )}

                {/* Filtres de date */}
                <Grid item xs={12} md={6}>
                  <MUIDatePicker
                    label="Date de création - Du"
                    value={filters.dateFrom}
                    onChange={(value) => handleFilterChange('dateFrom', value)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <MUIDatePicker
                    label="Date de création - Au"
                    value={filters.dateTo}
                    onChange={(value) => handleFilterChange('dateTo', value)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                {/* Tri */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Trier par</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                      <MenuItem value="created_time">Date de création</MenuItem>
                      <MenuItem value="nom">Nom</MenuItem>
                      {searchType === 'salons' && (
                        <>
                          <MenuItem value="ville">Ville</MenuItem>
                          <MenuItem value="rating">Note</MenuItem>
                        </>
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Ordre</InputLabel>
                    <Select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    >
                      <MenuItem value="desc">Plus récent d'abord</MenuItem>
                      <MenuItem value="asc">Plus ancien d'abord</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}
