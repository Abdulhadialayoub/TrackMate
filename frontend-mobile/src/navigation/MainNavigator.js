import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import CustomersScreen from '../screens/main/CustomersScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import InvoicesScreen from '../screens/main/InvoicesScreen';
import CategoriesScreen from '../screens/main/CategoriesScreen';
import OrdersAIAnalysis from '../screens/main/OrdersAIAnalysis';

// Import detail screens
import OrderDetailsScreen from '../screens/details/OrderDetailsScreen';
import CustomerDetailsScreen from '../screens/details/CustomerDetailsScreen';
import ProductDetailsScreen from '../screens/details/ProductDetailsScreen';
import InvoiceDetailsScreen from '../screens/details/InvoiceDetailsScreen';
import OrderAIAnalysis from '../screens/details/OrderAIAnalysis';

// Import form screens
import NewOrderScreen from '../screens/forms/NewOrderScreen';
import NewCustomerScreen from '../screens/forms/NewCustomerScreen';
import NewProductScreen from '../screens/forms/NewProductScreen';

// Create common stack for all form screens and details
const CommonStack = createNativeStackNavigator();
const CommonNavigator = () => {
  return (
    <CommonStack.Navigator>
      {/* Product Screens */}
      <CommonStack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen} 
        options={{ headerShown: false, title: 'Product Details' }}
      />
      <CommonStack.Screen 
        name="AddProduct" 
        component={NewProductScreen} 
        options={{ headerShown: false, title: 'Add Product' }}
      />
      <CommonStack.Screen 
        name="EditProduct" 
        component={NewProductScreen} 
        options={{ headerShown: false, title: 'Edit Product' }}
      />
      
      {/* Customer Screens */}
      <CommonStack.Screen 
        name="CustomerDetails" 
        component={CustomerDetailsScreen} 
        options={{ headerShown: false, title: 'Customer Details' }}
      />
      <CommonStack.Screen 
        name="NewCustomer" 
        component={NewCustomerScreen} 
        options={{ headerShown: false, title: 'New Customer' }}
      />
      
      {/* Order Screens */}
      <CommonStack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen} 
        options={{ headerShown: false, title: 'Order Details' }}
      />
      <CommonStack.Screen 
        name="NewOrder" 
        component={NewOrderScreen} 
        options={{ headerShown: false, title: 'New Order' }}
      />
      
      {/* Invoice Screens */}
      <CommonStack.Screen 
        name="InvoiceDetails" 
        component={InvoiceDetailsScreen} 
        options={{ headerShown: false, title: 'InvoiceDetails' }}
      />
    </CommonStack.Navigator>
  );
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabs = () => {
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
        headerShown: true,
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
        name="Invoices" 
        component={InvoicesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-outline" color={color} size={size} />
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
        name="Categories" 
        component={CategoriesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder" color={color} size={size} />
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
};

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CommonScreens" component={CommonNavigator} />
      
      {/* Directly add the frequently used screens for more direct navigation */}
      <Stack.Screen 
      name='CategoriesScreen'
      component={CategoriesScreen}
      options={{ headerShown: false, title: 'Categories' }}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen} 
        options={{ headerShown: true, title: 'Product Details' }}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={NewProductScreen} 
        options={{ headerShown: true, title: 'Add Product' }}
      />
      <Stack.Screen 
        name="EditProduct" 
        component={NewProductScreen} 
        options={{ headerShown: true, title: 'Edit Product' }}
      />
      <Stack.Screen 
        name="InvoiceDetails" 
        component={InvoiceDetailsScreen} 
        options={{ headerShown: true, title: 'InvoiceDetails' }}
      />
      
      
    </Stack.Navigator>

  );
};

export default MainNavigator;