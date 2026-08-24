/**
 * 島屋学生服受発注管理システム - 受注管理ビジネスロジック
 *
 * orderUI.html から google.script.run 経由で呼び出される関数群。
 * 「電話番号で親を検索 → 子どもを選択 → 商品を選択 → 受注登録」という
 * 一連の受注登録フローを実装する。
 */

/**
 * Web アプリとして公開したときのエントリーポイント。
 * 受注登録画面（orderUI.html）を返す。
 * @param {Object} e doGet イベントオブジェクト（未使用）
 * @return {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('orderUI')
    .setTitle('島屋学生服 受注登録')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 電話番号（ハイフン・スペースの有無を無視）で保護者を検索し、
 * 該当する保護者とその子ども一覧を返す。
 * @param {string} phone 検索する電話番号
 * @return {{parent: {id:string,name:string,phone:string}, children: Array<Object>}}
 */
function searchParentByPhone(phone) {
  if (!phone || String(phone).trim() === '') {
    throw new Error('電話番号を入力してください。');
  }

  var normalizedInput = normalizePhone_(phone);
  var parentSheet = getSheet_(SS_ID.FAMILY, SHEET_NAME.PARENT);
  var parents = getAllRecords_(parentSheet);

  var matched = parents.filter(function(p) {
    return normalizePhone_(p[COL.PARENT.PHONE]) === normalizedInput;
  });

  if (matched.length === 0) {
    throw new Error('この電話番号に一致する保護者が見つかりませんでした。');
  }

  // 同一電話番号に複数の保護者が登録されているケースは想定していないため、先頭の1件を採用する
  var parent = matched[0];
  var children = getChildrenByParentId(parent[COL.PARENT.ID]);

  return {
    parent: {
      id: parent[COL.PARENT.ID],
      name: parent[COL.PARENT.NAME],
      phone: parent[COL.PARENT.PHONE]
    },
    children: children
  };
}

/**
 * 電話番号からハイフン・各種スペースを除去し、比較しやすい形式にする。
 * @param {string} phone
 * @return {string}
 */
function normalizePhone_(phone) {
  return String(phone || '').replace(/[-\s　]/g, '');
}

/**
 * 親IDに紐づく子ども一覧を取得する。
 * @param {string} parentId
 * @return {Array<{id:string, name:string, school:string, grade:string}>}
 */
function getChildrenByParentId(parentId) {
  var childSheet = getSheet_(SS_ID.FAMILY, SHEET_NAME.CHILD);
  var children = getAllRecords_(childSheet);
  var matched = filterRecordsByColumn_(children, COL.CHILD.PARENT_ID, parentId);

  return matched.map(function(c) {
    return {
      id: c[COL.CHILD.ID],
      name: c[COL.CHILD.NAME],
      school: c[COL.CHILD.SCHOOL],
      grade: c[COL.CHILD.GRADE]
    };
  });
}

/**
 * 子どもIDから在籍校を特定し、その学校向けの商品リストを返す。
 * @param {string} childId
 * @return {Array<Object>}
 */
function getProductsForChild(childId) {
  if (!childId) {
    throw new Error('子どもが選択されていません。');
  }

  var childSheet = getSheet_(SS_ID.FAMILY, SHEET_NAME.CHILD);
  var children = getAllRecords_(childSheet);
  var child = children.filter(function(c) {
    return String(c[COL.CHILD.ID]) === String(childId);
  })[0];

  if (!child) {
    throw new Error('指定された子どもが見つかりませんでした。');
  }

  return getProductsBySchool(child[COL.CHILD.SCHOOL]);
}

/**
 * 学校名で商品マスタを絞り込んで返す。
 * 各商品に isSlacks（スラックス＝裾上げ入力欄が必要な商品かどうか）を付与する。
 * @param {string} school
 * @return {Array<{code:string, name:string, category:string, price:number, isSlacks:boolean}>}
 */
function getProductsBySchool(school) {
  var productSheet = getSheet_(SS_ID.PRODUCT, SHEET_NAME.PRODUCT);
  var products = getAllRecords_(productSheet);
  var matched = filterRecordsByColumn_(products, COL.PRODUCT.SCHOOL, school);

  return matched.map(function(p) {
    return {
      code: p[COL.PRODUCT.CODE],
      name: p[COL.PRODUCT.NAME],
      category: p[COL.PRODUCT.CATEGORY],
      price: Number(p[COL.PRODUCT.PRICE]) || 0,
      isSlacks: isSlacksProduct_(p)
    };
  });
}

/**
 * 商品がスラックス（裾上げが必要な商品）かどうかを判定する。
 * カテゴリまたは商品名に SLACKS_KEYWORD を含むかどうかで判定する。
 * @param {Object} product getAllRecords_ で取得した商品マスタの1行分
 * @return {boolean}
 */
function isSlacksProduct_(product) {
  var category = String(product[COL.PRODUCT.CATEGORY] || '');
  var name = String(product[COL.PRODUCT.NAME] || '');
  return category.indexOf(SLACKS_KEYWORD) !== -1 || name.indexOf(SLACKS_KEYWORD) !== -1;
}

/**
 * 受注シートの既存の注文番号の最大値から、次の注文番号を "#00001" 形式で生成する。
 * 呼び出し元（submitOrder）でロックを取得してから呼ぶこと。
 * @return {string}
 */
function generateOrderNumber_() {
  var orderSheet = getSheet_(SS_ID.ORDER, SHEET_NAME.ORDER);
  var orders = getAllRecords_(orderSheet);
  var pattern = new RegExp('^' + escapeRegExp_(ORDER_NO_PREFIX) + '(\\d+)$');

  var maxSeq = 0;
  orders.forEach(function(order) {
    var orderNo = String(order[COL.ORDER.ORDER_NO] || '');
    var m = orderNo.match(pattern);
    if (m) {
      var seq = parseInt(m[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });

  var padded = String(maxSeq + 1);
  while (padded.length < ORDER_NO_DIGITS) {
    padded = '0' + padded;
  }
  return ORDER_NO_PREFIX + padded;
}

/**
 * 正規表現の特殊文字をエスケープする。
 * @param {string} str
 * @return {string}
 */
function escapeRegExp_(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 受注登録画面から送信された注文データを検証し、受注シートに保存する。
 * 1回の注文に複数の商品明細が含まれる場合、同じ注文番号で明細行を複数追加する。
 * LockService により、複数スタッフが同時に登録しても注文番号が重複しないようにしている。
 *
 * @param {{
 *   parentId: string, parentName: string, phone: string,
 *   childId: string, childName: string, school: string,
 *   items: Array<{code:string, name:string, price:number, quantity:number, hemLength:string}>,
 *   note: string
 * }} orderData
 * @return {{orderNo: string}}
 */
function submitOrder(orderData) {
  validateOrderData_(orderData);

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var orderNo = generateOrderNumber_();
    var orderSheet = getSheet_(SS_ID.ORDER, SHEET_NAME.ORDER);
    var now = new Date();

    orderData.items.forEach(function(item) {
      var record = {};
      record[COL.ORDER.ORDER_NO] = orderNo;
      record[COL.ORDER.DATE] = now;
      record[COL.ORDER.PARENT_ID] = orderData.parentId;
      record[COL.ORDER.PARENT_NAME] = orderData.parentName;
      record[COL.ORDER.PHONE] = orderData.phone;
      record[COL.ORDER.CHILD_ID] = orderData.childId;
      record[COL.ORDER.CHILD_NAME] = orderData.childName;
      record[COL.ORDER.SCHOOL] = orderData.school;
      record[COL.ORDER.PRODUCT_CODE] = item.code;
      record[COL.ORDER.PRODUCT_NAME] = item.name;
      record[COL.ORDER.QUANTITY] = item.quantity;
      record[COL.ORDER.PRICE] = item.price;
      record[COL.ORDER.HEM_LENGTH] = item.hemLength || '';
      record[COL.ORDER.STATUS] = ORDER_STATUS.NEW;
      record[COL.ORDER.NOTE] = orderData.note || '';
      appendRecord_(orderSheet, record);
    });

    // TODO: ここで LINE 通知を送信する（今後実装予定）

    return { orderNo: orderNo };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 注文データの必須項目・値の妥当性をチェックする。不正な場合は Error を投げる。
 * @param {Object} orderData
 */
function validateOrderData_(orderData) {
  if (!orderData) {
    throw new Error('注文データがありません。');
  }
  if (!orderData.parentId) {
    throw new Error('保護者が選択されていません。');
  }
  if (!orderData.childId) {
    throw new Error('子どもが選択されていません。');
  }
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('商品が1件も選択されていません。');
  }

  orderData.items.forEach(function(item, index) {
    if (!item.code || !item.name) {
      throw new Error('商品情報が不正です（' + (index + 1) + '件目）。');
    }
    var qty = Number(item.quantity);
    if (!qty || qty <= 0) {
      throw new Error('数量は1以上を入力してください（' + item.name + '）。');
    }
  });
}
