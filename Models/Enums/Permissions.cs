namespace TrackMate.API.Models.Enums
{
    public static class Permissions
    {
        // Company permissions
        public const string ViewCompanies = "permissions.companies.view";
        public const string CreateCompany = "permissions.companies.create";
        public const string UpdateCompany = "permissions.companies.update";
        public const string DeleteCompany = "permissions.companies.delete";
        
        // User permissions
        public const string ViewUsers = "permissions.users.view";
        public const string CreateUser = "permissions.users.create";
        public const string UpdateUser = "permissions.users.update";
        public const string DeleteUser = "permissions.users.delete";
        
        // Product permissions
        public const string ViewProducts = "permissions.products.view";
        public const string CreateProduct = "permissions.products.create";
        public const string UpdateProduct = "permissions.products.update";
        public const string DeleteProduct = "permissions.products.delete";
        
        // Customer permissions
        public const string ViewCustomers = "permissions.customers.view";
        public const string CreateCustomer = "permissions.customers.create";
        public const string UpdateCustomer = "permissions.customers.update";
        public const string DeleteCustomer = "permissions.customers.delete";
        
        // Order permissions
        public const string ViewOrders = "permissions.orders.view";
        public const string CreateOrder = "permissions.orders.create";
        public const string UpdateOrder = "permissions.orders.update";
        public const string DeleteOrder = "permissions.orders.delete";
        
        // Invoice permissions
        public const string ViewInvoices = "permissions.invoices.view";
        public const string CreateInvoice = "permissions.invoices.create";
        public const string UpdateInvoice = "permissions.invoices.update";
        public const string DeleteInvoice = "permissions.invoices.delete";
        
        // Reports permissions
        public const string ViewReports = "permissions.reports.view";
        public const string ExportReports = "permissions.reports.export";
        
        // Admin specific permissions
        public const string ManageRoles = "permissions.admin.manageRoles";
        public const string ViewAllCompanyData = "permissions.admin.viewAllCompanyData";
        
        // Dev specific permissions
        public const string SystemAccess = "permissions.dev.systemAccess";
        public const string ConfigureSystem = "permissions.dev.configureSystem";
        public const string ViewAllData = "permissions.dev.viewAllData";
    }
} 