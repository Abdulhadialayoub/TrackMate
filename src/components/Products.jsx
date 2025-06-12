import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
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
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

const initialFormState = {
  name: '',
  description: '',
  code: '',
  unitPrice: 0,
  unit: '',
  weight: 0,
  quantity: 0,
  stockQuantity: 0,
  category: '',
  brand: '',
  model: '',
  currency: 'USD',
  status: 0,
  sku: '',
  isActive: true,
};

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
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
  const [productToDelete, setProductToDelete] = useState(null);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [stockData, setStockData] = useState({ id: null, quantity: 0 });

  const productStatuses = [
    { value: 0, label: t('products.status.active'), color: 'success' },
    { value: 1, label: t('products.status.inactive'), color: 'error' },
    { value: 2, label: t('products.status.discontinued'), color: 'warning' },
    { value: 3, label: t('products.status.outOfStock'), color: 'default' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const companyId = localStorage.getItem('company_id');
      let result;
      
      const userRole = localStorage.getItem('user_role');
      
      if (userRole === 'Dev') {
        result = await productService.getAll();
      } else {
        result = await productService.getByCompanyId(companyId);
      }
      
      if (result.success) {
        setProducts(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } else {
        setError(result.message);
        setProducts([]);
        showSnackbar('fetchError', 'error');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(t('products.messages.fetchError'));
      setProducts([]);
      showSnackbar('fetchError', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await categoryService.getAll();
      if (result.success) {
        setCategories(result.data);
      } else {
        console.error("Failed to fetch categories:", result.message);
        showSnackbar("Failed to load categories", 'warning');
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showSnackbar("Error loading categories", 'error');
      setCategories([]);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      if (product.companyId !== companyId && userRole !== 'Dev') {
        showSnackbar('You can only edit products that belong to your company', 'error');
        return;
      }
      
      setFormData({
        ...product,
        category: product.categoryId ? product.categoryId.toString() : '',
      });
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
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? checked 
        : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.category) {
        showSnackbar('categoryRequired', 'error');
        return;
      }
      
      const userId = localStorage.getItem('user_id') || 'system';
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      
      const payload = {
        ...formData,
        updatedBy: userId,
        createdBy: userId,
        companyId: companyId,
      };
      
      delete payload.id;
      delete payload.categoryName;
      delete payload.company;
      delete payload.orderItemCount;
      delete payload.invoiceItemCount;
      delete payload.createdAt;
      delete payload.updatedAt;

      let result;
      
      if (isEditing) {
        if (formData.companyId && formData.companyId !== companyId && localStorage.getItem('user_role') !== 'Dev') {
          showSnackbar('permissionError', 'error', { action: t('products.actions.edit').toLowerCase() });
          return;
        }
        result = await productService.update(formData.id, payload);
      } else {
        result = await productService.create(payload);
      }
      
      if (result.success) {
        showSnackbar(isEditing ? 'updateSuccess' : 'createSuccess', 'success');
        handleCloseDialog();
        fetchProducts();
      } else {
        showSnackbar(isEditing ? 'updateError' : 'createError', 'error');
      }
    } catch (err) {
      showSnackbar(isEditing ? 'updateError' : 'createError', 'error');
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      if (productToDelete.companyId !== companyId && userRole !== 'Dev') {
        showSnackbar('permissionError', 'error', { action: t('products.actions.delete').toLowerCase() });
        setOpenDeleteDialog(false);
        setProductToDelete(null);
        return;
      }
      
      const result = await productService.delete(productToDelete.id);
      if (result.success) {
        showSnackbar('deleteSuccess', 'success');
        fetchProducts();
      } else {
        showSnackbar('deleteError', 'error');
      }
    } catch (err) {
      showSnackbar('deleteError', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleStockClick = (product) => {
    setStockData({ id: product.id, quantity: product.stockQuantity });
    setOpenStockDialog(true);
  };

  const handleStockUpdate = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      const product = products.find(p => p.id === stockData.id);
      
      if (product && product.companyId !== companyId && userRole !== 'Dev') {
        showSnackbar('permissionError', 'error', { action: t('products.actions.updateStock').toLowerCase() });
        setOpenStockDialog(false);
        return;
      }
      
      const result = await productService.updateStock(stockData.id, stockData.quantity);
      if (result.success) {
        showSnackbar('stockUpdateSuccess', 'success');
        fetchProducts();
        setOpenStockDialog(false);
      } else {
        showSnackbar('stockUpdateError', 'error');
      }
    } catch (err) {
      showSnackbar('stockUpdateError', 'error');
    }
  };

  const showSnackbar = (messageKey, severity = 'info', params = {}) => {
    setSnackbar({ 
      open: true, 
      message: t(`products.messages.${messageKey}`, params), 
      severity 
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusChip = (status) => {
    const statusInfo = productStatuses.find(s => s.value === status) || 
                      { label: 'Unknown', color: 'default' };
    
    return (
      <Chip 
        label={statusInfo.label} 
        color={statusInfo.color} 
        size="small" 
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('products.management')}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('products.addProduct')}
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder={t('products.searchPlaceholder')}
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
          <Tooltip title={t('products.refreshTooltip')}>
            <IconButton onClick={fetchProducts}>
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
              <TableCell>{t('products.table.name')}</TableCell>
              <TableCell>{t('products.table.code')}</TableCell>
              <TableCell>{t('products.table.category')}</TableCell>
              <TableCell>{t('products.table.price')}</TableCell>
              <TableCell>{t('products.table.stock')}</TableCell>
              <TableCell>{t('products.table.status')}</TableCell>
              <TableCell align="right">{t('products.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {t('products.noProductsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>
                      {product.unitPrice.toFixed(2)} {product.currency}
                    </TableCell>
                    <TableCell>{product.stockQuantity}</TableCell>
                    <TableCell>{getStatusChip(product.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('products.actions.updateStock')}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleStockClick(product)}
                          color="primary"
                        >
                          <InventoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('products.actions.edit')}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(product)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('products.actions.delete')}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(product)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? t('products.editProduct') : t('products.addNewProduct')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label={t('products.form.name')}
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="code"
                label={t('products.form.code')}
                value={formData.code}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label={t('products.form.description')}
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                name="category"
                label={t('products.form.category')}
                value={formData.category}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="" disabled>
                  {t('products.form.selectCategory')}
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="brand"
                label={t('products.form.brand')}
                value={formData.brand}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="unitPrice"
                label={t('products.form.unitPrice')}
                type="number"
                value={formData.unitPrice}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="currency"
                label={t('products.form.currency')}
                select
                value={formData.currency}
                onChange={handleInputChange}
                fullWidth
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="TRY">TRY</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="unit"
                label={t('products.form.unit')}
                value={formData.unit}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="stockQuantity"
                label={t('products.form.stockQuantity')}
                type="number"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="weight"
                label={t('products.form.weight')}
                type="number"
                value={formData.weight}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="sku"
                label={t('products.form.sku')}
                value={formData.sku}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label={t('products.form.model')}
                value={formData.model}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="status"
                label={t('products.form.status')}
                select
                value={formData.status}
                onChange={handleInputChange}
                fullWidth
              >
                {productStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('products.actions.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
          >
            {isEditing ? t('products.actions.update') : t('products.actions.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>{t('products.deleteConfirmation.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('products.deleteConfirmation.message', { name: productToDelete?.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            {t('products.actions.cancel')}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {t('products.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)}>
        <DialogTitle>{t('products.stockDialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('products.stockDialog.quantity')}
            type="number"
            fullWidth
            value={stockData.quantity}
            onChange={(e) => setStockData({ ...stockData, quantity: parseInt(e.target.value) })}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStockDialog(false)}>
            {t('products.actions.cancel')}
          </Button>
          <Button onClick={handleStockUpdate} color="primary" variant="contained">
            {t('products.actions.update')}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Products;
