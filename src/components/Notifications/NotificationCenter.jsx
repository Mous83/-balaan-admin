/**
 * 🔔 CENTRE DE NOTIFICATIONS BALAAN ADMIN
 * Hub centralisé pour toutes les notifications
 */

import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Tab,
  Tabs,
  Card,
  CardContent
} from '@mui/material';
import {
  Notifications,
  Business,
  VerifiedUser,
  SupportAgent,
  Person,
  CheckCircle,
  Warning,
  Info,
  Error,
  Clear,
  MarkEmailRead,
  DeleteSweep
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { trackAdminAction } from '../../utils/analytics';

const NOTIFICATION_TYPES = {
  salon_new: {
    icon: <Business />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
    label: 'Nouveau salon'
  },
  kyc_pending: {
    icon: <VerifiedUser />,
    color: '#ff9800',
    bgColor: '#fff3e0',
    label: 'KYC à vérifier'
  },
  support_ticket: {
    icon: <SupportAgent />,
    color: '#f44336',
    bgColor: '#ffebee',
    label: 'Ticket support'
  },
  user_new: {
    icon: <Person />,
    color: '#4caf50',
    bgColor: '#e8f5e8',
    label: 'Nouvel utilisateur'
  },
  system: {
    icon: <Info />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    label: 'Système'
  }
};

const PRIORITIES = {
  high: { color: 'error', label: 'Haute' },
  medium: { color: 'warning', label: 'Moyenne' },
  low: { color: 'info', label: 'Basse' }
};

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  useEffect(() => {
    // Écouter les notifications en temps réel
    const notificationsRef = collection(db, 'admin_notifications');
    const q = query(
      notificationsRef,
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    trackAdminAction('notification_center_open', 'notifications');
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, 'admin_notifications', notificationId);
      await updateDoc(notifRef, {
        read: true,
        read_at: new Date()
      });

      trackAdminAction('notification_read', 'notifications', {
        notification_id: notificationId
      });
    } catch (error) {
      console.error('Erreur mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const unreadNotifs = notifications.filter(n => !n.read);
      
      const promises = unreadNotifs.map(notif => {
        const notifRef = doc(db, 'admin_notifications', notif.id);
        return updateDoc(notifRef, {
          read: true,
          read_at: new Date()
        });
      });

      await Promise.all(promises);
      
      trackAdminAction('notifications_mark_all_read', 'notifications', {
        count: unreadNotifs.length
      });
    } catch (error) {
      console.error('Erreur mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notifRef = doc(db, 'admin_notifications', notificationId);
      await updateDoc(notifRef, {
        deleted: true,
        deleted_at: new Date()
      });

      trackAdminAction('notification_delete', 'notifications', {
        notification_id: notificationId
      });
    } catch (error) {
      console.error('Erreur delete notification:', error);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications.filter(n => !n.deleted);

    switch (activeTab) {
      case 1: // Non lues
        filtered = filtered.filter(n => !n.read);
        break;
      case 2: // KYC
        filtered = filtered.filter(n => n.type === 'kyc_pending');
        break;
      case 3: // Support
        filtered = filtered.filter(n => n.type === 'support_ticket');
        break;
      default: // Toutes
        break;
    }

    return filtered;
  };

  const handleNotificationClick = (notification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Naviguer vers la page appropriée
    switch (notification.type) {
      case 'salon_new':
      case 'kyc_pending':
        window.location.href = '/kyc';
        break;
      case 'support_ticket':
        window.location.href = '/support';
        break;
      case 'user_new':
        window.location.href = '/users';
        break;
      default:
        break;
    }

    handleClose();
  };

  const NotificationItem = ({ notification }) => {
    const type = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
    const priority = PRIORITIES[notification.priority] || PRIORITIES.medium;

    return (
      <ListItem
        button
        onClick={() => handleNotificationClick(notification)}
        sx={{
          backgroundColor: notification.read ? 'transparent' : 'action.hover',
          borderLeft: `4px solid ${type.color}`,
          mb: 1,
          borderRadius: 1
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ backgroundColor: type.bgColor, color: type.color }}>
            {type.icon}
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                {notification.title}
              </Typography>
              {!notification.read && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'primary.main' }} />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                {notification.message}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={type.label} 
                  size="small" 
                  sx={{ backgroundColor: type.bgColor, color: type.color }} 
                />
                <Chip 
                  label={priority.label} 
                  size="small" 
                  color={priority.color}
                  variant="outlined"
                />
                <Typography variant="caption" color="textSecondary">
                  {formatDistanceToNow(notification.created_at, { addSuffix: true, locale: fr })}
                </Typography>
              </Box>
            </Box>
          }
        />

        <ListItemSecondaryAction>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
          >
            <Clear fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Notifications</Typography>
            <Box>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={markAllAsRead}
                  disabled={loading}
                >
                  Tout marquer lu
                </Button>
              )}
            </Box>
          </Box>
          
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
            <Tab label="Toutes" />
            <Tab label={`Non lues (${unreadCount})`} />
            <Tab label="KYC" />
            <Tab label="Support" />
          </Tabs>
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredNotifications.length > 0 ? (
            <List sx={{ p: 1 }}>
              {filteredNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="body1" color="textSecondary">
                Aucune notification
              </Typography>
            </Box>
          )}
        </Box>

        {filteredNotifications.length > 0 && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Button
              fullWidth
              variant="text"
              startIcon={<DeleteSweep />}
              onClick={() => {
                // Implémenter la suppression en masse
                trackAdminAction('notifications_clear_all', 'notifications');
              }}
            >
              Effacer toutes les notifications
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
