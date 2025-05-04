import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { categoryService } from '../services/categoryService';

const initialFormState = {
  name: '',
  description: '',
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [userRole, setUserRole] = useState(null); // State to store user role

  useEffect(() => {
    fetchCategories();
    // Get user role from localStorage on mount
    const role = localStorage.getItem('user_role');
    console.log("User Role from localStorage:", role); // Log the raw value
    setUserRole(role);
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await categoryService.getAll();
      if (result.success) {
        setCategories(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } else {
        setError(result.message);
        setCategories([]);
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
      showSnackbar('Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setFormData(category);
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      let result;
      const userId = localStorage.getItem('user_id') || 'system';
      const companyId = parseInt(localStorage.getItem('company_id') || '1'); // Assuming companyId is needed

      if (isEditing) {
        result = await categoryService.update(formData.id, { 
          ...formData, 
          updatedBy: userId 
        });
      } else {
        result = await categoryService.create({ 
          ...formData, 
          companyId: companyId, // Add companyId for creation
          createdBy: userId 
        });
      }

      if (result.success) {
        showSnackbar(`Category ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        handleCloseDialog();
        fetchCategories();
        setSearchTerm('');
        setPage(0);
      } else {
        showSnackbar(result.message || `Failed to ${isEditing ? 'update' : 'create'} category`, 'error');
      }
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} category:`, err);
      showSnackbar(`An error occurred while ${isEditing ? 'updating' : 'creating'} category.`, 'error');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const result = await categoryService.delete(categoryToDelete.id);
      if (result.success) {
        showSnackbar('Category deleted successfully', 'success');
        fetchCategories();
      } else {
        showSnackbar(result.message || 'Failed to delete category', 'error');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      showSnackbar('An error occurred while deleting category.', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setCategoryToDelete(null);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredCategories = Array.isArray(categories) ? categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Check if user has permission (dev or Admin) - Case-insensitive check
  const canManageCategories = userRole?.toLowerCase() === 'dev' || userRole?.toLowerCase() === 'admin';

  // Add logs before return
  console.log("Current userRole state:", userRole);
  console.log("Can Manage Categories?", canManageCategories);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Category Management
        </Typography>
        {canManageCategories && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Category
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
           <TextField
             variant="outlined"
             placeholder="Search categories..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             size="small"
             sx={{ mr: 2, flexGrow: 1 }}
             InputProps={{
               startAdornment: (
                 <InputAdornment position="start">
                   <SearchIcon />
                 </InputAdornment>
               ),
             }}
           />
           <Tooltip title="Refresh">
             <IconButton onClick={fetchCategories}>
               <RefreshIcon />
             </IconButton>
           </Tooltip>
         </Box>
       </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              {/* Add more columns if needed, e.g., Product Count */} 
              {canManageCategories && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canManageCategories ? 3 : 2} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageCategories ? 3 : 2} align="center">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    {/* Add more cells if needed */} 
                    {canManageCategories && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(category)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(category)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCategories.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Category Form Dialog */} 
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Category Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        disableRestoreFocus
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
            This action cannot be undone, and it might fail if products are associated with it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */} 
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Categories; 