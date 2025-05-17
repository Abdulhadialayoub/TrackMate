import React, { useContext, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// NavigationContainer import'unu kaldırıyoruz
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from '../src/context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import OrdersAIAnalysis from '../src/screens/main/OrdersAIAnalysis';
import OrderAIAnalysisScreen from '../src/screens/details/OrderAIAnalysis';
// Import screens
import CategoriesScreen from '../src/screens/main/CategoriesScreen';
import InvoicesScreen from '../src/screens/main/InvoicesScreen';
import DashboardScreen from '../src/screens/main/DashboardScreen';
import OrdersScreen from '../src/screens/main/OrdersScreen';
import CustomersScreen from '../src/screens/main/CustomersScreen';
import ProductDetailsScreen from '../src/screens/details/ProductDetailsScreen';
import NewProductScreen from '../src/screens/forms/NewProductScreen';
import ProductsScreen from '../src/screens/main/ProductsScreen';
import ProfileScreen from '../src/screens/main/ProfileScreen';
import OrderDetailsScreen from '../src/screens/details/OrderDetailsScreen';
import NewOrderScreen from '../src/screens/forms/NewOrderScreen';
import NewCustomerScreen from '../src/screens/forms/NewCustomerScreen';
import LoginScreen from '../src/screens/auth/LoginScreen';
import RegisterScreen from '../src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../src/screens/auth/ForgotPasswordScreen';
import InvoiceDetailsScreen from '../src/screens/details/InvoiceDetailsScreen';
import CustomerDetailsScreen from '../src/screens/details/CustomerDetailsScreen';
import { tr } from 'date-fns/locale';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        headerShown: false,
      }}
    >
      
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomersScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Auth stack navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Main stack navigator with authenticated screens
function MainStack() {
  return (
    <Stack.Navigator>
      
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CategoriesScreen" 
        component={CategoriesScreen} 
        options={{ headerShown: false}}
      />
      <Stack.Screen   
        name="InvoiceScreen" 
        component={InvoicesScreen} />
      <Stack.Screen name="EditProduct" component={NewProductScreen} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
      <Stack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="NewOrder" component={NewOrderScreen}  />
      <Stack.Screen name="NewCustomer" component={NewCustomerScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="NewProduct" component={NewProductScreen} />
      <Stack.Screen name="OrdersAIAnalysis" component={OrdersAIAnalysis } options={{headerShown: false}} />
      <Stack.Screen name="OrderAIAnalysis" component={OrderAIAnalysisScreen} options={{headerShown: false}}/>
    </Stack.Navigator>
  );
}

// Root navigator that checks auth state
function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }
  
  return user ? <MainStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        {/* NavigationContainer'ı kaldırıyoruz */}
        <RootNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});