import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { 
  Text, Card, Title, Paragraph, Button, ActivityIndicator, FAB, 
  Snackbar, Dialog, Portal, TextInput, IconButton, List, Divider 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { categoryService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  const fetchCategories = useCallback(async () => {
    console.log('Fetching categories from API...');
    setLoading(true);
    try {
      // Get company ID from AsyncStorage
      const companyId = await AsyncStorage.getItem('company_id');
      
      // Fetch categories
      const result = await categoryService.getAll();
      
      // Extract data from result
      const categoriesData = result.success ? result.data : [];
      
      console.log(`Retrieved ${categoriesData?.length || 0} categories`);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Show error if request failed
      if (!result.success) {
        showSnackbar(`Error fetching categories: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar(`Error fetching categories: ${error.message || 'Unknown error'}`, 'error');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  }, [fetchCategories]);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
      setSelectedCategory(category);
      setIsEditing(true);
    } else {
      setFormData({ name: '', description: '' });
      setSelectedCategory(null);
      setIsEditing(false);
    }
    setDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setFormData({ name: '', description: '' });
  };

  const handleOpenDeleteDialog = (category) => {
    setSelectedCategory(category);
    setDeleteDialogVisible(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    try {
      let result;
      
      if (isEditing && selectedCategory) {
        // Update existing category
        result = await categoryService.update(selectedCategory.id, formData);
        if (result.success) {
          showSnackbar('Category updated successfully', 'success');
          // Update the categories list
          setCategories(categories.map(cat => 
            cat.id === selectedCategory.id ? { ...cat, ...result.data } : cat
          ));
        } else {
          showSnackbar(`Failed to update category: ${result.message}`, 'error');
        }
      } else {
        // Create new category
        result = await categoryService.create(formData);
        if (result.success) {
          showSnackbar('Category created successfully', 'success');
          // Add the new category to the list
          setCategories([...categories, result.data]);
        } else {
          showSnackbar(`Failed to create category: ${result.message}`, 'error');
        }
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      showSnackbar(`Error saving category: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const result = await categoryService.delete(selectedCategory.id);
      
      if (result.success) {
        showSnackbar('Category deleted successfully', 'success');
        // Remove the deleted category from the list
        setCategories(categories.filter(cat => cat.id !== selectedCategory.id));
      } else {
        showSnackbar(`Failed to delete category: ${result.message}`, 'error');
      }
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting category:', error);
      showSnackbar(`Error deleting category: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <Card style={styles.categoryCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.categoryName}>{item.name}</Title>
                <View style={styles.actionButtons}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => handleOpenDialog(item)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleOpenDeleteDialog(item)}
                  />
                </View>
              </View>
              {item.description && (
                <Paragraph style={styles.description}>{item.description}</Paragraph>
              )}
            </Card.Content>
          </Card>
        )}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="tag-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No categories found</Text>
            <Button 
              mode="contained" 
              onPress={() => handleOpenDialog()}
              style={{ marginTop: 16 }}
            >
              Add Category
            </Button>
          </View>
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        color="#ffffff"
        onPress={() => handleOpenDialog()}
      />
      
      {/* Add/Edit Category Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleCloseDialog}>
          <Dialog.Title>{isEditing ? 'Edit Category' : 'Add Category'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Description (Optional)"
              value={formData.description}
              onChangeText={text => setFormData({ ...formData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button onPress={handleSaveCategory} mode="contained">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={handleCloseDeleteDialog}>
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete the category "{selectedCategory?.name}"?
              This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDeleteDialog}>Cancel</Button>
            <Button onPress={handleDeleteCategory} mode="contained" color="#ef4444">Delete</Button>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  categoryCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    marginTop: 8,
    color: '#4b5563',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0284c7',
  },
  input: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default CategoriesScreen;
