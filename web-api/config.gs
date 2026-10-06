/**
 * 島屋 Web予約注文API - 設定
 *
 * 島屋サイト（shimaya-site / Netlify）のネット予約（Square決済・店頭受け取り）の
 * 注文と連絡履歴を、受注スプレッドシートの別タブに記録する。タブが無ければ自動で作る。
 *
 * 受注登録画面（../src）とは別の Apps Script プロジェクトとして動かす。
 * （このAPIはNetlifyから呼ばれるため公開範囲が異なる。受注登録画面の公開範囲は変えない）
 */

// 受注スプレッドシート（../src/config.gs の SS_ID.ORDER と同じ）
const SS_ID = {
  ORDER: '1YRP0N6A9J7xbfsB9vDvU3Ef8kbu2jRi7ibq9Mg3gxDg'
};

const WEB_SHEET_NAME = {
  ORDER: 'Web受注',
  CONTACT_LOG: '連絡履歴'
};

// Web受注タブの見出し（この順で作成。読み書きは見出し名で行う）
// 既存のタブに無い見出しは、右端に自動で追加される
const WEB_ORDER_HEADERS = ['注文番号', 'Square注文ID', '受注日時', '決済状態', 'ステータス', '学校', '学年', '生徒名',
  '商品内容', '合計金額', '電話番号', '連絡方法', 'メール', 'LINEユーザーID', '到着予定日', '最終連絡', '受け取り完了日', 'メモ', '編集日時'];
const WEB_LOG_HEADERS = ['日時', '注文番号', '連絡の種類', '手段', '結果', '本文'];

// Web注文の注文番号（例: W00001）。店頭受注の「#00001」とは別の連番
const WEB_ORDER_NO_PREFIX = 'W';

// メール送信時の差出人名（送信元アドレスはこのスクリプトを実行するアカウント＝shimaya.sagae@gmail.com）
const WEB_MAIL_SENDER_NAME = '島屋（寒河江市）';
