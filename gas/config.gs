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
    ID: '商品ID',
    SCHOOL: '学校',
    NAME: '商品名',
    SIZE: 'サイズ',
    COLOR: '色',
    PRICE: '価格',
    NEEDS_HEMMING: '裾上げ要否' // 'Y' ならスラックス等、裾上げ入力欄を表示
  },
  PARENT: {
    ID: '親ID',
    PHONE: '電話番号',
    NAME: '保護者名',
    EMAIL: 'メールアドレス'
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
    CHILD_ID: '子どもID',
    PRODUCT_ID: '商品ID',
    QUANTITY: '数量',
    HEM_LENGTH: '裾上げ総丈',
    NOTES: '特記事項'
  }
};

// 裾上げ要否カラムの「必要」を表す値
const NEEDS_HEMMING_YES = 'Y';

// 注文番号の書式設定（例: #00001）
const ORDER_NO_PREFIX = '#';
const ORDER_NO_DIGITS = 5;
