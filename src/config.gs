/**
 * 島屋学生服受発注管理システム - 設定ファイル
 *
 * スプレッドシートID・シート名・カラム（ヘッダー）名などの定数をまとめて管理する。
 * 実際のスプレッドシートのシート名・ヘッダー名がここと異なる場合は、
 * このファイルだけを書き換えればよいようにしている。
 */

// ==================== スプレッドシートID ====================
const SS_ID = {
  PRODUCT: '1YM_3e8ZVvERJVdl2fPCQilhfBV5NbUFeon_0TYKAkOk', // 商品マスタ
  FAMILY: '179GUvz-8hxAi1WRdoDi5M9KTdiw-N7kI2LpdwFfn0EY',  // 親・子ども
  ORDER: '1YRP0N6A9J7xbfsB9vDvU3Ef8kbu2jRi7ibq9Mg3gxDg'    // 受注
};

// ==================== シート名（各スプレッドシート内のタブ名） ====================
// 実際のシート名に合わせて調整してください。
const SHEET_NAME = {
  PRODUCT: '商品マスタ',
  PARENT: '親',
  CHILD: '子ども',
  ORDER: '受注'
};

// ==================== カラム名（各シート1行目のヘッダー文字列） ====================
// ヘッダー名をキーにしてセルを読み書きするため、列の並び順が変わっても影響を受けない。
// 実際のヘッダー文字列がここと異なる場合はここを書き換えるだけでよい。
const COL = {
  PRODUCT: {
    SCHOOL: '学校',
    CODE: '商品コード',
    NAME: '商品名',
    CATEGORY: 'カテゴリ',
    PRICE: '価格'
  },
  PARENT: {
    ID: '親ID',
    PHONE: '電話番号',
    NAME: '保護者名'
  },
  CHILD: {
    ID: '子どもID',
    PARENT_ID: '親ID',
    NAME: '子ども名',
    SCHOOL: '学校',
    GRADE: '学年'
  },
  ORDER: {
    ORDER_NO: '注文番号',
    DATE: '受注日',
    PARENT_ID: '親ID',
    PARENT_NAME: '保護者名',
    PHONE: '電話番号',
    CHILD_ID: '子どもID',
    CHILD_NAME: '子ども名',
    SCHOOL: '学校',
    PRODUCT_CODE: '商品コード',
    PRODUCT_NAME: '商品名',
    QUANTITY: '数量',
    PRICE: '価格',
    HEM_LENGTH: '裾上げ総丈',
    STATUS: 'ステータス',
    NOTE: '備考'
  }
};

// スラックス判定用キーワード。商品名またはカテゴリにこの文字列を含む場合、
// 受注登録画面で「裾上げ総丈」入力欄を表示する。
const SLACKS_KEYWORD = 'スラックス';

// 注文番号の書式設定（例: #00001）
const ORDER_NO_PREFIX = '#';
const ORDER_NO_DIGITS = 5;

// 受注ステータス
const ORDER_STATUS = {
  NEW: '新規',
  CONFIRMED: '確認済',
  CANCELLED: 'キャンセル'
};
