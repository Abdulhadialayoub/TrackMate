import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { dashboardService } from '../../services';

const DashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    userCount: 0,
    orderCount: 0,
    revenue: 0,
    productCount: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard statistics from the API
      const statsData = await dashboardService.getDashboardStats();
      const recentOrdersData = await dashboardService.getRecentOrders(5);
      
      setStats({
        userCount: statsData.userCount || 0,
        orderCount: statsData.activeOrderCount || 0,
        revenue: statsData.revenue || 0,
        productCount: statsData.productCount || 0,
        recentOrders: recentOrdersData || []
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchDashboardData}
          style={styles.retryButton}
          color="#0284c7"
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.firstName || 'User'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="clipboard-list" size={24} color="#0284c7" />
            <View>
              <Title style={styles.statNumber}>{stats.orderCount}</Title>
              <Paragraph style={styles.statLabel}>Orders</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="account-group" size={24} color="#0284c7" />
            <View>
              <Title style={styles.statNumber}>{stats.userCount}</Title>
              <Paragraph style={styles.statLabel}>Customers</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color="#0284c7" />
            <View>
              <Title style={styles.statNumber}>{stats.productCount}</Title>
              <Paragraph style={styles.statLabel}>Products</Paragraph>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.revenueCard}>
        <Card>
          <Card.Content>
            <Title style={styles.revenueTitle}>Total Revenue</Title>
            <Title style={styles.revenueAmount}>${stats.revenue.toFixed(2)}</Title>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Orders')}
          color="#0284c7"
        >
          View All
        </Button>
      </View>

      {stats.recentOrders && stats.recentOrders.length > 0 ? (
        stats.recentOrders.map(order => (
          <Card key={order.id} style={styles.orderCard} onPress={() => navigation.navigate('Orders', { 
            screen: 'OrderDetails', 
            params: { orderId: order.id } 
          })}>
            <Card.Content>
              <View style={styles.orderHeader}>
                <Title style={styles.orderCustomer}>{order.customerName}</Title>
                <View style={[
                  styles.statusBadge, 
                  order.status === 'Completed' ? styles.statusCompleted : 
                  order.status === 'Processing' ? styles.statusProcessing : 
                  styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Paragraph style={styles.orderDate}>Date: {new Date(order.orderDate).toLocaleDateString()}</Paragraph>
                <Paragraph style={styles.orderTotal}>${(order.total || 0).toFixed(2)}</Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#9ca3af" />
            <Paragraph style={styles.emptyText}>No recent orders</Paragraph>
          </Card.Content>
        </Card>
      )}

      <View style={styles.actionButtons}>
        <Button 
          mode="contained" 
          icon="plus" 
          onPress={() => navigation.navigate('Orders', { screen: 'NewOrder' })}
          style={styles.actionButton}
          color="#0284c7"
        >
          New Order
        </Button>
        <Button 
          mode="outlined" 
          icon="account-plus" 
          onPress={() => navigation.navigate('Customers', { screen: 'NewCustomer' })}
          style={styles.actionButton}
          color="#0284c7"
        >
          Add Customer
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 0,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
  revenueCard: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  revenueTitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#047857',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  orderCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusProcessing: {
    backgroundColor: '#e0f2fe',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  orderDate: {
    color: '#6b7280',
  },
  orderTotal: {
    fontWeight: 'bold',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 8,
    color: '#9ca3af',
  },
  actionButtons: {
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default DashboardScreen;