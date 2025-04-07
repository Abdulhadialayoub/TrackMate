import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../../services/authService';
import { UserInfo } from '../../types/AuthTypes';

const HomeScreen = () => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.welcomeText}>
          Welcome, {user?.firstName || 'User'}!
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <Button 
                mode="outlined" 
                icon="clipboard-list-outline" 
                style={styles.actionButton}
                onPress={() => {/* Navigate to tasks */}}
              >
                View Tasks
              </Button>
              <Button 
                mode="outlined" 
                icon="plus-circle-outline" 
                style={styles.actionButton}
                onPress={() => {/* Navigate to create task */}}
              >
                Create Task
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Your Activity</Text>
            <View style={styles.activityContainer}>
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                No recent activity to display.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {user?.role === 'Admin' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">Team Management</Text>
              <View style={styles.quickActionsContainer}>
                <Button 
                  mode="outlined" 
                  icon="account-group" 
                  style={styles.actionButton}
                  onPress={() => {/* Navigate to team management */}}
                >
                  View Team
                </Button>
                <Button 
                  mode="outlined" 
                  icon="chart-bar" 
                  style={styles.actionButton}
                  onPress={() => {/* Navigate to analytics */}}
                >
                  Analytics
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
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
  welcomeText: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    margin: 4,
    minWidth: 130,
  },
  activityContainer: {
    marginTop: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    opacity: 0.6,
  },
});

export default HomeScreen; 