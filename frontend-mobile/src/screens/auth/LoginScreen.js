import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, TextInput, Button, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import NetInfo from '@react-native-community/netinfo';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);
  
  const { login } = useContext(AuthContext);

  // İnternet bağlantısını kontrol et
  useEffect(() => {
    const checkConnection = async () => {
      setCheckingConnection(true);
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        Alert.alert(
          "Bağlantı Hatası",
          "İnternet bağlantısı bulunamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
          [
            { 
              text: "Çıkış", 
              onPress: () => BackHandler.exitApp(),
              style: "cancel"
            },
            { 
              text: "Tekrar Dene", 
              onPress: () => checkConnection() 
            }
          ]
        );
      }
      
      setCheckingConnection(false);
    };
    
    checkConnection();
    
    // Bağlantı durumunu dinle
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        Alert.alert(
          "Bağlantı Kesildi",
          "İnternet bağlantınız kesildi. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
          [
            { 
              text: "Çıkış", 
              onPress: () => BackHandler.exitApp(),
              style: "cancel"
            },
            { 
              text: "Tekrar Dene", 
              onPress: () => checkConnection() 
            }
          ]
        );
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email ve şifre gereklidir');
      return;
    }
    
    // Önce internet bağlantısını kontrol et
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "Bağlantı Hatası",
        "İnternet bağlantısı bulunamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
        [
          { 
            text: "Çıkış", 
            onPress: () => BackHandler.exitApp(),
            style: "cancel"
          },
          { 
            text: "Tekrar Dene", 
            onPress: () => {} 
          }
        ]
      );
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      setError('Geçersiz email veya şifre');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingConnection) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Bağlantı kontrol ediliyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>TrackMate</Title>
          <Paragraph style={styles.subtitle}>İşletme Takip Çözümünüz</Paragraph>
        </View>
        
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
          />
          
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.loginButton}
            loading={loading}
            disabled={loading}
          >
            Giriş Yap
          </Button>
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Hesabınız yok mu?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#0284c7',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#0284c7',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#64748b',
  },
  registerText: {
    color: '#0284c7',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginScreen;