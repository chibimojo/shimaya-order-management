// Shared constants for the Order Management spreadsheet.

var SHEET_NAMES = {
  ORDERS: 'Orders',
  CUSTOMERS: 'Customers'
};

var ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

// Column order for the Orders sheet. Index 0 = column A.
var ORDER_HEADERS = [
  'Order ID',
  'Order Date',
  'Customer Name',
  'Contact',
  'Item',
  'Quantity',
  'Unit Price',
  'Total',
  'Status',
  'Notes'
];

var ORDER_COLUMNS = {
  ORDER_ID: 0,
  ORDER_DATE: 1,
  CUSTOMER_NAME: 2,
  CONTACT: 3,
  ITEM: 4,
  QUANTITY: 5,
  UNIT_PRICE: 6,
  TOTAL: 7,
  STATUS: 8,
  NOTES: 9
};
