// messageService.js
import api from './api';

export const messageService = {
    getMessageLogs: async () => {
        try {
            // Get the company ID from localStorage
            const companyId = localStorage.getItem('company_id');
            
            // Since /message/logs/company/{id} is not found, try using the default endpoint
            // and filter results client-side if needed
            const response = await api.get('/message/logs');
            
            // Log the response for debugging
            console.log('Message logs response:', response.data);
            
            let messageData = [];
            
            // If the response is successful and has data
            if (response.data && response.data.data) {
                // Get the data in the right format
                if (Array.isArray(response.data.data)) {
                    messageData = response.data.data;
                } else if (response.data.data.$values && Array.isArray(response.data.data.$values)) {
                    messageData = response.data.data.$values;
                }
                
                // Filter by company ID if needed
                if (companyId) {
                    messageData = messageData.filter(msg => 
                        msg.companyId === parseInt(companyId) || 
                        msg.companyId === companyId
                    );
                }
            }
            
            return {
                success: response.data.success,
                data: messageData,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error getting message logs:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get message logs',
                data: []
            };
        }
    },

    getMessageLogById: async (id) => {
        try {
            const response = await api.get(`/message/logs/${id}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error(`Error getting message log ${id}:`, error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get message log',
                data: null
            };
        }
    },

    getMessageLogsByCustomer: async (customerId) => {
        try {
            const response = await api.get(`/message/logs/customer/${customerId}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error(`Error getting message logs for customer ${customerId}:`, error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get customer message logs',
                data: []
            };
        }
    },

    getMessageLogsByType: async (messageType) => {
        try {
            const response = await api.get(`/message/logs/type/${messageType}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error(`Error getting message logs of type ${messageType}:`, error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get message logs by type',
                data: []
            };
        }
    },

    sendMessage: async (messageData) => {
        try {
            // Try sending through the email endpoint instead, which is more likely to work
            const emailData = {
                to: messageData.recipient,
                subject: messageData.subject,
                body: messageData.content,
                companyId: messageData.companyId,
                customerId: messageData.customerId
            };
            
            console.log('Sending email using simplified approach:', emailData);
            const response = await api.post('/email/send', emailData);
            
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Email sent successfully'
            };
        } catch (error) {
            console.error('Error sending message:', error);
            // Log detailed error response
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
                
                // Check for validation errors
                if (error.response.data && error.response.data.errors) {
                    console.error('Validation errors:', error.response.data.errors);
                }
            }
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send message',
                data: null
            };
        }
    },

    // Fallback direct email sending function that uses the raw email endpoint
    sendDirectEmail: async (to, subject, body, companyId, customerId = null) => {
        try {
            const emailData = {
                to,
                subject,
                body,
                companyId: parseInt(companyId),
                customerId: customerId ? parseInt(customerId) : null
            };
            
            console.log('Sending direct email:', emailData);
            const response = await api.post('/email/send', emailData);
            
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Email sent successfully'
            };
        } catch (error) {
            console.error('Error sending direct email:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send email',
                data: null
            };
        }
    },

    deleteMessageLog: async (id) => {
        try {
            const response = await api.delete(`/message/logs/${id}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error(`Error deleting message log ${id}:`, error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete message log',
                data: false
            };
        }
    },

    // Add this method to directly fetch from database if API endpoints fail
    getMessageLogsDirectFromDb: async () => {
        try {
            const companyId = localStorage.getItem('company_id');
            const token = localStorage.getItem('token');
            
            // Try direct SQL query via special endpoint
            const response = await fetch('https://localhost:7092/api/db/query', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `SELECT * FROM MessageLogs WHERE CompanyId = ${companyId} ORDER BY Id DESC`,
                    parameters: {}
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Direct DB query result:', data);
                
                return {
                    success: true,
                    data: data.results || [],
                    message: 'Data fetched directly from database'
                };
            } else {
                console.error('Failed to execute direct database query');
                return {
                    success: false,
                    message: 'Failed to execute direct database query',
                    data: []
                };
            }
        } catch (error) {
            console.error('Error fetching message logs directly from database:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch message logs from database',
                data: []
            };
        }
    },

    // Add a method to send invoice via email with PDF attachment
    sendInvoiceEmail: async (invoiceId, recipient, subject, body) => {
        try {
            const companyId = localStorage.getItem('company_id');
            
            // Create the email data
            const emailData = {
                invoiceId: parseInt(invoiceId),
                to: recipient,
                subject: subject || 'Your Invoice',
                body: body || 'Please find attached invoice.',
                includeAttachment: true, // Make sure to include the PDF attachment
                companyId: parseInt(companyId)
            };
            
            console.log('Sending invoice email with attachment:', emailData);
            const response = await api.post('/email/send-invoice', emailData);
            
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message || 'Invoice sent via email successfully'
            };
        } catch (error) {
            console.error('Error sending invoice email:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send invoice email',
                data: null
            };
        }
    }
}; 