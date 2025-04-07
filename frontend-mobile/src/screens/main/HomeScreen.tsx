import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Welcome to TrackMate</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Your fleet management solution
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
});

export default HomeScreen; 