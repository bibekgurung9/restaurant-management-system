// Auth APIs
export const loginUrl = '/auth/login';
export const refreshTokenUrl = '/auth/refresh-token';
export const logoutUrl = '/auth/logout';
export const getMeUrl = '/auth/me';

// Dashboard Page
export const dashboardOverviewUrl = '/dashboard';

// Menu Pages 

// Categories 
export const categoryListUrl = '/category';
export const searchCategoryUrl = '/category/search';
export const addCategoryUrl = '/category';
export const updateCategoryUrl = (id: number) => `/category/${id}`;
export const deleteCategoryUrl = (id: number) => `/category/${id}`;

// Items
export const itemListUrl = '/item';
export const searchItemUrl = '/item/search';
export const addItemUrl = '/item';
export const updateItemUrl = (id: number) => `/item/${id}`;
export const deleteItemUrl = (id: number) => `/item/${id}`;

// Combos
export const comboListUrl = '/combo';
export const searchComboUrl = '/combo/search';
export const addComboUrl = '/combo';
export const updateComboUrl = (id: number) => `/combo/${id}`;
export const deleteComboUrl = (id: number) => `/combo/${id}`;

// Floor Mangement
// Table
export const tableListUrl = '/table';
export const searchTableUrl = '/table/search';
export const addTableUrl = '/table';
export const updateTableUrl = (id: number) => `/table/${id}`;
export const deleteTableUrl = (id: number) => `/table/${id}`;

// Orders
export const orderListUrl = '/order';
export const getOrderUrl = (id: number) => `/order/${id}`;
export const addOrderUrl = '/order';
export const updateOrderUrl = (id: number) => `/order/${id}`;
export const deleteOrderUrl = (id: number) => `/order/${id}`;
export const transferOrderUrl = (id: number) => `/order/${id}/transfer`;

// Billing & Payment
// Billing
export const getBillingOrderUrl = (id: number) => `/billing/order/${id}`;
export const getRecieptUrl = (id: number) => `/billing/reciept/${id}`;
export const completeOrderUrl = (id: number) => `/billing/order/${id}/complete`;
export const billingDayBookUrl = '/billing/day-book';
export const billingDayBookMetricsUrl = '/billing/day-book/metrics';
export const paymentListUrl = '/billing/payment'

// Customer
export const customerListUrl = '/customer';
export const searchCustomerUrl = '/customer/search';
export const createCustomerUrl = '/customer';
export const updateCustomerUrl = (id: number) => `/customer/${id}`;
export const deleteCustomerUrl = (id: number | null) => `/customer/${id}`;

// Credit
export const creditOrderUrl = '/credit/orders';
export const getCustomersCreditUrls = '/credit/customerss';
export const updateCustomerCreditUrl = (id: number | null) => `/credit/${id}`;

// Reports
export const getDailySalesUrl = '/reports/sales/daily';
export const getCancelledSalesUrl = '/reports/sales/cancelled';
export const getRevenueInsightsUrl = '/reports/sales/revenue-insights';

//Loyalty
export const loyaltyListUrl = '/loyalty';
export const createLoyaltyUrl = '/loyalty';
export const updateLoyaltyUrl = (id: number) => `/loyalty/${id}`;
export const deleteLoyaltyUrl = (id: number | null) => `/loyalty/${id}`;
export const checkLoyaltyEligibilityUrl = '/loyalty/check-eligibility'

// Inventory 
export const inventoryListUrl = '/inventory';
export const lowStockListUrl = '/inventory/low-stock';

// Staff
export const getStaffList = '/staff'
export const getMyProfileUrl = '/staff/me'
export const createStaffUrl = '/staff'
export const updateStaffByIdUrl = (id: number) => `/staff/${id}`;
export const deleteStaffByIdUrl = (id: number) => `/staff/${id}`;

// Logs
export const getAllAuditLogs = '/audit-logs'
export const getRecentAuditLogs = '/audit-logs'
export const getSummaryAuditLogs = '/audit-logs'
