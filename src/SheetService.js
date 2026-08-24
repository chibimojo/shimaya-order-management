// Low-level helpers for reading/writing sheets by name.

/**
 * Returns the named sheet, creating it (with headers) if it doesn't exist yet.
 */
function getOrCreateSheet_(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Reads all data rows (excluding the header row) from a sheet as arrays.
 */
function getDataRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

/**
 * Finds the 1-indexed sheet row number for a given ID in the first column.
 * Returns -1 if not found.
 */
function findRowById_(sheet, id) {
  var rows = getDataRows_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      return i + 2; // +1 for header row, +1 for 0-index -> 1-index
    }
  }
  return -1;
}
