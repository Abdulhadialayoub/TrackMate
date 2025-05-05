import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, BackHandler } from 'react-native';
import { Text, TextInput, Button, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);

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

  const handleResetPassword = async () => {
    if (!email) {
      setError('Email adresi gereklidir');
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
      
      // Burada gerçek API çağrısı yapılacak
      // Şimdilik simüle ediyoruz
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 2000);
      
    } catch (err) {
      setError('Şifre sıfırlama işlemi başarısız oldu. Lütfen tekrar deneyin.');
      console.error('Password reset error:', err);
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>Şifremi Unuttum</Title>
          <Paragraph style={styles.subtitle}>
            {success 
              ? 'Şifre sıfırlama talimatları email adresinize gönderildi.' 
              : 'Email adresinizi girin ve şifre sıfırlama talimatlarını alın.'}
          </Paragraph>
        </View>
        
        {!success ? (
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
              disabled={loading}
            />
            
            <Button 
              mode="contained" 
              onPress={handleResetPassword}
              style={styles.resetButton}
              loading={loading}
              disabled={loading}
            >
              Şifremi Sıfırla
            </Button>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Giriş Sayfasına Dön
            </Button>
          </View>
        )}
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
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#0284c7',
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
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
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#0284c7',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginButton: {
    marginTop: 20,
    paddingVertical: 6,
    backgroundColor: '#0284c7',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;