import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Divider, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../../services/authService';
import { UserInfo } from '../../types/AuthTypes';

const ProfileScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await authService.logout();
              // The navigation update will be handled by the navigator
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Avatar.Text 
            size={80} 
            label={getInitials(user?.firstName, user?.lastName)} 
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text variant="bodyLarge">{user?.role}</Text>
          <Text variant="bodyMedium">{user?.email}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Profile Information</Text>
            <List.Item
              title="Username"
              description={user?.username}
              left={props => <List.Icon {...props} icon="account" />}
            />
            <Divider />
            <List.Item
              title="Email"
              description={user?.email}
              left={props => <List.Icon {...props} icon="email" />}
            />
            <Divider />
            <List.Item
              title="Phone"
              description={user?.phone || 'Not provided'}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            <Divider />
            <List.Item
              title="Company ID"
              description={String(user?.companyId)}
              left={props => <List.Icon {...props} icon="office-building" />}
            />
            <Divider />
            <List.Item
              title="Role"
              description={user?.role}
              left={props => <List.Icon {...props} icon="shield-account" />}
            />
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            icon="account-edit" 
            style={styles.editButton}
            onPress={() => {/* Navigate to edit profile */}}
          >
            Edit Profile
          </Button>
          <Button 
            mode="outlined" 
            icon="logout" 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionButtons: {
    marginBottom: 24,
  },
  editButton: {
    marginBottom: 12,
  },
  logoutButton: {
    borderColor: 'red',
    borderWidth: 1,
  },
});

export default ProfileScreen; 