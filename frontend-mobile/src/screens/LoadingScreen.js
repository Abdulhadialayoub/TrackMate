import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0284c7" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#0284c7',
  },
});

export default LoadingScreen;