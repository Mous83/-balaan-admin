import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search,
  Business,
  Person,
  SupportAgent,
  LocalOffer,
  Clear,
  TrendingUp
} from '@mui/icons-material';
import { collection, query, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackAdminAction } from '../../utils/analytics';

export default function GlobalSearch({ onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  useEffect(() => {
    // Charger les recherches récentes
    const saved = localStorage.getItem('balaan_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fermer la recherche quand on change de page
  useEffect(() => {
    setIsOpen(false);
    setShowResults(false);
    setSearchTerm('');
    setResults([]);
  }, [location.pathname]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      performSearch();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults = [];

      // Recherche dans les salons
      const salonsRef = collection(db, 'salons');
      const salonsQuery = query(salonsRef, limit(5));
      const salonsSnapshot = await getDocs(salonsQuery);
      
      salonsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.adresse?.ville?.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'salon',
            name: data.nom,
            subtitle: `${data.adresse?.ville || ''} - ${data.kyc_status || 'Non vérifié'}`,
            data: data
          });
        }
      });

      // Recherche dans les utilisateurs
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, limit(5));
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'user',
            name: data.nom || data.email,
            subtitle: `${data.role || 'Utilisateur'} - ${data.email || ''}`,
            data: data
          });
        }
      });

      // Recherche dans les tickets de support
      const ticketsRef = collection(db, 'support_tickets');
      const ticketsQuery = query(ticketsRef, limit(3));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      ticketsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.message?.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'ticket',
            name: data.subject,
            subtitle: `${data.status || 'Ouvert'} - ${data.priority || 'Normal'}`,
            subject: data.subject,
            data: data
          });
        }
      });

      // Recherche dans les promos
      const promosRef = collection(db, 'promos');
      const promosQuery = query(promosRef, limit(3));
      const promosSnapshot = await getDocs(promosQuery);
      
      promosSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'promo',
            name: data.code,
            subtitle: `${data.discount_type} - ${data.discount_value}${data.discount_type === 'percentage' ? '%' : '€'}`,
            data: data
          });
        }
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    searchRef.current?.focus();
  };

  const handleResultClick = (result) => {
    // Sauvegarder dans les recherches récentes
    const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('balaan_recent_searches', JSON.stringify(updated));

    // Navigation avec paramètres pour filtrer
    switch (result.type) {
      case 'salon':
        navigate('/salons', { state: { searchFilter: result.name } });
        break;
      case 'user':
        navigate('/users', { state: { searchFilter: result.name } });
        break;
      case 'ticket':
        navigate('/support', { state: { searchFilter: result.subject } });
        break;
      case 'promo':
        navigate('/promos', { state: { searchFilter: result.name } });
        break;
    }

    trackAdminAction('global_search_click', 'search', { 
      term: searchTerm, 
      result_type: result.type 
    });
    
    onClose?.();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'salon': return <Business />;
      case 'user': return <Person />;
      case 'ticket': return <SupportAgent />;
      case 'promo': return <LocalOffer />;
      default: return <Search />;
    }
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'salon': return 'primary';
      case 'user': return 'secondary';
      case 'ticket': return 'warning';
      case 'promo': return 'success';
      default: return 'default';
    }
  };

  const totalResults = results.length;

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <TextField
        ref={searchRef}
        fullWidth
        size="small"
        placeholder="Rechercher salons, utilisateurs, tickets..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => {
          setShowResults(true);
          setIsOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowResults(false);
            setIsOpen(false);
          }, 200);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={clearSearch}>
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          },
        }}
      />

      {/* Résultats */}
      {showResults && isOpen && (searchTerm.length >= 2 || recentSearches.length > 0) && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 400,
            overflow: 'auto',
            mt: 1,
            boxShadow: 3
          }}
        >
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!loading && searchTerm.length >= 2 && (
            <>
              {totalResults > 0 && (
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}

              <List dense>
                {results.map((result, index) => (
                  <ListItem
                    key={`${result.type}-${result.id}`}
                    button
                    onClick={() => handleResultClick(result)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getResultIcon(result.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" noWrap>
                            {result.name}
                          </Typography>
                          <Chip 
                            label={result.type} 
                            size="small" 
                            color={getResultColor(result.type)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={result.subtitle}
                    />
                  </ListItem>
                ))}
              </List>

              {totalResults === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    Aucun résultat pour "{searchTerm}"
                  </Typography>
                </Box>
              )}
            </>
          )}

          {!loading && searchTerm.length < 2 && recentSearches.length > 0 && (
            <>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp fontSize="small" />
                  Recherches récentes
                </Typography>
              </Box>
              <List dense>
                {recentSearches.map((result, index) => (
                  <ListItem
                    key={`recent-${result.id}`}
                    button
                    onClick={() => handleResultClick(result)}
                  >
                    <ListItemIcon>
                      {getResultIcon(result.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.name}
                      secondary={result.subtitle}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
