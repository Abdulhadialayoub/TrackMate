import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import userService from '../../services/userService';
import companyService from '../../services/companyService';

// This screen is only visible to Dev users

type DevStats = {
  totalUsers: number;
  totalCompanies: number;
};

const DevHomeScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<DevStats>({ totalUsers: 0, totalCompanies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch data to show system statistics
        const users = await userService.getUsers();
        const companies = await companyService.getCompanies();
        
        setStats({
          totalUsers: users.length,
          totalCompanies: companies.length
        });
      } catch (error) {
        console.error('Error fetching system stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
        <Text variant="headlineMedium" style={styles.title}>Developer Dashboard</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">System Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="displaySmall">{stats.totalUsers}</Text>
                <Text variant="bodyMedium">Total Users</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="displaySmall">{stats.totalCompanies}</Text>
                <Text variant="bodyMedium">Total Companies</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Management</Text>
            
            <List.Item
              title="Company Management"
              description="Create, view, and manage companies"
              left={props => <List.Icon {...props} icon="office-building" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* Navigate to company management */}}
            />
            <Divider />
            <List.Item
              title="User Management"
              description="Create, view, and manage users"
              left={props => <List.Icon {...props} icon="account-group" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* Navigate to user management */}}
            />
            <Divider />
            <List.Item
              title="Role Management"
              description="Manage user roles and permissions"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* Navigate to role management */}}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">System Actions</Text>
            <View style={styles.actionsContainer}>
              <Button 
                mode="contained-tonal" 
                icon="refresh" 
                style={styles.actionButton}
                onPress={() => {
                  setLoading(true);
                  // Refetch all data
                  setTimeout(() => {
                    setLoading(false);
                  }, 1000);
                }}
              >
                Refresh Data
              </Button>
              <Button 
                mode="contained-tonal" 
                icon="database" 
                style={styles.actionButton}
                onPress={() => {/* Show logs */}}
              >
                View Logs
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  actionButton: {
    margin: 4,
    minWidth: 140,
  },
});

export default DevHomeScreen; 