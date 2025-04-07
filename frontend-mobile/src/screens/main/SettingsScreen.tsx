import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch, Text, useTheme } from 'react-native-paper';

const SettingsScreen = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>App Settings</List.Subheader>
        
        <List.Item
          title="Push Notifications"
          description="Receive notifications about your fleet"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
            />
          )}
        />

        <List.Item
          title="Dark Mode"
          description="Use dark theme"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>About</List.Subheader>
        
        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />

        <List.Item
          title="Terms of Service"
          description="Read our terms and conditions"
          left={props => <List.Icon {...props} icon="file-document" />}
          onPress={() => {/* TODO: Navigate to Terms */}}
        />

        <List.Item
          title="Privacy Policy"
          description="Read our privacy policy"
          left={props => <List.Icon {...props} icon="shield-account" />}
          onPress={() => {/* TODO: Navigate to Privacy Policy */}}
        />
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen; 