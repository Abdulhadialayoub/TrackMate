import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    resources: {
      en: {
        translation: {
          // Common
          menuItems: {
            dashboard: 'Dashboard',
            orders: 'Orders',
            products: 'Products',
            customers: 'Customers',
            categories: 'Categories',
            settings: 'Settings',
            logout: 'Logout',
            login: 'Login',
            register: 'Register',
            userManagement: 'User Management',
            companies: 'Companies',
            activityLogs: 'Activity Logs',
            developerPanel: 'Developer Panel',
            roleManager: 'Role Manager',
            invoices: 'Invoices',
            profile: 'Profile',
            user: 'User'
          },
          
          // Auth related
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          forgotPassword: 'Forgot Password?',
          rememberMe: 'Remember Me',
          emailOrUsername: 'Email or Username',
          signIn: 'Sign In',
          signUp: 'Sign Up',
          signInToContinue: 'Sign in to your account to continue',
          dontHaveAccount: "Don't have an account?",
          emailRequired: 'Email or username is required',
          passwordRequired: 'Password is required',
          loginFailed: 'Login failed',
          unexpectedError: 'An unexpected error occurred during login attempt.',
          togglePasswordVisibility: 'toggle password visibility',
          or: 'OR',
          
          // Actions
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          add: 'Add',
          search: 'Search',
          
          // Messages
          welcomeBack: 'Welcome Back',
          accessDenied: 'Access Denied',
          comingSoon: 'Coming Soon',
          
          // User Management
          userManagement: 'User Management',
          roles: 'Roles',
          permissions: 'Permissions',
          
          // Orders
          orderStatus: 'Order Status',
          orderDate: 'Order Date',
          orderTotal: 'Order Total',
          
          // Products
          productName: 'Product Name',
          price: 'Price',
          stock: 'Stock',
          
          // Settings
          generalSettings: 'General Settings',
          accountSettings: 'Account Settings',
          notifications: 'Notifications',
          
          // Messages
          messages: 'Messages',
          inbox: 'Inbox',
          sent: 'Sent',
          
          // Invoices
          invoices: 'Invoices',
          invoiceNumber: 'Invoice Number',
          dueDate: 'Due Date',
          
          // Analysis
          analysis: 'Analysis',
          aiAnalysis: 'AI Analysis',
          
          // Company
          company: 'Company',
          companyLogs: 'Company Logs',
          companyList: 'Company List',

          // Categories translations
          categoryManagement: 'Category Management',
          addCategory: 'Add Category',
          searchCategories: 'Search categories...',
          noCategoriesFound: 'No categories found',
          editCategory: 'Edit Category',
          addNewCategory: 'Add New Category',
          categoryName: 'Category Name',
          description: 'Description',
          categoryUpdated: 'Category updated successfully',
          categoryCreated: 'Category created successfully',
          categoryDeleted: 'Category deleted successfully',
          deleteCategoryConfirm: 'Are you sure you want to delete the category "{{name}}"? This action cannot be undone, and it might fail if products are associated with it.',
          fetchCategoriesError: 'Failed to fetch categories',
          categoryActionFailed: 'Failed to {{action}} category',
          categoryActionError: 'An error occurred while {{action}} category',
          deleteCategoryFailed: 'Failed to delete category',
          deleteCategoryError: 'An error occurred while deleting category',

          // Invoices translations
          invoicesManagement: 'Invoices Management',
          searchInvoices: 'Search invoices...',
          noInvoicesFound: 'No invoices found',
          viewPdf: 'View PDF',
          downloadPdf: 'Download PDF',
          emailInvoice: 'Email Invoice',
          markAsPaid: 'Mark as Paid',
          backToInvoices: 'Back to Invoices',
          invoiceInformation: 'Invoice Information',
          from: 'From',
          customer: 'Customer',
          invoiceDate: 'Invoice Date',
          status: 'Status',
          paymentInformation: 'Payment Information',
          paymentMethod: 'Payment Method',
          paymentDate: 'Payment Date',
          referenceNumber: 'Reference Number',
          notSpecified: 'Not specified',
          notPaidYet: 'Not paid yet',
          na: 'N/A',
          invoiceItems: 'Invoice Items',
          product: 'Product',
          quantity: 'Quantity',
          unitPrice: 'Unit Price',
          taxRate: 'Tax Rate',
          taxAmount: 'Tax Amount',
          total: 'Total',
          noItemsFound: 'No items found',
          subtotal: 'Subtotal',
          taxWithRate: 'Tax ({{rate}}%)',
          notes: 'Notes',
          overdue: 'OVERDUE',
          unknownCustomer: 'Unknown Customer',
          generatePdf: 'Generate PDF',
          delete: 'Delete',
          confirmDelete: 'Confirm Delete',
          deleteInvoiceConfirm: 'Are you sure you want to delete invoice #{{number}}? This action cannot be undone.',
          recipientEmail: 'Recipient Email',
          subject: 'Subject',
          message: 'Message',
          enterEmailHelp: 'Enter the email address to send the invoice to',
          sending: 'Sending...',
          sendInvoice: 'Send Invoice',
          refresh: 'Refresh',
          actions: 'Actions',
          date: 'Date',
          customerPlaceholder: 'Customer #{{id}}',
          fetchInvoicesError: 'Failed to fetch invoices',
          emptyPdfError: 'Generated PDF is empty',
          pdfDownloadStarted: 'PDF download started',
          pdfOpenedInViewer: 'PDF opened in viewer',
          pdfOpenedInNewTab: 'PDF opened in new tab',
          pdfDownloadedFallback: 'PDF downloaded (fallback method)',
          pdfGenerationFailed: 'Failed to generate PDF',
          pdfGenerationError: 'Error generating PDF: {{error}}',
          unknownError: 'Unknown error',
          invoiceStatusUpdated: 'Invoice status updated successfully',
          updateStatusFailed: 'Failed to update invoice status',
          updateStatusError: 'Failed to update invoice status',
          invalidEmail: 'Please enter a valid email address',
          emailSentSuccess: 'Invoice sent successfully via email',
          emailSendFailed: 'Failed to send invoice email',
          emailSendError: 'Error sending invoice: {{error}}',
          ourCompany: 'Our Company',
          invoiceEmailSubject: 'Invoice #{{number}} from {{company}}',
          invoiceEmailBody: `Dear {{customer}},

Please find attached your invoice #{{number}} for the amount of {{amount}} {{currency}}.

Due date: {{dueDate}}

Thank you for your business.

Best regards,
{{company}}`,
          rowsPerPage: 'Rows per page:',
          paginationDisplayedRows: '{{from}}-{{to}} of {{count}}',

          // Invoice statuses
          draft: 'Draft',
          sent: 'Sent',
          paid: 'Paid',
          overdue: 'Overdue',
          cancelled: 'Cancelled',
          unknown: 'Unknown',

          // Dashboard translations
          dashboard: {
            systemDashboard: 'System Dashboard',
            companyDashboard: '{{company}} Dashboard',
            welcomeBack: 'Welcome Back',
            greeting: 'Hello, {{name}}',
            companyStatus: "Here's what's happening with {{company}} today.",
            companyStatusDefault: "Here's what's happening with your company today.",
            companyUsers: 'Company Users',
            activeOrders: 'Active Orders',
            companyRevenue: 'Company Revenue',
            companyProducts: 'Company Products',
            today: 'Today: {{date}}',
            monthlyGoal: 'Monthly Goal',
            recentOrders: 'Recent Orders',
            noRecentOrders: 'No recent orders found',
            customerNumber: 'Customer #{{id}}',
            unknownCustomer: 'Unknown Customer',
            quickActions: 'Quick Actions',
            addNewProduct: 'Add New Product',
            addNewCustomer: 'Add New Customer',
            createNewOrder: 'Create New Order',
            viewAll: 'View All',
            refunds: 'Refunds',
            errors: {
              objectInsteadOfString: "key '{{key}}' returned an object instead of string.",
              translationMissing: "Translation missing for key '{{key}}'",
              invalidType: "Invalid type for key '{{key}}'"
            },
            stats: {
              sales: 'Sales',
              orders: 'Orders',
              customers: 'Customers',
              refunds: 'Refunds',
              currency: '₺{{amount}}',
              increase: '+{{amount}}%',
              decrease: '-{{amount}}%'
            }
          },

          // Landing page translations
          landing: {
            welcome: 'Welcome to TrackMate',
            subtitle: 'Your all-in-one business tracking and management solution',
            getStarted: 'Get Started',
            features: 'Our Features',
            'features.analytics.title': 'Comprehensive Analytics',
            'features.analytics.description': 'Gain actionable insights through our advanced analytics dashboard',
            'features.security.title': 'Secure Platform',
            'features.security.description': 'Your data is protected with enterprise-grade security measures',
            'features.tracking.title': 'Real-time Tracking',
            'features.tracking.description': 'Monitor your business performance in real-time with live updates',
            'features.collaboration.title': 'Team Collaboration',
            'features.collaboration.description': 'Enable seamless collaboration among your team members',
            'cta.title': 'Ready to Transform Your Business?',
            'cta.description': 'Join thousands of businesses already using TrackMate to streamline operations, boost productivity, and drive growth.',
            'cta.button': 'Start Now',
            'footer.rights': 'All rights reserved.',
            'footer.email': 'Email'
          },

          // Customers translations
          customers: {
            management: 'Customers Management',
            addCustomer: 'Add Customer',
            editCustomer: 'Edit Customer',
            addNewCustomer: 'Add New Customer',
            searchPlaceholder: 'Search customers...',
            noCustomersFound: 'No customers found',
            customerNumber: 'Customer #{{id}}',
            details: 'Customer Details',
            backToList: 'Back to Customers',
            noOrdersFound: 'No orders found for this customer.',
            noInvoicesFound: 'No invoices found for this customer.',
            
            table: {
              name: 'Name',
              email: 'Email',
              phone: 'Phone',
              taxNumber: 'Tax Number',
              status: 'Status'
            },
            
            form: {
              name: 'Customer Name',
              nameRequired: 'Customer name is required',
              email: 'Email',
              emailRequired: 'Email is required',
              phone: 'Phone',
              phoneRequired: 'Phone is required',
              address: 'Address',
              addressRequired: 'Address is required',
              taxNumber: 'Tax Number',
              taxOffice: 'Tax Office',
              notes: 'Notes',
              status: 'Status'
            },
            
            details: {
              contactInfo: 'Contact Information',
              status: 'Status',
              address: 'Address',
              additionalInfo: 'Additional Information',
              taxNumber: 'Tax Number',
              taxOffice: 'Tax Office',
              notes: 'Notes',
              noNotes: 'No notes available'
            },
            
            tabs: {
              info: 'Customer Info',
              orders: 'Orders',
              invoices: 'Invoices'
            },
            
            actions: {
              viewOrders: 'View Orders',
              viewInvoices: 'View Invoices'
            },
            
            deleteConfirmation: {
              title: 'Confirm Delete',
              message: 'Are you sure you want to delete the customer "{{name}}"? This action cannot be undone.'
            }
          },

          // Common translations
          common: {
            na: 'N/A',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            create: 'Create',
            update: 'Update',
            refresh: 'Refresh',
            refreshData: 'Refresh Data',
            viewAll: 'View All',
            actions: 'Actions',
            company: 'Company',
            userProfile: 'Kullanıcı Profili',
            firstName: 'Ad',
            lastName: 'Soyad',
            email: 'E-posta',
            emailAddress: 'E-posta Adresi',
            phone: 'Telefon',
            phoneNumber: 'Telefon Numarası',
            username: 'Kullanıcı Adı',
            role: 'Rol',
            lastLogin: 'Son Giriş',
            notProvided: 'Belirtilmemiş',
            refreshProfile: 'Profil Verilerini Yenile',
            editProfileInformation: 'Profil Bilgilerini Düzenle',
            accountInformation: 'Hesap Bilgileri',
            accountUpdateNote: '* Kullanıcı adı ve rol bu arayüzden değiştirilemez. Bu bilgilerin güncellenmesi için lütfen yöneticinizle iletişime geçin.',
            changePassword: 'Şifre Değiştir',
            currentPassword: 'Mevcut Şifre',
            newPassword: 'Yeni Şifre',
            confirmNewPassword: 'Yeni Şifre (Tekrar)',
            passwordRequirement: 'Şifre en az 8 karakter uzunluğunda olmalıdır',
            passwordMismatch: 'Yeni şifreler eşleşmiyor',
            passwordTooShort: 'Şifre en az 8 karakter uzunluğunda olmalıdır',
            passwordUpdateSuccess: 'Şifre başarıyla güncellendi',
            passwordUpdateError: 'Şifre güncellenirken hata oluştu',
            savingChanges: 'Kaydediliyor...',
            saveProfileChanges: 'Değişiklikleri Kaydet',
            updating: 'Güncelleniyor...',
            updatePassword: 'Şifreyi Güncelle',
            profileUpdateSuccess: 'Profil başarıyla güncellendi',
            profileUpdateError: 'Profil güncellenirken hata oluştu',
            profileFetchError: 'Profil bilgileri yüklenirken hata oluştu',
            userIdError: 'Kullanıcı ID bulunamadı',
            roles: {
              admin: 'Yönetici',
              user: 'Kullanıcı',
              manager: 'Müdür',
              employee: 'Çalışan',
              customer: 'Müşteri'
            }
          },

          // Status translations
          customerStatus: {
            active: 'Active',
            inactive: 'Inactive',
            blocked: 'Blocked',
            deleted: 'Deleted'
          },
          
          orderStatus: {
            draft: 'Draft',
            pending: 'Pending',
            confirmed: 'Confirmed',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            completed: 'Completed'
          },
          
          invoiceStatus: {
            draft: 'Draft',
            sent: 'Sent',
            paid: 'Paid',
            overdue: 'Overdue',
            cancelled: 'Cancelled'
          },

          // Orders translations
          orders: {
            title: 'Orders Management',
            description: 'Manage all your orders here. The system supports multiple orders from the same customer.',
            searchPlaceholder: 'Search orders...',
            noOrdersFound: 'No orders found',
            unknownCustomer: 'Unknown Customer',
            unknownStatus: 'Unknown',
            invalidDate: 'Invalid Date',
            na: 'N/A',

            filter: {
              status: 'Status',
              allStatuses: 'All Statuses',
              filteredByStatus: 'Filtered by status',
              filterByStatus: 'Filter by Status'
            },

            statuses: {
              draft: 'Draft',
              pending: 'Pending',
              confirmed: 'Confirmed',
              shipped: 'Shipped',
              delivered: 'Delivered',
              cancelled: 'Cancelled',
              completed: 'Completed'
            },

            table: {
              orderNumber: 'Order #',
              customer: 'Customer',
              date: 'Date',
              orderDate: 'Order Date',
              total: 'Total',
              status: 'Status',
              actions: 'Actions',
              product: 'Product',
              quantity: 'Quantity',
              unitPrice: 'Unit Price',
              discount: 'Discount',
              subtotal: 'Subtotal',
              taxWithRate: 'Tax ({{rate}}%)',
              shippingCost: 'Shipping Cost',
              grandTotal: 'Grand Total'
            },

            actions: {
              newOrder: 'New Order',
              refreshOrders: 'Refresh Orders',
              bulkAIAnalysis: 'Bulk AI Analysis',
              createInvoice: 'Create Invoice',
              addItem: 'Add Item',
              backToOrders: 'Back to Orders',
              aiAnalysis: 'AI Analysis'
            },

            dialog: {
              createOrder: 'Create New Order',
              editOrder: 'Edit Order',
              addItem: 'Add Order Item',
              removeItem: 'Remove Item',
              deleteOrder: 'Delete Order',
              createInvoice: 'Create Invoice'
            },

            form: {
              customer: 'Customer',
              selectCustomer: 'Select a customer',
              status: 'Status',
              orderDate: 'Order Date',
              dueDate: 'Due Date',
              notes: 'Notes',
              shippingCost: 'Shipping Cost',
              taxRate: 'Tax Rate (%)',
              currency: 'Currency',
              orderItems: 'Order Items',
              product: 'Product',
              selectProduct: 'Select a product',
              quantity: 'Quantity',
              unitPrice: 'Unit Price',
              discount: 'Discount (%)',
              stock: 'Stock',
              available: 'Available',
              shippingInformation: 'Shipping Information',
              shippingAddress: 'Shipping Address',
              shippingMethod: 'Shipping Method',
              trackingNumber: 'Tracking Number'
            },

            orderDetails: {
              title: 'Order #{{number}}',
              orderInfo: 'Order Information',
              customer: 'Customer',
              orderDate: 'Order Date',
              status: 'Status',
              shippingInfo: 'Shipping Information',
              shippingAddress: 'Shipping Address',
              shippingMethod: 'Shipping Method',
              trackingNumber: 'Tracking Number'
            },

            messages: {
              loadingOrderData: 'Loading order data...',
              noItems: 'No items added',
              noOrders: 'No orders found',
              noOrdersInSystem: 'There are no orders in the system for your company. You can create a new order using the button above.',
              noSearchResults: 'No orders match the search term "{{term}}". Try a different search or clear the search field.',
              selectCustomer: 'Please select a valid customer',
              invalidCustomer: 'Selected customer is invalid or missing required information',
              insufficientStock: 'Only {{available}} units available',
              stockIssue: '{{product}}: Requested {{requested}} but only {{available}} available',
              stockIssues: 'Stock issues found: {{issues}}',
              operationSuccess: 'Order {{operation}}d successfully',
              operationError: 'An error occurred',
              operationFailed: 'Failed to {{operation}} order: {{error}}',
              validationError: '{{field}}: {{message}}',
              invalidValue: '{{field}}: Invalid value',
              validationErrorOccurred: 'Validation error occurred',
              validationErrors: 'Validation errors: {{errors}}',
              permissionDenied: 'You can only edit orders that belong to your company',
              outOfStock: '{{product}} is out of stock!',
              lowStock: 'Warning: Only {{quantity}} units of {{product}} left in stock',
              unknownError: 'Unknown error',
              noOrderSelected: 'No order selected for analysis',
              removeItemConfirm: 'Are you sure you want to remove this item from the order?',
              deleteOrderConfirm: 'Are you sure you want to delete order #{{number}}? This action cannot be undone.',
              createInvoiceConfirm: 'Are you sure you want to create an invoice from order #{{number}}?',
              createInvoiceInfo: 'This will create a new invoice with all items and financial details from this order.'
            },

            aiAnalysis: {
              title: 'YZ Sipariş Analizi',
              bulkTitle: 'Toplu YZ Sipariş Analizi',
              subtitle: 'Tüm siparişlerinizdeki eğilimleri ve desenleri analiz edin',
              loading: 'Sipariş verileri yükleniyor...',
              noOrderSelected: 'Sipariş seçilmedi. Lütfen analiz etmek için Siparişler sayfasına dönün ve bir sipariş seçin.',
              startAnalysisDescription: 'Yapay zeka ile bu siparişi analiz etmek için aşağıdaki butona tıklayın. Sistemimiz sipariş detaylarına göre öneriler sunacaktır.',
              analyzeButton: 'Siparişi Analiz Et',
              analyzingButton: 'Analiz Ediliyor...',
              recommendations: 'YZ Önerileri:',
              backToOrder: 'Siparişe Dön',
              error: {
                noValidOrder: 'Analiz edilecek geçerli sipariş verisi yok',
                failedToAnalyze: 'Sipariş analizi başarısız oldu',
                unexpectedError: 'Analiz sırasında beklenmeyen bir hata oluştu'
              }
            },

            bulkAnalysis: {
              filterTitle: 'Analiz için Siparişleri Filtrele',
              searchPlaceholder: 'Sipariş numarası veya müşteri ile ara...',
              statusLabel: 'Durum',
              ordersSelected: 'Seçili siparişler:',
              loadingOrders: 'Siparişler yükleniyor...',
              noOrdersAvailable: 'Analiz için sipariş bulunmuyor. Lütfen önce birkaç sipariş oluşturun.',
              startAnalysisDescription: 'Seçili {{count}} siparişi analiz etmek için aşağıdaki butona tıklayın. Yapay zekamız sipariş verilerinize göre desenleri, eğilimleri belirleyecek ve iş önerileri sunacaktır.',
              analyzeButton: '{{count}} Siparişi Analiz Et',
              analyzingButton: 'Analiz Ediliyor...',
              resultsTitle: 'Analiz Sonuçları',
              recommendationsTitle: 'İş Zekası ve Öneriler',
              resetButton: 'Analizi Sıfırla',
              newAnalysisButton: 'Yeni Analiz Yap',
              backToOrders: 'Siparişlere Dön',
              error: {
                noOrders: 'Analiz edilecek sipariş yok',
                noMatchingOrders: 'Filtrelerinizle eşleşen sipariş yok',
                failedToFetch: 'Siparişler yüklenemedi: {{message}}',
                noCompanyId: 'Şirket ID bulunamadı'
              }
            }
          },

          // Invoices translations
          invoices: {
            table: {
              invoiceNumber: 'Fatura No',
              date: 'Tarih',
              dueDate: 'Vade Tarihi',
              total: 'Toplam',
              status: 'Durum'
            }
          },

          // Register page translations
          register: {
            title: 'Create New Account',
            subtitle: 'Get started with TrackMate and transform your business management',
            companyInfo: {
              title: 'Company Information',
              companyName: 'Company Name',
              companyNameRequired: 'Company name is required'
            },
            personalInfo: {
              title: 'Personal Information',
              firstName: 'First Name',
              lastName: 'Last Name',
              email: 'Email Address',
              phone: 'Phone Number',
              firstNameRequired: 'First name is required',
              lastNameRequired: 'Last name is required',
              emailRequired: 'Email is required',
              emailInvalid: 'Email is invalid',
              phoneRequired: 'Phone number is required'
            },
            security: {
              title: 'Security',
              password: 'Password',
              confirmPassword: 'Confirm Password',
              passwordRequired: 'Password is required',
              passwordLength: 'Password must be at least 6 characters',
              confirmPasswordRequired: 'Please confirm your password',
              passwordsDoNotMatch: 'Passwords do not match',
              togglePassword: 'toggle password visibility'
            },
            submit: 'Create Account',
            alreadyHaveAccount: 'Already have an account?',
            signIn: 'Sign In',
            errors: {
              registrationFailed: 'Registration failed',
              unexpectedError: 'An unexpected error occurred. Please try again.'
            }
          },

          // Products translations
          products: {
            management: 'Products Management',
            addProduct: 'Add Product',
            editProduct: 'Edit Product',
            addNewProduct: 'Add New Product',
            searchPlaceholder: 'Search products...',
            noProductsFound: 'No products found',
            productDetails: 'Product Details',
            refreshTooltip: 'Refresh',
            
            status: {
              active: 'Active',
              inactive: 'Inactive',
              discontinued: 'Discontinued',
              outOfStock: 'Out of Stock'
            },
            
            table: {
              name: 'Name',
              code: 'Code',
              category: 'Category',
              price: 'Price',
              stock: 'Stock',
              status: 'Status',
              actions: 'Actions'
            },
            
            form: {
              name: 'Product Name',
              code: 'Product Code',
              description: 'Description',
              category: 'Category',
              selectCategory: 'Select a Category',
              brand: 'Brand',
              unitPrice: 'Unit Price',
              currency: 'Currency',
              unit: 'Unit (e.g., kg, pcs)',
              stockQuantity: 'Stock Quantity',
              weight: 'Weight',
              sku: 'SKU',
              model: 'Model',
              status: 'Status'
            },
            
            actions: {
              edit: 'Edit',
              delete: 'Delete',
              updateStock: 'Update Stock',
              cancel: 'Cancel',
              create: 'Create',
              update: 'Update'
            },
            
            messages: {
              createSuccess: 'Product created successfully',
              updateSuccess: 'Product updated successfully',
              deleteSuccess: 'Product deleted successfully',
              stockUpdateSuccess: 'Stock updated successfully',
              createError: 'Failed to create product',
              updateError: 'Failed to update product',
              deleteError: 'Failed to delete product',
              stockUpdateError: 'Failed to update stock',
              fetchError: 'Failed to fetch products',
              categoryRequired: 'Please select a category.',
              permissionError: 'You can only {{action}} products that belong to your company'
            },
            
            deleteConfirmation: {
              title: 'Confirm Delete',
              message: 'Are you sure you want to delete the product "{{name}}"? This action cannot be undone.'
            },
            
            stockDialog: {
              title: 'Update Stock',
              quantity: 'Stock Quantity'
            }
          },

          // User Profile translations
          profile: {
            title: 'User Profile',
            refreshProfile: 'Refresh Profile Data',
            editProfileInformation: 'Edit Profile Information',
            accountInformation: 'Account Information',
            accountUpdateNote: '* Username and role cannot be changed from this interface. Please contact your administrator to update this information.',
            
            fields: {
              firstName: 'First Name',
              lastName: 'Last Name',
              email: 'Email',
              emailAddress: 'Email Address',
              phone: 'Phone',
              phoneNumber: 'Phone Number',
              username: 'Username',
              role: 'Role',
              lastLogin: 'Last Login',
              notProvided: 'Not Provided'
            },

            password: {
              change: 'Change Password',
              current: 'Current Password',
              new: 'New Password',
              confirm: 'Confirm New Password',
              requirement: 'Password must be at least 8 characters long',
              mismatch: 'New passwords do not match',
              tooShort: 'Password must be at least 8 characters long',
              updateSuccess: 'Password updated successfully',
              updateError: 'Failed to update password'
            },

            buttons: {
              save: 'Save Changes',
              saving: 'Saving...',
              update: 'Update',
              updating: 'Updating...',
              cancel: 'Cancel'
            },

            messages: {
              updateSuccess: 'Profile updated successfully',
              updateError: 'Failed to update profile',
              fetchError: 'Failed to fetch profile data',
              userIdError: 'User ID not found'
            },

            roles: {
              admin: 'Administrator',
              user: 'User',
              manager: 'Manager',
              employee: 'Employee',
              customer: 'Customer'
            }
          }
        }
      },
      tr: {
        translation: {
          // Common
          menuItems: {
            dashboard: 'Kontrol Paneli',
            orders: 'Siparişler',
            products: 'Ürünler',
            customers: 'Müşteriler',
            categories: 'Kategoriler',
            settings: 'Ayarlar',
            logout: 'Çıkış Yap',
            login: 'Giriş Yap',
            register: 'Kayıt Ol',
            userManagement: 'Kullanıcı Yönetimi',
            companies: 'Şirketler',
            activityLogs: 'Aktivite Kayıtları',
            developerPanel: 'Geliştirici Paneli',
            roleManager: 'Rol Yöneticisi',
            invoices: 'Faturalar',
            profile: 'Kullanıcı Profili',
            user: 'Kullanıcı'
          },
          common: {
            na: 'Yok',
            edit: 'Düzenle',
            delete: 'Sil',
            cancel: 'İptal',
            create: 'Oluştur',
            update: 'Güncelle',
            refresh: 'Yenile',
            refreshData: 'Verileri Yenile',
            viewAll: 'Tümünü Gör',
            actions: 'İşlemler',
            company: 'Şirket',
            userProfile: 'Kullanıcı Profili',
            firstName: 'Ad',
            lastName: 'Soyad',
            email: 'E-posta',
            emailAddress: 'E-posta Adresi',
            phone: 'Telefon',
            phoneNumber: 'Telefon Numarası',
            username: 'Kullanıcı Adı',
            role: 'Rol',
            lastLogin: 'Son Giriş',
            refreshProfile: 'Profil Verilerini Yenile',
            editProfileInformation: 'Profil Bilgilerini Düzenle',
            accountInformation: 'Hesap Bilgileri',
            accountUpdateNote: '* Kullanıcı adı ve rol bu arayüzden değiştirilemez. Bu bilgilerin güncellenmesi için lütfen yöneticinizle iletişime geçin.',
            changePassword: 'Şifre Değiştir',
            currentPassword: 'Mevcut Şifre',
            newPassword: 'Yeni Şifre',
            confirmNewPassword: 'Yeni Şifre (Tekrar)',
            passwordRequirement: 'Şifre en az 8 karakter uzunluğunda olmalıdır',
            passwordMismatch: 'Yeni şifreler eşleşmiyor',
            passwordTooShort: 'Şifre en az 8 karakter uzunluğunda olmalıdır',
            passwordUpdateSuccess: 'Şifre başarıyla güncellendi',
            passwordUpdateError: 'Şifre güncellenirken hata oluştu',
            savingChanges: 'Kaydediliyor...',
            saveProfileChanges: 'Değişiklikleri Kaydet',
            updating: 'Güncelleniyor...',
            updatePassword: 'Şifreyi Güncelle',
            profileUpdateSuccess: 'Profil başarıyla güncellendi',
            profileUpdateError: 'Profil güncellenirken hata oluştu',
            profileFetchError: 'Profil bilgileri yüklenirken hata oluştu',
            userIdError: 'Kullanıcı ID bulunamadı',
            logout: 'Çıkış Yap',
            roles: {
              admin: 'Yönetici',
              user: 'Kullanıcı',
              manager: 'Müdür',
              employee: 'Çalışan',
              customer: 'Müşteri'
            }
          },
          
          // Auth related
          email: 'E-posta',
          password: 'Şifre',
          confirmPassword: 'Şifre Tekrar',
          forgotPassword: 'Şifremi Unuttum?',
          rememberMe: 'Beni Hatırla',
          emailOrUsername: 'E-posta veya Kullanıcı Adı',
          signIn: 'Giriş Yap',
          signUp: 'Kayıt Ol',
          signInToContinue: 'Devam etmek için giriş yapın',
          dontHaveAccount: 'Hesabınız yok mu?',
          emailRequired: 'E-posta veya kullanıcı adı gerekli',
          passwordRequired: 'Şifre gerekli',
          loginFailed: 'Giriş başarısız',
          unexpectedError: 'Giriş denemesi sırasında beklenmeyen bir hata oluştu.',
          togglePasswordVisibility: 'şifre görünürlüğünü değiştir',
          or: 'VEYA',
          
          // Actions
          save: 'Kaydet',
          cancel: 'İptal',
          delete: 'Sil',
          edit: 'Düzenle',
          add: 'Ekle',
          search: 'Ara',
          
          // Messages
          welcomeBack: 'Tekrar Hoşgeldiniz',
          accessDenied: 'Erişim Reddedildi',
          comingSoon: 'Çok Yakında',
          
          // User Management
          userManagement: 'Kullanıcı Yönetimi',
          roles: 'Roller',
          permissions: 'İzinler',
          
          // Orders
          orderStatus: 'Sipariş Durumu',
          orderDate: 'Sipariş Tarihi',
          orderTotal: 'Sipariş Toplamı',
          
          // Products
          productName: 'Ürün Adı',
          price: 'Fiyat',
          stock: 'Stok',
          
          // Settings
          generalSettings: 'Genel Ayarlar',
          accountSettings: 'Hesap Ayarları',
          notifications: 'Bildirimler',
          
          // Messages
          messages: 'Mesajlar',
          inbox: 'Gelen Kutusu',
          sent: 'Gönderilen',
          
          // Invoices
          invoices: 'Faturalar',
          invoiceNumber: 'Fatura Numarası',
          dueDate: 'Son Ödeme Tarihi',
          
          // Analysis
          analysis: 'Analiz',
          aiAnalysis: 'Yapay Zeka Analizi',
          
          // Company
          company: 'Şirket',
          companyLogs: 'Şirket Kayıtları',
          companyList: 'Şirket Listesi',

          // Categories translations
          categoryManagement: 'Kategori Yönetimi',
          addCategory: 'Kategori Ekle',
          searchCategories: 'Kategorilerde ara...',
          noCategoriesFound: 'Kategori bulunamadı',
          editCategory: 'Kategori Düzenle',
          addNewCategory: 'Yeni Kategori Ekle',
          categoryName: 'Kategori Adı',
          description: 'Açıklama',
          categoryUpdated: 'Kategori başarıyla güncellendi',
          categoryCreated: 'Kategori başarıyla oluşturuldu',
          categoryDeleted: 'Kategori başarıyla silindi',
          deleteCategoryConfirm: '"{{name}}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kategoriye bağlı ürünler varsa başarısız olabilir.',
          fetchCategoriesError: 'Kategoriler yüklenirken hata oluştu',
          categoryActionFailed: 'Kategori {{action}} işlemi başarısız oldu',
          categoryActionError: 'Kategori {{action}} işlemi sırasında hata oluştu',
          deleteCategoryFailed: 'Kategori silme işlemi başarısız oldu',
          deleteCategoryError: 'Kategori silinirken hata oluştu',

          // Invoices translations
          invoicesManagement: 'Fatura Yönetimi',
          searchInvoices: 'Faturalarda ara...',
          noInvoicesFound: 'Fatura bulunamadı',
          viewPdf: 'PDF Görüntüle',
          downloadPdf: 'PDF İndir',
          emailInvoice: 'Faturayı E-posta ile Gönder',
          markAsPaid: 'Ödendi Olarak İşaretle',
          backToInvoices: 'Faturalara Dön',
          invoiceInformation: 'Fatura Bilgileri',
          from: 'Gönderen',
          customer: 'Müşteri',
          invoiceDate: 'Fatura Tarihi',
          status: 'Durum',
          paymentInformation: 'Ödeme Bilgileri',
          paymentMethod: 'Ödeme Yöntemi',
          paymentDate: 'Ödeme Tarihi',
          referenceNumber: 'Referans Numarası',
          notSpecified: 'Belirtilmemiş',
          notPaidYet: 'Henüz ödenmedi',
          na: 'Yok',
          invoiceItems: 'Fatura Kalemleri',
          product: 'Ürün',
          quantity: 'Miktar',
          unitPrice: 'Birim Fiyat',
          taxRate: 'Vergi Oranı',
          taxAmount: 'Vergi Tutarı',
          total: 'Toplam',
          noItemsFound: 'Kalem bulunamadı',
          subtotal: 'Ara Toplam',
          taxWithRate: 'Vergi (%{{rate}})',
          notes: 'Notlar',
          overdue: 'GECİKMİŞ',
          unknownCustomer: 'Bilinmeyen Müşteri',
          generatePdf: 'PDF Oluştur',
          delete: 'Sil',
          confirmDelete: 'Silme Onayı',
          deleteInvoiceConfirm: '#{{number}} numaralı faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
          recipientEmail: 'Alıcı E-posta',
          subject: 'Konu',
          message: 'Mesaj',
          enterEmailHelp: 'Faturanın gönderileceği e-posta adresini girin',
          sending: 'Gönderiliyor...',
          sendInvoice: 'Faturayı Gönder',
          refresh: 'Yenile',
          actions: 'İşlemler',
          date: 'Tarih',
          customerPlaceholder: 'Müşteri #{{id}}',
          fetchInvoicesError: 'Faturalar yüklenirken hata oluştu',
          emptyPdfError: 'Oluşturulan PDF boş',
          pdfDownloadStarted: 'PDF indirme başladı',
          pdfOpenedInViewer: 'PDF görüntüleyicide açıldı',
          pdfOpenedInNewTab: 'PDF yeni sekmede açıldı',
          pdfDownloadedFallback: 'PDF indirildi (alternatif yöntem)',
          pdfGenerationFailed: 'PDF oluşturma başarısız oldu',
          pdfGenerationError: 'PDF oluşturulurken hata: {{error}}',
          unknownError: 'Bilinmeyen hata',
          invoiceStatusUpdated: 'Fatura durumu başarıyla güncellendi',
          updateStatusFailed: 'Fatura durumu güncellenemedi',
          updateStatusError: 'Fatura durumu güncellenirken hata oluştu',
          invalidEmail: 'Lütfen geçerli bir e-posta adresi girin',
          emailSentSuccess: 'Fatura başarıyla e-posta ile gönderildi',
          emailSendFailed: 'Fatura e-posta ile gönderilemedi',
          emailSendError: 'Fatura gönderilirken hata: {{error}}',
          ourCompany: 'Şirketimiz',
          invoiceEmailSubject: '{{company}} - Fatura #{{number}}',
          invoiceEmailBody: `Sayın {{customer}},

{{amount}} {{currency}} tutarındaki #{{number}} numaralı faturanız ekte yer almaktadır.

Son ödeme tarihi: {{dueDate}}

İşbirliğiniz için teşekkür ederiz.

Saygılarımızla,
{{company}}`,
          rowsPerPage: 'Sayfa başına satır:',
          paginationDisplayedRows: '{{count}} kayıttan {{from}}-{{to}} arası',

          // Invoice statuses
          draft: 'Taslak',
          sent: 'Gönderildi',
          paid: 'Ödendi',
          overdue: 'Gecikmiş',
          cancelled: 'İptal Edildi',
          unknown: 'Bilinmiyor',

          // Dashboard translations
          dashboard: {
            systemDashboard: 'Sistem Paneli',
            companyDashboard: '{{company}} Paneli',
            welcomeBack: 'Tekrar Hoşgeldiniz',
            greeting: 'Merhaba, {{name}}',
            companyStatus: "İşte {{company}} şirketinin bugünkü durumu.",
            companyStatusDefault: "İşte şirketinizin bugünkü durumu.",
            companyUsers: 'Şirket Kullanıcıları',
            activeOrders: 'Aktif Siparişler',
            companyRevenue: 'Şirket Geliri',
            companyProducts: 'Şirket Ürünleri',
            today: 'Bugün: {{date}}',
            monthlyGoal: 'Aylık Hedef',
            recentOrders: 'Son Siparişler',
            noRecentOrders: 'Son sipariş bulunamadı',
            customerNumber: 'Müşteri #{{id}}',
            unknownCustomer: 'Bilinmeyen Müşteri',
            quickActions: 'Hızlı İşlemler',
            addNewProduct: 'Yeni Ürün Ekle',
            addNewCustomer: 'Yeni Müşteri Ekle',
            createNewOrder: 'Yeni Sipariş Oluştur',
            viewAll: 'Tümünü Gör',
            refunds: 'İadeler',
            errors: {
              objectInsteadOfString: "'{{key}}' anahtarı string yerine nesne döndürdü.",
              translationMissing: "'{{key}}' için çeviri bulunamadı",
              invalidType: "'{{key}}' için geçersiz tip"
            },
            stats: {
              sales: 'Satışlar',
              orders: 'Siparişler',
              customers: 'Müşteriler',
              refunds: 'İadeler',
              currency: '₺{{amount}}',
              increase: '+{{amount}}%',
              decrease: '-{{amount}}%'
            }
          },

          // Landing page translations
          landing: {
            welcome: 'TrackMate\'e Hoş Geldiniz',
            subtitle: 'İşletmeniz için tüm-bir-arada takip ve yönetim çözümü',
            getStarted: 'Hemen Başla',
            features: 'Özelliklerimiz',
            'features.analytics.title': 'Kapsamlı Analitik',
            'features.analytics.description': 'Gelişmiş analitik panelimiz ile eyleme geçirilebilir içgörüler elde edin',
            'features.security.title': 'Güvenli Platform',
            'features.security.description': 'Verileriniz kurumsal düzeyde güvenlik önlemleriyle korunur',
            'features.tracking.title': 'Gerçek Zamanlı Takip',
            'features.tracking.description': 'Canlı güncellemelerle işletme performansınızı gerçek zamanlı izleyin',
            'features.collaboration.title': 'Ekip İş Birliği',
            'features.collaboration.description': 'Ekip üyeleriniz arasında sorunsuz iş birliği sağlayın',
            'cta.title': 'İşletmenizi Dönüştürmeye Hazır mısınız?',
            'cta.description': 'TrackMate\'i kullanarak operasyonlarını düzenleyen, verimliliği artıran ve büyümeyi hızlandıran binlerce işletmeye katılın.',
            'cta.button': 'Hemen Başlayın',
            'footer.rights': 'Tüm hakları saklıdır.',
            'footer.email': 'E-posta'
          },

          // Customers translations
          customers: {
            management: 'Müşteri Yönetimi',
            addCustomer: 'Müşteri Ekle',
            editCustomer: 'Müşteri Düzenle',
            addNewCustomer: 'Yeni Müşteri Ekle',
            searchPlaceholder: 'Müşteri ara...',
            noCustomersFound: 'Müşteri bulunamadı',
            customerNumber: 'Müşteri #{{id}}',
            details: 'Müşteri Detayları',
            backToList: 'Müşteri Listesine Dön',
            noOrdersFound: 'Bu müşteriye ait sipariş bulunamadı.',
            noInvoicesFound: 'Bu müşteriye ait fatura bulunamadı.',
            
            table: {
              name: 'İsim',
              email: 'E-posta',
              phone: 'Telefon',
              taxNumber: 'Vergi No',
              status: 'Durum'
            },
            
            form: {
              name: 'Müşteri Adı',
              nameRequired: 'Müşteri adı gereklidir',
              email: 'E-posta',
              emailRequired: 'E-posta gereklidir',
              phone: 'Telefon',
              phoneRequired: 'Telefon gereklidir',
              address: 'Adres',
              addressRequired: 'Adres gereklidir',
              taxNumber: 'Vergi No',
              taxOffice: 'Vergi Dairesi',
              notes: 'Notlar',
              status: 'Durum'
            },
            
            details: {
              contactInfo: 'İletişim Bilgileri',
              status: 'Durum',
              address: 'Adres',
              additionalInfo: 'Ek Bilgiler',
              taxNumber: 'Vergi No',
              taxOffice: 'Vergi Dairesi',
              notes: 'Notlar',
              noNotes: 'Not bulunmuyor'
            },
            
            tabs: {
              info: 'Müşteri Bilgisi',
              orders: 'Siparişler',
              invoices: 'Faturalar'
            },
            
            actions: {
              viewOrders: 'Siparişleri Görüntüle',
              viewInvoices: 'Faturaları Görüntüle'
            },
            
            deleteConfirmation: {
              title: 'Silmeyi Onayla',
              message: '"{{name}}" müşterisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
            }
          },

          // Status translations
          customerStatus: {
            active: 'Aktif',
            inactive: 'Pasif',
            blocked: 'Engelli',
            deleted: 'Silinmiş'
          },
          
          orderStatus: {
            draft: 'Taslak',
            pending: 'Beklemede',
            confirmed: 'Onaylandı',
            shipped: 'Kargoda',
            delivered: 'Teslim Edildi',
            cancelled: 'İptal Edildi',
            completed: 'Tamamlandı'
          },
          
          invoiceStatus: {
            draft: 'Taslak',
            sent: 'Gönderildi',
            paid: 'Ödendi',
            overdue: 'Gecikmiş',
            cancelled: 'İptal Edildi'
          },

          // Orders translations
          orders: {
            title: 'Sipariş Yönetimi',
            description: 'Tüm siparişlerinizi buradan yönetin. Sistem, aynı müşteriden birden fazla siparişi destekler.',
            searchPlaceholder: 'Siparişlerde ara...',
            noOrdersFound: 'Sipariş bulunamadı',
            unknownCustomer: 'Bilinmeyen Müşteri',
            unknownStatus: 'Bilinmiyor',
            invalidDate: 'Geçersiz Tarih',
            na: 'Yok',

            filter: {
              status: 'Durum',
              allStatuses: 'Tüm Durumlar',
              filteredByStatus: 'Duruma göre filtrelendi',
              filterByStatus: 'Duruma Göre Filtrele'
            },

            statuses: {
              draft: 'Taslak',
              pending: 'Beklemede',
              confirmed: 'Onaylandı',
              shipped: 'Kargoda',
              delivered: 'Teslim Edildi',
              cancelled: 'İptal Edildi',
              completed: 'Tamamlandı'
            },

            table: {
              orderNumber: 'Sipariş No',
              customer: 'Müşteri',
              date: 'Tarih',
              orderDate: 'Sipariş Tarihi',
              total: 'Toplam',
              status: 'Durum',
              actions: 'İşlemler',
              product: 'Ürün',
              quantity: 'Miktar',
              unitPrice: 'Birim Fiyat',
              discount: 'İndirim',
              subtotal: 'Ara Toplam',
              taxWithRate: 'Vergi (%{{rate}})',
              shippingCost: 'Kargo Ücreti',
              grandTotal: 'Genel Toplam'
            },

            actions: {
              newOrder: 'Yeni Sipariş',
              refreshOrders: 'Siparişleri Yenile',
              bulkAIAnalysis: 'Toplu YZ Analizi',
              createInvoice: 'Fatura Oluştur',
              addItem: 'Ürün Ekle',
              backToOrders: 'Siparişlere Dön',
              aiAnalysis: 'YZ Analizi'
            },

            dialog: {
              createOrder: 'Yeni Sipariş Oluştur',
              editOrder: 'Sipariş Düzenle',
              addItem: 'Sipariş Ürünü Ekle',
              removeItem: 'Ürün Kaldır',
              deleteOrder: 'Sipariş Sil',
              createInvoice: 'Fatura Oluştur'
            },

            form: {
              customer: 'Müşteri',
              selectCustomer: 'Müşteri seçin',
              status: 'Durum',
              orderDate: 'Sipariş Tarihi',
              dueDate: 'Vade Tarihi',
              notes: 'Notlar',
              shippingCost: 'Kargo Ücreti',
              taxRate: 'Vergi Oranı (%)',
              currency: 'Para Birimi',
              orderItems: 'Sipariş Ürünleri',
              product: 'Ürün',
              selectProduct: 'Ürün seçin',
              quantity: 'Miktar',
              unitPrice: 'Birim Fiyat',
              discount: 'İndirim (%)',
              stock: 'Stok',
              available: 'Mevcut',
              shippingInformation: 'Kargo Bilgileri',
              shippingAddress: 'Kargo Adresi',
              shippingMethod: 'Kargo Yöntemi',
              trackingNumber: 'Takip Numarası'
            },

            orderDetails: {
              title: 'Sipariş #{{number}}',
              orderInfo: 'Sipariş Bilgileri',
              customer: 'Müşteri',
              orderDate: 'Sipariş Tarihi',
              status: 'Durum',
              shippingInfo: 'Kargo Bilgileri',
              shippingAddress: 'Kargo Adresi',
              shippingMethod: 'Kargo Yöntemi',
              trackingNumber: 'Takip Numarası'
            },

            messages: {
              loadingOrderData: 'Sipariş verileri yükleniyor...',
              noItems: 'Ürün eklenmemiş',
              noOrders: 'Sipariş bulunamadı',
              noOrdersInSystem: 'Şirketinize ait sipariş bulunmuyor. Yukarıdaki butonu kullanarak yeni sipariş oluşturabilirsiniz.',
              noSearchResults: '"{{term}}" aramasıyla eşleşen sipariş bulunamadı. Farklı bir arama yapın veya arama alanını temizleyin.',
              selectCustomer: 'Lütfen geçerli bir müşteri seçin',
              invalidCustomer: 'Seçilen müşteri geçersiz veya gerekli bilgiler eksik',
              insufficientStock: 'Sadece {{available}} adet mevcut',
              stockIssue: '{{product}}: {{requested}} adet istendi fakat sadece {{available}} adet mevcut',
              stockIssues: 'Stok sorunları tespit edildi: {{issues}}',
              operationSuccess: 'Sipariş başarıyla {{operation}}',
              operationError: 'Bir hata oluştu',
              operationFailed: 'Sipariş {{operation}} işlemi başarısız: {{error}}',
              validationError: '{{field}}: {{message}}',
              invalidValue: '{{field}}: Geçersiz değer',
              validationErrorOccurred: 'Doğrulama hatası oluştu',
              validationErrors: 'Doğrulama hataları: {{errors}}',
              permissionDenied: 'Sadece kendi şirketinize ait siparişleri düzenleyebilirsiniz',
              outOfStock: '{{product}} stokta yok!',
              lowStock: 'Uyarı: {{product}} ürününden sadece {{quantity}} adet kaldı',
              unknownError: 'Bilinmeyen hata',
              noOrderSelected: 'Analiz için sipariş seçilmedi',
              removeItemConfirm: 'Bu ürünü siparişten kaldırmak istediğinizden emin misiniz?',
              deleteOrderConfirm: '#{{number}} numaralı siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
              createInvoiceConfirm: '#{{number}} numaralı siparişten fatura oluşturmak istediğinizden emin misiniz?',
              createInvoiceInfo: 'Bu işlem, tüm ürünler ve finansal detaylarla yeni bir fatura oluşturacak.'
            },

            aiAnalysis: {
              title: 'YZ Sipariş Analizi',
              bulkTitle: 'Toplu YZ Sipariş Analizi',
              subtitle: 'Tüm siparişlerinizdeki eğilimleri ve desenleri analiz edin',
              loading: 'Sipariş verileri yükleniyor...',
              noOrderSelected: 'Sipariş seçilmedi. Lütfen analiz etmek için Siparişler sayfasına dönün ve bir sipariş seçin.',
              startAnalysisDescription: 'Yapay zeka ile bu siparişi analiz etmek için aşağıdaki butona tıklayın. Sistemimiz sipariş detaylarına göre öneriler sunacaktır.',
              analyzeButton: 'Siparişi Analiz Et',
              analyzingButton: 'Analiz Ediliyor...',
              recommendations: 'YZ Önerileri:',
              backToOrder: 'Siparişe Dön',
              error: {
                noValidOrder: 'Analiz edilecek geçerli sipariş verisi yok',
                failedToAnalyze: 'Sipariş analizi başarısız oldu',
                unexpectedError: 'Analiz sırasında beklenmeyen bir hata oluştu'
              }
            },

            bulkAnalysis: {
              filterTitle: 'Analiz için Siparişleri Filtrele',
              searchPlaceholder: 'Sipariş numarası veya müşteri ile ara...',
              statusLabel: 'Durum',
              ordersSelected: 'Seçili siparişler:',
              loadingOrders: 'Siparişler yükleniyor...',
              noOrdersAvailable: 'Analiz için sipariş bulunmuyor. Lütfen önce birkaç sipariş oluşturun.',
              startAnalysisDescription: 'Seçili {{count}} siparişi analiz etmek için aşağıdaki butona tıklayın. Yapay zekamız sipariş verilerinize göre desenleri, eğilimleri belirleyecek ve iş önerileri sunacaktır.',
              analyzeButton: '{{count}} Siparişi Analiz Et',
              analyzingButton: 'Analiz Ediliyor...',
              resultsTitle: 'Analiz Sonuçları',
              recommendationsTitle: 'İş Zekası ve Öneriler',
              resetButton: 'Analizi Sıfırla',
              newAnalysisButton: 'Yeni Analiz Yap',
              backToOrders: 'Siparişlere Dön',
              error: {
                noOrders: 'Analiz edilecek sipariş yok',
                noMatchingOrders: 'Filtrelerinizle eşleşen sipariş yok',
                failedToFetch: 'Siparişler yüklenemedi: {{message}}',
                noCompanyId: 'Şirket ID bulunamadı'
              }
            }
          },

          // Invoices translations
          invoices: {
            table: {
              invoiceNumber: 'Fatura No',
              date: 'Tarih',
              dueDate: 'Vade Tarihi',
              total: 'Toplam',
              status: 'Durum'
            }
          },

          // Register page translations
          register: {
            title: 'Yeni Hesap Oluştur',
            subtitle: 'TrackMate ile işletme yönetiminizi dönüştürmeye başlayın',
            companyInfo: {
              title: 'Şirket Bilgileri',
              companyName: 'Şirket Adı',
              companyNameRequired: 'Şirket adı gereklidir'
            },
            personalInfo: {
              title: 'Kişisel Bilgiler',
              firstName: 'Ad',
              lastName: 'Soyad',
              email: 'E-posta Adresi',
              phone: 'Telefon Numarası',
              firstNameRequired: 'Ad gereklidir',
              lastNameRequired: 'Soyad gereklidir',
              emailRequired: 'E-posta gereklidir',
              emailInvalid: 'Geçersiz e-posta adresi',
              phoneRequired: 'Telefon numarası gereklidir'
            },
            security: {
              title: 'Güvenlik',
              password: 'Şifre',
              confirmPassword: 'Şifre Tekrar',
              passwordRequired: 'Şifre gereklidir',
              passwordLength: 'Şifre en az 6 karakter olmalıdır',
              confirmPasswordRequired: 'Lütfen şifrenizi tekrar girin',
              passwordsDoNotMatch: 'Şifreler eşleşmiyor',
              togglePassword: 'şifre görünürlüğünü değiştir'
            },
            submit: 'Hesap Oluştur',
            alreadyHaveAccount: 'Zaten hesabınız var mı?',
            signIn: 'Giriş Yap',
            errors: {
              registrationFailed: 'Kayıt başarısız oldu',
              unexpectedError: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
            }
          },

          // Products translations
          products: {
            management: 'Ürün Yönetimi',
            addProduct: 'Ürün Ekle',
            editProduct: 'Ürün Düzenle',
            addNewProduct: 'Yeni Ürün Ekle',
            searchPlaceholder: 'Ürün ara...',
            noProductsFound: 'Ürün bulunamadı',
            productDetails: 'Ürün Detayları',
            refreshTooltip: 'Yenile',
            
            status: {
              active: 'Aktif',
              inactive: 'Pasif',
              discontinued: 'Üretimi Durduruldu',
              outOfStock: 'Stokta Yok'
            },
            
            table: {
              name: 'İsim',
              code: 'Kod',
              category: 'Kategori',
              price: 'Fiyat',
              stock: 'Stok',
              status: 'Durum',
              actions: 'İşlemler'
            },
            
            form: {
              name: 'Ürün Adı',
              code: 'Ürün Kodu',
              description: 'Açıklama',
              category: 'Kategori',
              selectCategory: 'Kategori Seçin',
              brand: 'Marka',
              unitPrice: 'Birim Fiyat',
              currency: 'Para Birimi',
              unit: 'Birim (örn. kg, adet)',
              stockQuantity: 'Stok Miktarı',
              weight: 'Ağırlık',
              sku: 'Stok Kodu',
              model: 'Model',
              status: 'Durum'
            },
            
            actions: {
              edit: 'Düzenle',
              delete: 'Sil',
              updateStock: 'Stok Güncelle',
              cancel: 'İptal',
              create: 'Oluştur',
              update: 'Güncelle'
            },
            
            messages: {
              createSuccess: 'Ürün başarıyla oluşturuldu',
              updateSuccess: 'Ürün başarıyla güncellendi',
              deleteSuccess: 'Ürün başarıyla silindi',
              stockUpdateSuccess: 'Stok başarıyla güncellendi',
              createError: 'Ürün oluşturulurken hata oluştu',
              updateError: 'Ürün güncellenirken hata oluştu',
              deleteError: 'Ürün silinirken hata oluştu',
              stockUpdateError: 'Stok güncellenirken hata oluştu',
              fetchError: 'Ürünler yüklenirken hata oluştu',
              categoryRequired: 'Lütfen bir kategori seçin.',
              permissionError: 'Sadece kendi şirketinize ait ürünleri {{action}}ebilirsiniz'
            },
            
            deleteConfirmation: {
              title: 'Silmeyi Onayla',
              message: '"{{name}}" ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
            },
            
            stockDialog: {
              title: 'Stok Güncelle',
              quantity: 'Stok Miktarı'
            }
          },

          // User Profile translations
          profile: {
            title: 'Kullanıcı Profili',
            refreshProfile: 'Profil Verilerini Yenile',
            editProfileInformation: 'Profil Bilgilerini Düzenle',
            accountInformation: 'Hesap Bilgileri',
            accountUpdateNote: '* Kullanıcı adı ve rol bu arayüzden değiştirilemez. Bu bilgilerin güncellenmesi için lütfen yöneticinizle iletişime geçin.',
            
            fields: {
              firstName: 'Ad',
              lastName: 'Soyad',
              email: 'E-posta',
              emailAddress: 'E-posta Adresi',
              phone: 'Telefon',
              phoneNumber: 'Telefon Numarası',
              username: 'Kullanıcı Adı',
              role: 'Rol',
              lastLogin: 'Son Giriş',
              notProvided: 'Belirtilmemiş'
            },

            password: {
              change: 'Şifre Değiştir',
              current: 'Mevcut Şifre',
              new: 'Yeni Şifre',
              confirm: 'Yeni Şifre (Tekrar)',
              requirement: 'Şifre en az 8 karakter uzunluğunda olmalıdır',
              mismatch: 'Yeni şifreler eşleşmiyor',
              tooShort: 'Şifre en az 8 karakter uzunluğunda olmalıdır',
              updateSuccess: 'Şifre başarıyla güncellendi',
              updateError: 'Şifre güncellenirken hata oluştu'
            },

            buttons: {
              save: 'Değişiklikleri Kaydet',
              saving: 'Kaydediliyor...',
              update: 'Güncelle',
              updating: 'Güncelleniyor...',
              cancel: 'İptal'
            },

            messages: {
              updateSuccess: 'Profil başarıyla güncellendi',
              updateError: 'Profil güncellenirken hata oluştu',
              fetchError: 'Profil bilgileri yüklenirken hata oluştu',
              userIdError: 'Kullanıcı ID bulunamadı'
            },

            roles: {
              admin: 'Yönetici',
              user: 'Kullanıcı',
              manager: 'Müdür',
              employee: 'Çalışan',
              customer: 'Müşteri'
            }
          }
        }
      }
    }
  });

export default i18n; 