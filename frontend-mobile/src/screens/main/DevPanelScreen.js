import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Platform } from 'react-native';
import { 
  Text, 
  Title, 
  SegmentedButtons, 
  DataTable, 
  IconButton, 
  ActivityIndicator, 
  Button, 
  Portal, 
  Dialog, 
  TextInput, 
  Checkbox,
  Divider,
  Snackbar, 
  List,
  Card,
  Menu
} from 'react-native-paper';
import { devPanelService } from '../../services/api';

const DevPanelScreen = () => {
  const [tabValue, setTabValue] = useState('users');
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [backups, setBackups] = useState([]);
  const [systemStats, setSystemStats] = useState({ 
    totalUsers: 0, totalCompanies: 0, activeUsers: 0, version: 'N/A', uptime: 'N/A', lastRestart: 'N/A' 
  }); // Mock stats for now
  const [smtpSettings, setSmtpSettings] = useState({ host: '', port: 587, enableSsl: true, username: '', password: '', from: '' });
  
  const [loading, setLoading] = useState({
    users: false,
    companies: false,
    backups: false,
    system: false, // Added for system stats (mock)
    config: false, // Added for SMTP fetch
    backupAction: false,
    restoreAction: false,
    resetAction: false,
    smtpUpdate: false,
    testEmail: false,
  });
  
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  // --- User Management State ---
  const [userDialogVisible, setUserDialogVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false); // State for role menu
  
  // --- Company Management State ---
  const [companyDialogVisible, setCompanyDialogVisible] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  
  // --- Database Management State ---
  const [resetDbDialogVisible, setResetDbDialogVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null); // For potential restore action
  const [restoreConfirmDialogVisible, setRestoreConfirmDialogVisible] = useState(false);

  const availableRoles = ['Admin', 'Manager', 'User', 'Viewer', 'Dev']; // Define roles

  // --- Data Fetching Callbacks ---
  const fetchUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const data = await devPanelService.getUsers();
      setUsers(data);
      // Update stats based on fetched users
      setSystemStats(prev => ({ ...prev, totalUsers: data.length, activeUsers: data.filter(u => u.isActive).length }));
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar(`Error fetching users: ${error.message || 'Unknown error'}`, 'error');
      setUsers([]);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(prev => ({ ...prev, companies: true }));
    try {
      const data = await devPanelService.getCompanies();
      setCompanies(data);
      // Update stats based on fetched companies
      setSystemStats(prev => ({ ...prev, totalCompanies: data.length }));
    } catch (error) {
      console.error('Error fetching companies:', error);
      showSnackbar(`Error fetching companies: ${error.message || 'Unknown error'}`, 'error');
      setCompanies([]);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, []);
  
  const fetchBackups = useCallback(async () => {
    setLoading(prev => ({ ...prev, backups: true }));
    try {
      const data = await devPanelService.getBackups();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      showSnackbar(`Error fetching backups: ${error.message || 'Unknown error'}`, 'error');
      setBackups([]);
    } finally {
      setLoading(prev => ({ ...prev, backups: false }));
    }
  }, []);

  const fetchSmtpSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, config: true }));
    try {
      const data = await devPanelService.getSmtpSettings();
      setSmtpSettings(data || { host: '', port: 587, enableSsl: true, username: '', password: '', from: '' });
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      showSnackbar(`Error fetching SMTP: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, config: false }));
    }
  }, []);
  
  // Mock fetch for system stats (replace if API exists)
  const fetchStats = useCallback(async () => {
     setLoading(prev => ({ ...prev, system: true }));
     // In a real app, fetch from API. For now, just update based on users/companies lengths.
     await new Promise(resolve => setTimeout(resolve, 100)); // Simulate small delay
     setSystemStats(prev => ({
         ...prev,
         version: '1.0-Mobile',
         uptime: 'N/A (Mobile)',
         lastRestart: 'N/A (Mobile)',
         totalUsers: users.length,
         activeUsers: users.filter(u => u.isActive).length,
         totalCompanies: companies.length
     }));
     setLoading(prev => ({ ...prev, system: false }));
  }, [users, companies]); // Re-run if users/companies change

  // --- Initial Data Load & Tab Change Logic ---
  useEffect(() => {
    // Fetch data for the initially selected tab
    switch (tabValue) {
      case 'users': fetchUsers(); break;
      case 'companies': fetchCompanies(); break;
      case 'db': fetchBackups(); break;
      case 'config': fetchSmtpSettings(); break;
      case 'system': fetchStats(); break;
      default: break;
    }
  }, []); // Run only once on mount for initial tab
  
  const handleTabChange = (value) => {
     setTabValue(value);
     // Fetch data for the new tab if it hasn't been loaded yet
     switch (value) {
       case 'users': if (!users.length) fetchUsers(); break;
       case 'companies': if (!companies.length) fetchCompanies(); break;
       case 'db': if (!backups.length) fetchBackups(); break;
       case 'config': if (!smtpSettings.host) fetchSmtpSettings(); break; // Check if settings are default
       case 'system': fetchStats(); break; // Always refresh mock stats
       default: break;
     }
  };
  
  const handleRefresh = useCallback(() => {
     switch (tabValue) {
       case 'users': fetchUsers(); break;
       case 'companies': fetchCompanies(); break;
       case 'db': fetchBackups(); break;
       case 'config': fetchSmtpSettings(); break;
       case 'system': fetchStats(); break;
       default: break;
     }
  }, [tabValue, fetchUsers, fetchCompanies, fetchBackups, fetchSmtpSettings, fetchStats]);

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  // --- User Dialog Handlers ---
  const openAddUserDialog = () => {
    setCurrentUser({ 
      firstName: '', lastName: '', email: '', username: '', 
      password: '', role: 'User', companyId: '', isActive: true, 
      phone: '' // Initialize phone
    });
    setIsAddingUser(true);
    setUserDialogVisible(true);
  };
  const openEditUserDialog = (user) => {
    setCurrentUser({ ...user, password: '' });
    setIsAddingUser(false);
    setUserDialogVisible(true);
  };
  const closeUserDialog = () => setUserDialogVisible(false);
  const handleUserInputChange = (field, value) => setCurrentUser(prev => ({ ...prev, [field]: value }));
  const handleUserCheckboxChange = (field, value) => setCurrentUser(prev => ({ ...prev, [field]: value }));

  // Specific handler for role selection from menu
  const handleRoleSelect = (role) => {
    setCurrentUser(prev => ({ ...prev, role: role }));
    setRoleMenuVisible(false); // Close menu after selection
  };

  const handleSaveUser = async () => {
    if (!currentUser) return;

    // --- Frontend Validation ---
    const companyIdStr = String(currentUser.companyId || '').trim();
    const companyIdInt = parseInt(companyIdStr, 10);

    if (companyIdStr === '' || isNaN(companyIdInt)) {
        showSnackbar('Please enter a valid numeric Company ID', 'error');
        return; // Stop execution if validation fails
    }
    // Add other frontend validation if needed (e.g., non-empty name, email format)
    if (!currentUser.firstName?.trim() || !currentUser.lastName?.trim() || !currentUser.email?.trim() || !currentUser.username?.trim()) {
        showSnackbar('Please fill in all required fields (Name, Email, Username)', 'error');
        return;
    }
     if (isAddingUser && !currentUser.password?.trim()) {
        showSnackbar('Password is required for new users', 'error');
        return;
    }
    // --- End Frontend Validation ---
    
    setLoading(prev => ({ ...prev, users: true }));
    
    // Prepare user data for API
    const userDataToSend = {
        ...currentUser,
        companyId: companyIdInt // Send the validated integer
    };
    
    // Remove password if not adding or empty (redundant check added earlier, kept for safety)
    if (!isAddingUser || userDataToSend.password === '') { 
        delete userDataToSend.password;
    }

    console.log('Sending user data to API:', userDataToSend);
    
    try {
      if (isAddingUser) {
        await devPanelService.addUser(userDataToSend);
        showSnackbar('User added successfully', 'success');
      } else {
        await devPanelService.updateUser(currentUser.id, userDataToSend);
        showSnackbar('User updated successfully', 'success');
      }
      closeUserDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.title || error.response?.data?.errors?.[`$.${Object.keys(error.response?.data?.errors)[0]}`]?.[0] || error.response?.data?.message || error.message || 'Unknown error';
      showSnackbar(`Error saving user: ${errorMessage}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };
  const handleDeleteUser = async (userId) => {
    // TODO: Add confirmation dialog
    setLoading(prev => ({ ...prev, users: true }));
    try {
      await devPanelService.deleteUser(userId);
      showSnackbar('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
       console.error('Error deleting user:', error);
       showSnackbar(`Error deleting user: ${error.message || 'Unknown error'}`, 'error');
    } finally {
       setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // --- Company Dialog Handlers ---
   const openAddCompanyDialog = () => {
    setCurrentCompany({ name: '', email: '', phone: '', address: '', taxNumber: '', taxOffice: '', website: '', isActive: true, taxId: '' });
    setIsAddingCompany(true);
    setCompanyDialogVisible(true);
  };
  const openEditCompanyDialog = (company) => {
    setCurrentCompany({ ...company });
    setIsAddingCompany(false);
    setCompanyDialogVisible(true);
  };
  const closeCompanyDialog = () => setCompanyDialogVisible(false);
  const handleCompanyInputChange = (field, value) => setCurrentCompany(prev => ({ ...prev, [field]: value }));
  const handleCompanyCheckboxChange = (field, value) => setCurrentCompany(prev => ({ ...prev, [field]: value }));
  const handleSaveCompany = async () => {
    if (!currentCompany) return;
    setLoading(prev => ({ ...prev, companies: true }));
    try {
      if (isAddingCompany) {
        await devPanelService.addCompany(currentCompany);
        showSnackbar('Company added successfully', 'success');
      } else {
        await devPanelService.updateCompany(currentCompany.id, currentCompany);
        showSnackbar('Company updated successfully', 'success');
      }
      closeCompanyDialog();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      showSnackbar(`Error saving company: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  };
  const handleDeleteCompany = async (companyId) => {
    // TODO: Add confirmation dialog
    setLoading(prev => ({ ...prev, companies: true }));
    try {
      await devPanelService.deleteCompany(companyId);
      showSnackbar('Company deleted successfully', 'success');
      fetchCompanies();
    } catch (error) {
       console.error('Error deleting company:', error);
       showSnackbar(`Error deleting company: ${error.message || 'Unknown error'}`, 'error');
    } finally {
       setLoading(prev => ({ ...prev, companies: false }));
    }
  };
  
   // --- Database Action Handlers ---
  const handleCreateBackup = async () => {
    setLoading(prev => ({ ...prev, backupAction: true }));
    try {
      await devPanelService.createBackup();
      showSnackbar('Backup created successfully', 'success');
      fetchBackups(); // Refresh list
    } catch (error) {
      console.error('Error creating backup:', error);
      showSnackbar(`Error creating backup: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, backupAction: false }));
    }
  };
  
  const openRestoreDialog = (backup) => {
      setSelectedBackup(backup);
      setRestoreConfirmDialogVisible(true);
  };
  
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    setRestoreConfirmDialogVisible(false);
    setLoading(prev => ({ ...prev, restoreAction: true }));
    try {
      // On mobile, we typically restore by filename from the list
      await devPanelService.restoreBackup(selectedBackup.fileName);
      showSnackbar(`Restoring from ${selectedBackup.fileName}... Check server logs.`, 'info');
      // Maybe refresh data after a delay or prompt user?
    } catch (error) {
      console.error('Error restoring backup:', error);
      showSnackbar(`Error restoring backup: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, restoreAction: false }));
      setSelectedBackup(null);
    }
  };
  
  const openResetDbDialog = () => setResetDbDialogVisible(true);
  const closeResetDbDialog = () => setResetDbDialogVisible(false);
  const handleResetDatabase = async () => {
    closeResetDbDialog();
    setLoading(prev => ({ ...prev, resetAction: true }));
    try {
      await devPanelService.resetDatabase();
      showSnackbar('Database reset initiated. Refreshing data...', 'success');
      // Refresh all relevant data
      fetchUsers();
      fetchCompanies();
      fetchBackups();
    } catch (error) {
      console.error('Error resetting database:', error);
      showSnackbar(`Error resetting database: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, resetAction: false }));
    }
  };
  
  // --- Config Action Handlers ---
   const handleSmtpInputChange = (field, value) => setSmtpSettings(prev => ({ ...prev, [field]: value }));
   const handleSmtpCheckboxChange = (field, value) => setSmtpSettings(prev => ({ ...prev, [field]: value }));
   const handleUpdateSmtp = async () => {
     setLoading(prev => ({ ...prev, smtpUpdate: true }));
     try {
       await devPanelService.updateSmtpSettings(smtpSettings);
       showSnackbar('SMTP settings updated', 'success');
     } catch (error) {
       console.error('Error updating SMTP:', error);
       showSnackbar(`Error updating SMTP: ${error.message || 'Unknown error'}`, 'error');
     } finally {
       setLoading(prev => ({ ...prev, smtpUpdate: false }));
     }
   };
   const handleSendTestEmail = async () => {
      // Use the 'from' address or username as recipient for testing
      const recipient = smtpSettings.from || smtpSettings.username;
      if (!recipient) {
          showSnackbar('Please configure SMTP From address or Username first', 'warning');
          return;
      }
      setLoading(prev => ({ ...prev, testEmail: true }));
      try {
        await devPanelService.sendTestEmail(recipient);
        showSnackbar(`Test email sent to ${recipient}`, 'success');
      } catch (error) {
        console.error('Error sending test email:', error);
        showSnackbar(`Error sending test email: ${error.message || 'Unknown error'}`, 'error');
      } finally {
        setLoading(prev => ({ ...prev, testEmail: false }));
      }
   };

  // --- Render Functions ---
  const renderUsersTab = () => (
    <View>
      <Button 
        mode="contained" 
        icon="plus" 
        onPress={openAddUserDialog} 
        style={styles.actionButton}
        disabled={loading.users}
      >
        Add User
      </Button>
      {loading.users && !users.length ? (
         <ActivityIndicator animating={true} size="large" style={styles.loadingIndicator} />
      ) : (
        <DataTable>
          {/* Temporarily simplify header for diagnostics */}
          <DataTable.Header>
             <DataTable.Title><Text>TEMP HEADER</Text></DataTable.Title>
          </DataTable.Header>

          {users.map((user) => (
            <DataTable.Row key={user.id}>
              <DataTable.Cell>{`${user.firstName} ${user.lastName}`}</DataTable.Cell>
              <DataTable.Cell>{user.email}</DataTable.Cell>
              {/* <DataTable.Cell>{user.role}</DataTable.Cell> */} 
              <DataTable.Cell numeric>
                 <Checkbox.Android status={user.isActive ? 'checked' : 'unchecked'} disabled />
              </DataTable.Cell>
              <DataTable.Cell numeric>
                 {/* Use a View to prevent buttons overlapping on small screens */} 
                 <View style={{ flexDirection: 'row', justifyContent: 'flex-end'}}> 
                    <IconButton icon="pencil" size={20} onPress={() => openEditUserDialog(user)} disabled={loading.users} />
                    <IconButton icon="delete" size={20} onPress={() => handleDeleteUser(user.id)} disabled={loading.users} /> 
                 </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      )}
    </View>
  );

  const renderCompaniesTab = () => (
     <View>
        <Button 
            mode="contained" 
            icon="plus" 
            onPress={openAddCompanyDialog} 
            style={styles.actionButton}
            disabled={loading.companies}
        >
            Add Company
        </Button>
        {loading.companies && !companies.length ? (
            <ActivityIndicator animating={true} size="large" style={styles.loadingIndicator} />
        ) : (
            <DataTable>
            {/* Temporarily simplify header for diagnostics */}
            <DataTable.Header>
               <DataTable.Title><Text>TEMP HEADER</Text></DataTable.Title>
            </DataTable.Header>

            {companies.map((company) => (
                <DataTable.Row key={company.id}>
                <DataTable.Cell>{company.name}</DataTable.Cell>
                <DataTable.Cell>{company.email}</DataTable.Cell>
                <DataTable.Cell numeric>
                    <Checkbox.Android status={company.isActive ? 'checked' : 'unchecked'} disabled />
                </DataTable.Cell>
                 <DataTable.Cell numeric>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end'}}> 
                        <IconButton icon="pencil" size={20} onPress={() => openEditCompanyDialog(company)} disabled={loading.companies} />
                        <IconButton icon="delete" size={20} onPress={() => handleDeleteCompany(company.id)} disabled={loading.companies} /> 
                    </View>
                 </DataTable.Cell>
                </DataTable.Row>
            ))}
            </DataTable>
        )}
    </View>
  );
  
  const renderDatabaseTab = () => (
    <View style={styles.sectionContainer}>
        <Card style={styles.card}>
            <Card.Title title="Database Actions" />
            <Card.Content>
                <Button 
                    mode="contained" 
                    icon="database-export" 
                    onPress={handleCreateBackup} 
                    style={styles.dbButton}
                    loading={loading.backupAction}
                    disabled={loading.backupAction}
                >
                    Create Backup
                </Button>
                <Button 
                    mode="outlined" 
                    icon="database-import" 
                    onPress={() => showSnackbar('Select a backup below to restore', 'info')} // Restore initiated from list
                    style={styles.dbButton}
                    disabled={loading.restoreAction} // Disable generic restore button
                >
                    Restore Backup
                </Button>
                <Button 
                    mode="contained" 
                    icon="database-remove" 
                    color="#D32F2F" // Error color
                    onPress={openResetDbDialog} 
                    style={styles.dbButton}
                    loading={loading.resetAction}
                    disabled={loading.resetAction}
                >
                    Reset Database
                </Button>
            </Card.Content>
        </Card>
        
        <Card style={styles.card}>
             <Card.Title title="Available Backups" />
             <Card.Content>
                {loading.backups ? (
                    <ActivityIndicator animating={true} />
                ) : backups.length === 0 ? (
                    <Text>No backups found.</Text>
                ) : (
                    <List.Section>
                        {backups.map((backup, index) => (
                            <List.Item
                                key={backup.fileName || index}
                                title={backup.fileName}
                                description={`Created: ${backup.createdAt ? new Date(backup.createdAt).toLocaleString() : 'Unknown'}`}
                                left={props => <List.Icon {...props} icon="database" />}
                                right={props => 
                                   <IconButton 
                                       {...props} 
                                       icon="database-import" 
                                       onPress={() => openRestoreDialog(backup)} 
                                       disabled={loading.restoreAction}
                                    />
                                }
                            />
                        ))}
                    </List.Section>
                )}
             </Card.Content>
        </Card>
    </View>
  );
  
  const renderConfigTab = () => (
     <View style={styles.sectionContainer}>
        <Card style={styles.card}>
            <Card.Title title="SMTP Configuration" />
            <Card.Content>
                {loading.config ? (
                    <ActivityIndicator animating={true} />
                ) : (
                    <View>
                        <TextInput label="SMTP Server" value={smtpSettings.host || ''} onChangeText={(text) => handleSmtpInputChange('host', text)} style={styles.input} />
                        <TextInput label="SMTP Port" value={String(smtpSettings.port || '')} onChangeText={(text) => handleSmtpInputChange('port', parseInt(text) || 0)} keyboardType="numeric" style={styles.input} />
                        <TextInput label="SMTP Username" value={smtpSettings.username || ''} onChangeText={(text) => handleSmtpInputChange('username', text)} autoCapitalize="none" style={styles.input} />
                        <TextInput label="SMTP Password" value={smtpSettings.password || ''} onChangeText={(text) => handleSmtpInputChange('password', text)} secureTextEntry style={styles.input} />
                        <TextInput label="From Email" value={smtpSettings.from || ''} onChangeText={(text) => handleSmtpInputChange('from', text)} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                        <View style={styles.checkboxContainer}>
                            <Checkbox.Android 
                                status={smtpSettings.enableSsl ? 'checked' : 'unchecked'}
                                onPress={() => handleSmtpCheckboxChange('enableSsl', !smtpSettings.enableSsl)}
                            />
                            <Text>Enable SSL</Text>
                        </View>
                        <Divider style={styles.divider} />
                        <View style={styles.buttonRow}>
                             <Button 
                                mode="outlined"
                                icon="email-send" 
                                onPress={handleSendTestEmail} 
                                loading={loading.testEmail}
                                disabled={loading.testEmail}
                                style={{flex: 1, marginRight: 5}}
                              >
                                 Send Test
                              </Button>
                              <Button 
                                mode="contained"
                                icon="content-save" 
                                onPress={handleUpdateSmtp} 
                                loading={loading.smtpUpdate}
                                disabled={loading.smtpUpdate}
                                style={{flex: 1, marginLeft: 5}}
                              >
                                 Save SMTP
                              </Button>
                        </View>
                    </View>
                )}
            </Card.Content>
        </Card>
        {/* Add other config sections (Global Settings, User Settings) here if needed */}
     </View>
  );
  
   const renderSystemTab = () => (
     <View style={styles.sectionContainer}>
         <Card style={styles.card}>
            <Card.Title title="System Statistics" />
            <Card.Content>
               {loading.system ? (
                   <ActivityIndicator animating={true} />
               ) : (
                    <List.Section>
                        <List.Item title="Total Users" description={systemStats.totalUsers} left={() => <List.Icon icon="account-group" />} />
                        <List.Item title="Active Users" description={systemStats.activeUsers} left={() => <List.Icon icon="account-check" />} />
                        <List.Item title="Total Companies" description={systemStats.totalCompanies} left={() => <List.Icon icon="office-building" />} />
                    </List.Section>
               )}
            </Card.Content>
         </Card>
         <Card style={styles.card}>
             <Card.Title title="System Status" />
             <Card.Content>
                {loading.system ? (
                   <ActivityIndicator animating={true} />
                ) : (
                    <List.Section>
                        <List.Item title="App Version" description={systemStats.version} left={() => <List.Icon icon="information" />} />
                        <List.Item title="Uptime" description={systemStats.uptime} left={() => <List.Icon icon="timer" />} />
                        <List.Item title="Last Restart" description={systemStats.lastRestart} left={() => <List.Icon icon="update" />} />
                    </List.Section>
                )}
            </Card.Content>
         </Card>
     </View>
  );

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={tabValue}
        onValueChange={handleTabChange}
        buttons={[
          { value: 'system', label: 'System', icon: 'monitor' },
          { value: 'db', label: 'Database', icon: 'database' },
          { value: 'users', label: 'Users', icon: 'account-group' },
          { value: 'companies', label: 'Companies', icon: 'office-building' },
          { value: 'config', label: 'Config', icon: 'cog' },
        ]}
        style={styles.tabs}
      />
      
      <ScrollView 
         style={styles.tabContent}
         contentContainerStyle={{ paddingBottom: 80 }} // Add padding for Snackbar
         refreshControl={
            <RefreshControl 
               refreshing={loading.users || loading.companies || loading.backups || loading.system || loading.config} 
               onRefresh={handleRefresh}
            />
         }
      >
        {tabValue === 'system' && renderSystemTab()}
        {tabValue === 'db' && renderDatabaseTab()}
        {tabValue === 'users' && renderUsersTab()}
        {tabValue === 'companies' && renderCompaniesTab()}
        {tabValue === 'config' && renderConfigTab()}
      </ScrollView>
      
       {/* User Add/Edit Dialog */}
      <Portal>
         <Dialog visible={userDialogVisible} onDismiss={closeUserDialog} style={styles.dialog}>
            <Dialog.Title>{isAddingUser ? 'Add New User' : 'Edit User'}</Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 400, paddingHorizontal: 0 }}>
               <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
                    <TextInput label="First Name" value={currentUser?.firstName || ''} onChangeText={(text) => handleUserInputChange('firstName', text)} style={styles.input} mode="outlined"/>
                    <TextInput label="Last Name" value={currentUser?.lastName || ''} onChangeText={(text) => handleUserInputChange('lastName', text)} style={styles.input} mode="outlined"/>
                    <TextInput label="Email" value={currentUser?.email || ''} onChangeText={(text) => handleUserInputChange('email', text)} keyboardType="email-address" autoCapitalize="none" style={styles.input} mode="outlined"/>
                    <TextInput label="Username" value={currentUser?.username || ''} onChangeText={(text) => handleUserInputChange('username', text)} autoCapitalize="none" style={styles.input} mode="outlined"/>
                    <TextInput label="Phone" value={currentUser?.phone || ''} onChangeText={(text) => handleUserInputChange('phone', text)} keyboardType="phone-pad" style={styles.input} mode="outlined"/>
                    {isAddingUser && (
                        <TextInput label="Password" value={currentUser?.password || ''} onChangeText={(text) => handleUserInputChange('password', text)} secureTextEntry style={styles.input} mode="outlined"/>
                    )}
                    
                    {/* Role Selector using Menu */}
                     <Menu
                        visible={roleMenuVisible}
                        onDismiss={() => setRoleMenuVisible(false)}
                        anchor={
                           <Button 
                              mode="outlined" 
                              onPress={() => setRoleMenuVisible(true)} 
                              style={styles.input} // Use input style for consistency
                              contentStyle={styles.dropdownButtonContent} // Align text left
                           >
                              {currentUser?.role || 'Select Role'}
                           </Button>
                        }
                        style={styles.menu}
                     >
                       {availableRoles.map((role) => (
                         <Menu.Item 
                           key={role}
                           onPress={() => handleRoleSelect(role)} 
                           title={role} 
                         />
                       ))}
                     </Menu>
                    
                    <TextInput label="Company ID" value={String(currentUser?.companyId || '')} onChangeText={(text) => handleUserInputChange('companyId', text)} keyboardType="numeric" style={styles.input} mode="outlined" /> 
                    <View style={styles.checkboxContainer}>
                        <Checkbox.Android 
                            status={currentUser?.isActive ? 'checked' : 'unchecked'}
                            onPress={() => handleUserCheckboxChange('isActive', !currentUser?.isActive)}
                        />
                        <Text>Active</Text>
                    </View>
               </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
               <Button onPress={closeUserDialog}>Cancel</Button>
               <Button onPress={handleSaveUser} disabled={loading.users}>{isAddingUser ? 'Add' : 'Save'}</Button>
            </Dialog.Actions>
         </Dialog>
         
         {/* Company Add/Edit Dialog */}
         <Dialog visible={companyDialogVisible} onDismiss={closeCompanyDialog} style={styles.dialog}>
            <Dialog.Title>{isAddingCompany ? 'Add New Company' : 'Edit Company'}</Dialog.Title>
             <Dialog.ScrollArea style={{ maxHeight: 400, paddingHorizontal: 0 }}>
               <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
                  <TextInput label="Company Name" value={currentCompany?.name || ''} onChangeText={(text) => handleCompanyInputChange('name', text)} style={styles.input} mode="outlined"/>
                  <TextInput label="Email" value={currentCompany?.email || ''} onChangeText={(text) => handleCompanyInputChange('email', text)} keyboardType="email-address" autoCapitalize="none" style={styles.input} mode="outlined"/>
                  <TextInput label="Phone" value={currentCompany?.phone || ''} onChangeText={(text) => handleCompanyInputChange('phone', text)} keyboardType="phone-pad" style={styles.input} mode="outlined"/>
                  <TextInput label="Address" value={currentCompany?.address || ''} onChangeText={(text) => handleCompanyInputChange('address', text)} style={styles.input} mode="outlined" multiline/>
                  <TextInput label="Website" value={currentCompany?.website || ''} onChangeText={(text) => handleCompanyInputChange('website', text)} autoCapitalize="none" style={styles.input} mode="outlined"/>
                  <TextInput label="Tax ID" value={currentCompany?.taxId || ''} onChangeText={(text) => handleCompanyInputChange('taxId', text)} style={styles.input} mode="outlined"/>
                  <TextInput label="Tax Number" value={currentCompany?.taxNumber || ''} onChangeText={(text) => handleCompanyInputChange('taxNumber', text)} style={styles.input} mode="outlined"/>
                  <TextInput label="Tax Office" value={currentCompany?.taxOffice || ''} onChangeText={(text) => handleCompanyInputChange('taxOffice', text)} style={styles.input} mode="outlined"/>
                  <View style={styles.checkboxContainer}>
                      <Checkbox.Android 
                          status={currentCompany?.isActive ? 'checked' : 'unchecked'}
                          onPress={() => handleCompanyCheckboxChange('isActive', !currentCompany?.isActive)}
                      />
                      <Text>Active</Text>
                  </View>
               </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
               <Button onPress={closeCompanyDialog}>Cancel</Button>
               <Button onPress={handleSaveCompany} disabled={loading.companies}>{isAddingCompany ? 'Add' : 'Save'}</Button>
            </Dialog.Actions>
         </Dialog>
         
         {/* Reset DB Confirm Dialog */}
          <Dialog visible={resetDbDialogVisible} onDismiss={closeResetDbDialog}>
            <Dialog.Title>Confirm Database Reset</Dialog.Title>
            <Dialog.Content>
              <Text>Warning: This will reset the database. All data will be lost. This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeResetDbDialog}>Cancel</Button>
              <Button onPress={handleResetDatabase} color="#D32F2F" disabled={loading.resetAction}>Reset</Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Restore DB Confirm Dialog */}
          <Dialog visible={restoreConfirmDialogVisible} onDismiss={() => setRestoreConfirmDialogVisible(false)}>
             <Dialog.Title>Confirm Restore</Dialog.Title>
             <Dialog.Content>
               <Text>Restore database from backup '{selectedBackup?.fileName}'? The application might become temporarily unavailable.</Text>
             </Dialog.Content>
             <Dialog.Actions>
               <Button onPress={() => setRestoreConfirmDialogVisible(false)}>Cancel</Button>
               <Button onPress={handleRestoreBackup} disabled={loading.restoreAction}>Restore</Button>
             </Dialog.Actions>
          </Dialog>
          
      </Portal>
      
       <Snackbar
         visible={snackbar.visible}
         onDismiss={onDismissSnackbar}
         duration={3000}
         style={{ backgroundColor: snackbar.type === 'error' ? '#D32F2F' : (snackbar.type === 'success' ? '#4CAF50' : '#2196F3') }}
       >
         {snackbar.message}
       </Snackbar>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Lighter background
  },
  tabs: {
    margin: 10,
  },
  tabContent: {
     flex: 1,
  },
  sectionContainer: {
     padding: 10,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
  actionButton: {
    marginVertical: 10,
    marginHorizontal: 5,
    alignSelf: 'flex-start',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white', // Ensure input background is white for outlined variant
  },
   checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  card: {
    marginBottom: 15,
  },
  dbButton: {
     marginTop: 10,
  },
  buttonRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginTop: 15,
  },
  divider: {
     marginVertical: 15,
  },
  dialog: {
     // Add specific styles for dialog if needed, e.g., for smaller screens
     // Consider maxHeight on web vs mobile
  },
  dropdownButtonContent: {
     justifyContent: 'flex-start', // Align text to the left like TextInput
     paddingVertical: 8, // Adjust padding to match TextInput height better
  },
  menu: {
     marginTop: 55, // Adjust based on button height to position correctly
  },
});

export default DevPanelScreen; 