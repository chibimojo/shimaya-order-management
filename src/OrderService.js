// CRUD operations for the Orders sheet.

function initializeOrdersSheet() {
  getOrCreateSheet_(SHEET_NAMES.ORDERS, ORDER_HEADERS);
}

/**
 * Appends a new order and returns the generated order ID.
 * @param {{customerName: string, contact: string, item: string,
 *          quantity: number, unitPrice: number, notes: string}} orderData
 */
function addOrder(orderData) {
  if (!orderData || !orderData.customerName || !orderData.item) {
    throw new Error('customerName and item are required.');
  }

  var sheet = getOrCreateSheet_(SHEET_NAMES.ORDERS, ORDER_HEADERS);
  var quantity = Number(orderData.quantity) || 0;
  var unitPrice = Number(orderData.unitPrice) || 0;
  var orderId = Utilities.getUuid();

  var row = [];
  row[ORDER_COLUMNS.ORDER_ID] = orderId;
  row[ORDER_COLUMNS.ORDER_DATE] = new Date();
  row[ORDER_COLUMNS.CUSTOMER_NAME] = orderData.customerName;
  row[ORDER_COLUMNS.CONTACT] = orderData.contact || '';
  row[ORDER_COLUMNS.ITEM] = orderData.item;
  row[ORDER_COLUMNS.QUANTITY] = quantity;
  row[ORDER_COLUMNS.UNIT_PRICE] = unitPrice;
  row[ORDER_COLUMNS.TOTAL] = quantity * unitPrice;
  row[ORDER_COLUMNS.STATUS] = ORDER_STATUS.PENDING;
  row[ORDER_COLUMNS.NOTES] = orderData.notes || '';

  sheet.appendRow(row);
  return orderId;
}

/**
 * Returns all orders as an array of plain objects.
 */
function getAllOrders() {
  var sheet = getOrCreateSheet_(SHEET_NAMES.ORDERS, ORDER_HEADERS);
  var rows = getDataRows_(sheet);
  return rows.map(function(row) {
    return {
      orderId: row[ORDER_COLUMNS.ORDER_ID],
      orderDate: row[ORDER_COLUMNS.ORDER_DATE],
      customerName: row[ORDER_COLUMNS.CUSTOMER_NAME],
      contact: row[ORDER_COLUMNS.CONTACT],
      item: row[ORDER_COLUMNS.ITEM],
      quantity: row[ORDER_COLUMNS.QUANTITY],
      unitPrice: row[ORDER_COLUMNS.UNIT_PRICE],
      total: row[ORDER_COLUMNS.TOTAL],
      status: row[ORDER_COLUMNS.STATUS],
      notes: row[ORDER_COLUMNS.NOTES]
    };
  });
}

function getOrderById(orderId) {
  var sheet = getOrCreateSheet_(SHEET_NAMES.ORDERS, ORDER_HEADERS);
  var rowNum = findRowById_(sheet, orderId);
  if (rowNum === -1) return null;

  var row = sheet.getRange(rowNum, 1, 1, ORDER_HEADERS.length).getValues()[0];
  return {
    orderId: row[ORDER_COLUMNS.ORDER_ID],
    orderDate: row[ORDER_COLUMNS.ORDER_DATE],
    customerName: row[ORDER_COLUMNS.CUSTOMER_NAME],
    contact: row[ORDER_COLUMNS.CONTACT],
    item: row[ORDER_COLUMNS.ITEM],
    quantity: row[ORDER_COLUMNS.QUANTITY],
    unitPrice: row[ORDER_COLUMNS.UNIT_PRICE],
    total: row[ORDER_COLUMNS.TOTAL],
    status: row[ORDER_COLUMNS.STATUS],
    notes: row[ORDER_COLUMNS.NOTES]
  };
}

function updateOrderStatus(orderId, status) {
  var validStatuses = Object.keys(ORDER_STATUS).map(function(key) {
    return ORDER_STATUS[key];
  });
  if (validStatuses.indexOf(status) === -1) {
    throw new Error('Invalid status: ' + status);
  }

  var sheet = getOrCreateSheet_(SHEET_NAMES.ORDERS, ORDER_HEADERS);
  var rowNum = findRowById_(sheet, orderId);
  if (rowNum === -1) {
    throw new Error('Order not found: ' + orderId);
  }

  sheet.getRange(rowNum, ORDER_COLUMNS.STATUS + 1).setValue(status);
  return true;
}

function deleteOrder(orderId) {
  var sheet = getOrCreateSheet_(SHEET_NAMES.ORDERS, ORDER_HEADERS);
  var rowNum = findRowById_(sheet, orderId);
  if (rowNum === -1) {
    throw new Error('Order not found: ' + orderId);
  }

  sheet.deleteRow(rowNum);
  return true;
}
