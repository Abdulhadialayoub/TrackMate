import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, TextInput, Button, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import NetInfo from '@react-native-community/netinfo';

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);
  
  const { register } = useContext(AuthContext);

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

  const handleRegister = async () => {
    // Validate inputs
    if (!firstName || !lastName || !email || !password || !confirmPassword || !companyName.trim()) {
      setError('Tüm alanlar doldurulmalıdır');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
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
      const registeredUser = await register({
        firstName,
        lastName,
        email,
        password,
        companyName: companyName.trim()
      });
      
      if (registeredUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: '(tabs)' }],
        });
      }
      
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Kayıt başarısız oldu. Lütfen tekrar deneyin.');
      console.error('Registration error:', err);
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
          <Title style={styles.title}>Hesap Oluştur</Title>
          <Paragraph style={styles.subtitle}>İşletmenizi yönetmek için TrackMate'e katılın</Paragraph>
        </View>
        
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            label="Şirket Adı"
            value={companyName}
            onChangeText={setCompanyName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Ad"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Soyad"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
          />
          
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
          
          <TextInput
            label="Şifre Tekrar"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
          />
          
          <Button 
            mode="contained" 
            onPress={handleRegister}
            style={styles.registerButton}
            loading={loading}
            disabled={loading}
          >
            Kayıt Ol
          </Button>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Giriş Yap</Text>
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
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 12,
  },
  registerButton: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#0284c7',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    color: '#64748b',
  },
  loginText: {
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

export default RegisterScreen;