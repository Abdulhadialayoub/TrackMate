import React from 'react';
import { Snackbar, Alert, Box } from '@mui/material';
import { useAppContext } from '../../context/AppContext';

const Notifications = () => {
  const { notifications, removeNotification } = useAppContext();

  const handleClose = (id) => {
    removeNotification(id);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'static', transform: 'none' }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type || 'info'}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default Notifications;
