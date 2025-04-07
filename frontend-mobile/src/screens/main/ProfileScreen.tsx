import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Avatar, List, Portal, Dialog, TextInput } from 'react-native-paper';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { UserInfo } from '../../types/AuthTypes';

const ProfileScreen = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Navigation will be handled by AppNavigator based on auth state
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    setUpdatingPassword(true);
    
    try {
      await userService.updatePassword(user.id, currentPassword, newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setPasswordDialogVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Error loading profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={`${user.firstName[0]}${user.lastName[0]}`} 
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        <Text variant="bodyLarge" style={styles.role}>
          {user.role}
        </Text>
      </View>

      <List.Section>
        <List.Item
          title="Email"
          description={user.email}
          left={props => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Username"
          description={user.username}
          left={props => <List.Icon {...props} icon="account" />}
        />
        <List.Item
          title="Phone"
          description={user.phone || 'Not provided'}
          left={props => <List.Icon {...props} icon="phone" />}
        />
        <List.Item
          title="Company"
          description={user.company?.name || 'Not available'}
          left={props => <List.Icon {...props} icon="office-building" />}
        />
      </List.Section>

      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          onPress={() => setPasswordDialogVisible(true)}
          style={styles.actionButton}
        >
          Change Password
        </Button>
        
        <Button 
          mode="contained" 
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>

      <Portal>
        <Dialog visible={passwordDialogVisible} onDismiss={() => setPasswordDialogVisible(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleUpdatePassword} 
              loading={updatingPassword}
              disabled={updatingPassword}
            >
              Update
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  role: {
    marginTop: 4,
    opacity: 0.7,
  },
  buttonContainer: {
    padding: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
});

export default ProfileScreen; 