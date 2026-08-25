/**
 * 島屋学生服受発注管理システム - 受注管理ビジネスロジック
 *
 * orderUI.html から google.script.run で呼び出される関数群。
 * sheetManager.gs の汎用関数（getSheet_ / getAllRecords_ / filterRecordsByColumn_ /
 * appendRecord_）をラップして、画面から使いやすい形にする。
 */

// 保護者を電話番号で検索する（ハイフン・スペースの有無を無視）
function searchParent(phone) {
  try {
    const normalizedInput = String(phone).replace(/[-\s　]/g, '');
    const parentSheet = getSheet_(SS_ID.FAMILY, SHEET_NAME.PARENT);
    const parents = getAllRecords_(parentSheet);

    const matched = parents.find(function(p) {
      return String(p[COL.PARENT.PHONE]).replace(/[-\s　]/g, '') === normalizedInput;
    });

    if (!matched) return null;

    return {
      parentId: matched[COL.PARENT.ID],
      name: matched[COL.PARENT.NAME],
      email: matched[COL.PARENT.EMAIL]
    };
  } catch (e) {
    Logger.log('searchParent Error: ' + e.toString());
    return null;
  }
}

// 子どもを親IDで取得する
function getChildrenByParentId(parentId) {
  try {
    const childSheet = getSheet_(SS_ID.FAMILY, SHEET_NAME.CHILD);
    const children = getAllRecords_(childSheet);
    const matched = filterRecordsByColumn_(children, COL.CHILD.PARENT_ID, parentId);

    return matched.map(function(c) {
      return {
        childId: c[COL.CHILD.ID],
        name: c[COL.CHILD.NAME],
        school: c[COL.CHILD.SCHOOL],
        grade: c[COL.CHILD.GRADE]
      };
    });
  } catch (e) {
    Logger.log('getChildrenByParentId Error: ' + e.toString());
    return [];
  }
}

// 商品を学校名で取得する
function getProductsBySchool(school) {
  try {
    const productSheet = getSheet_(SS_ID.PRODUCT, SHEET_NAME.PRODUCT);
    const products = getAllRecords_(productSheet);
    const matched = filterRecordsByColumn_(products, COL.PRODUCT.SCHOOL, school);

    return matched.map(function(p) {
      return {
        productId: p[COL.PRODUCT.ID],
        productName: p[COL.PRODUCT.NAME],
        size: p[COL.PRODUCT.SIZE],
        color: p[COL.PRODUCT.COLOR],
        price: Number(p[COL.PRODUCT.PRICE]) || 0,
        needsHemming: p[COL.PRODUCT.NEEDS_HEMMING]
      };
    });
  } catch (e) {
    Logger.log('getProductsBySchool Error: ' + e.toString());
    return [];
  }
}

// 受注シートの既存の注文番号の最大値から、次の注文番号を "#00001" 形式で生成する
function generateOrderNumber() {
  const orderSheet = getSheet_(SS_ID.ORDER, SHEET_NAME.ORDER);
  const orders = getAllRecords_(orderSheet);
  const pattern = new RegExp('^' + ORDER_NO_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');

  let maxSeq = 0;
  orders.forEach(function(order) {
    const m = String(order[COL.ORDER.ORDER_NO] || '').match(pattern);
    if (m) {
      const seq = parseInt(m[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });

  let padded = String(maxSeq + 1);
  while (padded.length < ORDER_NO_DIGITS) {
    padded = '0' + padded;
  }
  return ORDER_NO_PREFIX + padded;
}

// 受注シートに1件保存する
function saveOrder(order) {
  const orderSheet = getSheet_(SS_ID.ORDER, SHEET_NAME.ORDER);
  const record = {};
  record[COL.ORDER.ORDER_NO] = order.orderNumber;
  record[COL.ORDER.DATE] = new Date();
  record[COL.ORDER.CHILD_ID] = order.childId;
  record[COL.ORDER.PRODUCT_ID] = order.productId;
  record[COL.ORDER.QUANTITY] = order.quantity;
  record[COL.ORDER.HEM_LENGTH] = order.hemLength;
  record[COL.ORDER.NOTES] = order.notes;
  appendRecord_(orderSheet, record);
}

// 注文を保存する（画面から呼ばれるエントリーポイント）
// LockService で採番〜保存をロックし、同時登録による注文番号の重複を防ぐ
function submitOrder(orderData) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (!orderData || !orderData.childId || !orderData.productId) {
      throw new Error('お子さんと商品を選択してください');
    }
    const quantity = parseInt(orderData.quantity, 10);
    if (!quantity || quantity < 1) {
      throw new Error('数量は1以上で入力してください');
    }

    const orderNumber = generateOrderNumber();

    saveOrder({
      orderNumber: orderNumber,
      childId: orderData.childId,
      productId: orderData.productId,
      quantity: quantity,
      hemLength: orderData.hemLength || '',
      notes: orderData.notes || ''
    });

    // TODO: ここで LINE 通知を送信する（今後実装予定）

    return orderNumber;
  } catch (e) {
    Logger.log('submitOrder Error: ' + e.toString());
    throw new Error('注文の保存に失敗しました: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}
