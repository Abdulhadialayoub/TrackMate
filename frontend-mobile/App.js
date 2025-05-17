import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import AuthProvider from './src/context/AuthContext';
import { theme } from './src/theme';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

// Create a theme with proper linking config
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f9fafb'
  }
};

// For debugging navigation
const linking = {
  prefixes: ['trackmate://'],
  config: {
    screens: {
      MainNavigator: {
        screens: {
          MainTabs: {
            screens: {
              Products: {
                screens: {
                  ProductsList: 'products',
                  ProductDetails: 'products/:productId',
                  AddProduct: 'products/add',
                  EditProduct: 'products/edit/:productId',
                }
              },
            }
          }
        }
      }
    }
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer 
            theme={navigationTheme}
            linking={linking}
            fallback={<StatusBar style="auto" />}
          >
            <StatusBar style="auto" />
            <MainNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}