import React, { useState, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { TabView, SceneMap, TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { Card, Title, Paragraph, ActivityIndicator, Button, useTheme, Divider, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios'; // Assuming you'll use axios for API calls
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../src/config/constants';

// Placeholder for API configuration - replace with your actual config
const apiBaseUrl = 'https://localhost:7092/api'; // Replace with your backend URL (Using web URL for potential testing)
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN); // Use constant from config
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Define the type for our routes
type Route = { key: string; title: string; icon: string };

// --- Tab Components --- 

const SystemRoute = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalCompanies: 0, activeUsers: 0, version: 'N/A', uptime: 'N/A' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt to fetch from API
      // const response = await api.get('/System/stats'); 
      // setStats(response.data);

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      // Simulate potential API error during development
      // if (Math.random() > 0.7) throw new Error("Simulated API Error"); 
      setStats({
        totalUsers: 15, // Example data
        totalCompanies: 5,
        activeUsers: 12,
        version: '1.0.0-mobile',
        uptime: '1h 15m'
      });

    } catch (err: any) {
      console.error("Error fetching system stats:", err);
      setError(err.message || "Failed to fetch system stats.");
      // Keep previous stats or reset, depending on desired behavior
      setStats({ totalUsers: 0, totalCompanies: 0, activeUsers: 0, version: 'N/A', uptime: 'N/A' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <View style={styles.tabContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>System Statistics</Title>
          {loading && <ActivityIndicator animating={true} style={{ marginVertical: 10 }}/>}
          {!loading && error && (
            <Text style={{ color: useTheme().colors.error, marginVertical: 10 }}>
              Error: {error}
            </Text>
          )}
          {!loading && !error && (
            <>
              <Paragraph>Total Users: {stats.totalUsers}</Paragraph>
              <Paragraph>Active Users: {stats.activeUsers}</Paragraph>
              <Paragraph>Total Companies: {stats.totalCompanies}</Paragraph>
              <Divider style={styles.divider} />
              <Paragraph>App Version: {stats.version}</Paragraph>
              <Paragraph>Uptime: {stats.uptime}</Paragraph>
            </>
          )}
          <Button 
            icon="refresh" 
            mode="outlined" 
            onPress={fetchStats} 
            disabled={loading}
            style={{ marginTop: 15 }}
          >
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </Button>
        </Card.Content>
      </Card>
      {/* Add more system info cards here if needed */}
    </View>
  );
};

const DatabaseRoute = () => (
  <View style={styles.tabContainer}>
    <Card style={styles.card}>
      <Card.Content>
        <Title>Database Management</Title>
        <Paragraph>Backup, Restore, Reset actions will be here.</Paragraph>
        {/* TODO: Implement Database actions */}
        <Button icon="database-cog-outline" mode="contained" style={styles.button} onPress={() => alert('TODO: Backup')}>Backup Database</Button>
        <Button icon="database-import-outline" mode="outlined" style={styles.button} onPress={() => alert('TODO: Restore')}>Restore Database</Button>
        <Button icon="database-remove-outline" mode="outlined" color={useTheme().colors.error} style={styles.button} onPress={() => alert('TODO: Reset')}>Reset Database</Button>
      </Card.Content>
    </Card>
  </View>
);

const UsersRoute = () => (
  <View style={styles.tabContainer}>
    <Card style={styles.card}>
      <Card.Content>
        <Title>User Management</Title>
        <Paragraph>User list, add, edit, delete actions will be here.</Paragraph>
        {/* TODO: Implement User management table/list */}
        <Button icon="account-plus-outline" mode="contained" style={styles.button} onPress={() => alert('TODO: Add User')}>Add User</Button>
      </Card.Content>
    </Card>
  </View>
);

const CompaniesRoute = () => (
  <View style={styles.tabContainer}>
    <Card style={styles.card}>
      <Card.Content>
        <Title>Company Management</Title>
        <Paragraph>Company list, add, edit, delete actions will be here.</Paragraph>
        {/* TODO: Implement Company management table/list */}
        <Button icon="domain-plus" mode="contained" style={styles.button} onPress={() => alert('TODO: Add Company')}>Add Company</Button>
      </Card.Content>
    </Card>
  </View>
);

const ConfigurationRoute = () => (
  <View style={styles.tabContainer}>
    <Card style={styles.card}>
      <Card.Content>
        <Title>Configuration</Title>
        <Paragraph>System settings, Email config will be here.</Paragraph>
        {/* TODO: Implement Configuration settings */}
        <Button icon="cog-outline" mode="contained" style={styles.button} onPress={() => alert('TODO: Save Config')}>Save Configuration</Button>
      </Card.Content>
    </Card>
  </View>
);

// Scene map for TabView
const renderScene = SceneMap({
  system: SystemRoute,
  database: DatabaseRoute,
  users: UsersRoute,
  companies: CompaniesRoute,
  configuration: ConfigurationRoute,
});

// --- Main DevPanel Component --- 

export function DevPanel() {
  const layout = useWindowDimensions();
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState<Route[]>([
    { key: 'system', title: 'System', icon: 'monitor-dashboard' },
    { key: 'database', title: 'Database', icon: 'database' },
    { key: 'users', title: 'Users', icon: 'account-group' },
    { key: 'companies', title: 'Companies', icon: 'domain' },
    { key: 'configuration', title: 'Config', icon: 'cog' }, // Shortened title for mobile
  ]);

  // Simplified TabBar props
  const renderTabBar = (props: SceneRendererProps & { navigationState: NavigationState<Route> }) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={{ backgroundColor: theme.colors.elevation.level2 }} 
      scrollEnabled={true}
      tabStyle={{ width: 'auto' }} 
      // Removed renderIcon and renderLabel to avoid type issues for now
      // Icons can be added back later if needed, potentially with adjustments
      //labelStyle={{ color: theme.colors.onSurface, textTransform: 'none' }} // Basic label styling
    />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={renderTabBar}
      style={styles.tabViewContainer}
    />
  );
}

const styles = StyleSheet.create({
  tabViewContainer: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5', // Or use theme.colors.background
  },
  card: {
    marginVertical: 8, // Use vertical margin
  },
  button: {
    marginTop: 10,
  },
  divider: {
    marginVertical: 10,
  }
}); 