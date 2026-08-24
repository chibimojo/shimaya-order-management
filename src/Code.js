// Entry points: spreadsheet menu and sidebar wiring.

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Order Management')
    .addItem('Initialize Sheet', 'initializeOrdersSheet')
    .addItem('Add Order...', 'showAddOrderSidebar')
    .addToUi();
}

function showAddOrderSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Add Order');
  SpreadsheetApp.getUi().showSidebar(html);
}
