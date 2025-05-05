import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Title, Button, Avatar, TextInput, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={`${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`} 
          backgroundColor="#0284c7" 
        />
        <Title style={styles.userName}>{user?.firstName} {user?.lastName}</Title>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Profile Information</Title>
          
          {editing ? (
            <View style={styles.formContainer}>
              <TextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({...formData, firstName: text})}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({...formData, lastName: text})}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
              />
              <TextInput
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="outlined" 
                  onPress={() => setEditing(false)} 
                  style={styles.button}
                  color="#6b7280"
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSaveProfile} 
                  style={styles.button}
                  color="#0284c7"
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{user?.firstName} {user?.lastName}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="shield-account" size={20} color="#6b7280" />
                <Text style={styles.infoLabel}>Role:</Text>
                <Text style={styles.infoValue}>{user?.role}</Text>
              </View>
              
              <Button 
                mode="contained" 
                onPress={() => setEditing(true)} 
                style={styles.editButton}
                color="#0284c7"
                icon="account-edit"
              >
                Edit Profile
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Settings</Title>
          
          <Button 
            mode="text" 
            // Explicitly navigate within the Profile stack
            // onPress={() => navigation.navigate('Profile', { screen: 'ChangePassword' })}
            onPress={() => alert('Screen not implemented yet')} // Placeholder
            style={styles.settingButton}
            icon="lock"
            color="#4b5563"
            disabled // Disable until implemented
          >
            Change Password
          </Button>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="text" 
            // Explicitly navigate within the Profile stack
            // onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
            onPress={() => alert('Screen not implemented yet')} // Placeholder
            style={styles.settingButton}
            icon="bell"
            color="#4b5563"
            disabled // Disable until implemented
          >
            Notification Settings
          </Button>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="text" 
            // Explicitly navigate within the Profile stack
            // onPress={() => navigation.navigate('Profile', { screen: 'About' })}
            onPress={() => alert('Screen not implemented yet')} // Placeholder
            style={styles.settingButton}
            icon="information"
            color="#4b5563"
            disabled // Disable until implemented
          >
            About TrackMate
          </Button>

          {user?.role === 'Dev' && (
            <>
              <Divider style={styles.divider} />
              <Button 
                mode="text" 
                // Explicitly navigate within the Profile stack
                onPress={() => {
                  console.log("Attempting to navigate to DevPanel...");
                  navigation.navigate('DevPanel'); // Navigate directly to the screen
                }}
                style={styles.settingButton}
                icon="wrench"
                color="#d97706"
              >
                Developer Panel
              </Button>
            </>
          )}

        </Card.Content>
      </Card>
      
      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
        color="#ef4444"
        icon="logout"
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0f9ff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  userEmail: {
    color: '#6b7280',
    marginTop: 4,
  },
  userRole: {
    color: '#0284c7',
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    marginLeft: 8,
    color: '#6b7280',
    width: 60,
  },
  infoValue: {
    flex: 1,
    color: '#111827',
  },
  editButton: {
    marginTop: 16,
  },
  formContainer: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  settingButton: {
    justifyContent: 'flex-start',
    height: 50,
  },
  divider: {
    marginVertical: 4,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 24,
    borderColor: '#ef4444',
  },
});

export default ProfileScreen;