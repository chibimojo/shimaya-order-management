/**
 * 島屋学生服受発注管理システム - Web App エントリーポイント
 */

function doGet() {
  const html = HtmlService.createHtmlOutput(getOrderUI());
  html.setWidth(1000).setHeight(800);
  return html;
}

/**
 * orderUI.html の内容（テンプレート評価済み）を文字列で返す
 */
function getOrderUI() {
  return HtmlService.createTemplateFromFile('orderUI').evaluate().getContent();
}
