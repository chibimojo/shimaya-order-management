/**
 * 島屋 Web予約注文API - スプレッドシート読み書きユーティリティ
 * （../src/sheetManager.gs の汎用関数と同じもの。別プロジェクトのため複製している）
 */

/**
 * シートの1行目（ヘッダー行）を読み取り、{ヘッダー名: 列インデックス(0始まり)} のマップを返す。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {Object<string, number>}
 */
function getHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  headers.forEach(function(header, index) {
    var key = String(header).trim();
    if (key !== '') {
      map[key] = index;
    }
  });
  return map;
}

/**
 * シートの全データ行（ヘッダー行を除く）を、ヘッダー名をキーとするオブジェクトの配列として取得する。
 * 各オブジェクトには元の行番号（1始まり）が _row として付与される。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {Array<Object>}
 */
function getAllRecords_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];

  var headerMap = getHeaderMap_(sheet);
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map(function(row, i) {
    var record = { _row: i + 2 };
    Object.keys(headerMap).forEach(function(header) {
      record[header] = row[headerMap[header]];
    });
    return record;
  });
}

/**
 * ヘッダー名をキーとするオブジェクトを1行としてシートの末尾に追加する。
 * ヘッダーに存在しないキーは無視される。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object} record ヘッダー名をキーとする値のオブジェクト
 */
function appendRecord_(sheet, record) {
  var headerMap = getHeaderMap_(sheet);
  var lastCol = sheet.getLastColumn();
  var row = new Array(lastCol).fill('');

  Object.keys(record).forEach(function(header) {
    if (headerMap.hasOwnProperty(header)) {
      row[headerMap[header]] = record[header];
    }
  });

  sheet.appendRow(row);
}

/**
 * getAllRecords_() の結果から、指定した列（ヘッダー名）が指定値と一致する行だけを抽出する。
 * 値は文字列化してトリムした上で比較する。
 * @param {Array<Object>} records getAllRecords_() の結果
 * @param {string} header 比較するヘッダー名
 * @param {*} value 比較する値
 * @return {Array<Object>}
 */
function filterRecordsByColumn_(records, header, value) {
  var target = String(value).trim();
  return records.filter(function(record) {
    return String(record[header]).trim() === target;
  });
}
