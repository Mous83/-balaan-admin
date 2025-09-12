/**
 * 🌙 THEME CONTEXT - MODE SOMBRE
 * Gestion du thème clair/sombre
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

// Thème clair PREMIUM BALAAN
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#D4AF37', // Or premium
      light: '#F5E6A3',
      dark: '#B8941F',
    },
    secondary: {
      main: '#8B7355', // Beige foncé
      light: '#A68B5B',
      dark: '#6B5B47',
    },
    background: {
      default: '#FAF8F3', // Beige très clair
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2416', // Brun foncé
      secondary: '#6B5B47', // Beige foncé
    },
    success: {
      main: '#8FBC8F', // Vert sauge
      light: '#B2D4B2',
      dark: '#6B8E6B',
    },
    warning: {
      main: '#DAA520', // Or foncé
      light: '#F4D03F',
      dark: '#B8860B',
    },
    error: {
      main: '#CD853F', // Brun rosé
      light: '#DEB887',
      dark: '#A0522D',
    },
    info: {
      main: '#B8941F', // Or antique
      light: '#D4AF37',
      dark: '#8B7000',
    },
  },
  typography: {
    fontFamily: '"Playfair Display", "Georgia", "serif"', // Police premium
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.25px',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '0px',
    },
    h5: {
      fontWeight: 500,
      letterSpacing: '0px',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    body1: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      letterSpacing: '0.15px',
    },
    body2: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      letterSpacing: '0.25px',
    },
    button: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)', // Ombre dorée
          borderRadius: 16,
          border: '1px solid rgba(212, 175, 55, 0.1)',
          background: 'linear-gradient(145deg, #ffffff 0%, #fefcf7 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
          padding: '12px 24px',
          boxShadow: '0 4px 16px rgba(212, 175, 55, 0.2)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)',
          color: '#2C2416',
          '&:hover': {
            background: 'linear-gradient(135deg, #B8941F 0%, #D4AF37 100%)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F3 100%)',
          color: '#2C2416',
          boxShadow: '0 4px 20px rgba(212, 175, 55, 0.1)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F3 100%)',
          borderRight: '1px solid rgba(212, 175, 55, 0.2)',
          boxShadow: '4px 0 20px rgba(212, 175, 55, 0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)',
            color: '#2C2416',
            '&:hover': {
              background: 'linear-gradient(135deg, #B8941F 0%, #D4AF37 100%)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)',
          color: '#2C2416',
        },
      },
    },
  },
});

// Thème sombre PREMIUM BALAAN
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F5E6A3', // Or clair pour le sombre
      light: '#FFF8DC',
      dark: '#D4AF37',
    },
    secondary: {
      main: '#A68B5B', // Beige pour le sombre
      light: '#C4A373',
      dark: '#8B7355',
    },
    background: {
      default: '#1A1611', // Brun très foncé
      paper: '#2C2416', // Brun foncé
    },
    text: {
      primary: '#F5E6A3', // Or clair
      secondary: '#C4A373', // Beige clair
    },
    success: {
      main: '#B2D4B2', // Vert sauge clair
      light: '#D4F4D4',
      dark: '#8FBC8F',
    },
    warning: {
      main: '#F4D03F', // Or vif
      light: '#F7DC6F',
      dark: '#DAA520',
    },
    error: {
      main: '#DEB887', // Beige rosé
      light: '#F5DEB3',
      dark: '#CD853F',
    },
    info: {
      main: '#D4AF37', // Or
      light: '#F5E6A3',
      dark: '#B8941F',
    },
  },
  typography: {
    fontFamily: '"Playfair Display", "Georgia", "serif"', // Police premium
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
      color: '#F5E6A3',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
      color: '#F5E6A3',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.25px',
      color: '#F5E6A3',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '0px',
      color: '#F5E6A3',
    },
    h5: {
      fontWeight: 500,
      letterSpacing: '0px',
      color: '#F5E6A3',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '0.15px',
      color: '#F5E6A3',
    },
    body1: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      letterSpacing: '0.15px',
    },
    body2: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      letterSpacing: '0.25px',
    },
    button: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 32px rgba(245, 230, 163, 0.1)', // Ombre dorée sombre
          borderRadius: 16,
          border: '1px solid rgba(245, 230, 163, 0.2)',
          background: 'linear-gradient(145deg, #2C2416 0%, #1A1611 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
          padding: '12px 24px',
          boxShadow: '0 4px 16px rgba(245, 230, 163, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(245, 230, 163, 0.25)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)',
          color: '#1A1611',
          '&:hover': {
            background: 'linear-gradient(135deg, #F5E6A3 0%, #FFF8DC 100%)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #2C2416 0%, #1A1611 100%)',
          color: '#F5E6A3',
          boxShadow: '0 4px 20px rgba(245, 230, 163, 0.1)',
          borderBottom: '1px solid rgba(245, 230, 163, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #2C2416 0%, #1A1611 100%)',
          borderRight: '1px solid rgba(245, 230, 163, 0.2)',
          boxShadow: '4px 0 20px rgba(245, 230, 163, 0.1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)',
            color: '#1A1611',
            '&:hover': {
              background: 'linear-gradient(135deg, #F5E6A3 0%, #FFF8DC 100%)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(245, 230, 163, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%)',
          color: '#1A1611',
        },
      },
    },
  },
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

export const ThemeContextProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Récupérer la préférence sauvegardée ou utiliser la préférence système
    const saved = localStorage.getItem('balaan_admin_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    
    // Préférence système
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sauvegarder la préférence
  useEffect(() => {
    localStorage.setItem('balaan_admin_theme', isDarkMode ? 'dark' : 'light');
    
    // Mettre à jour la meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? '#1e1e1e' : '#1976d2');
    }
  }, [isDarkMode]);

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Seulement si l'utilisateur n'a pas de préférence explicite
      const saved = localStorage.getItem('balaan_admin_theme');
      if (saved === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    isDarkMode,
    toggleTheme,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
