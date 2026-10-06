/**
 * 島屋 Web予約注文API
 *
 * 島屋サイト（shimaya-site / Netlify）のサーバー処理から doPost で呼ばれる。
 * ネット予約の注文記録・状態更新・連絡履歴・お客さんへのメール送信を行う。
 *
 * ■ スクリプトプロパティ
 *   WEB_API_SECRET … Netlify の GAS_SECRET と同じ合言葉（一致しないと何もしない）
 *
 * Netlify 側は POST { secret, action, data } を送り、JSON { ok, ... } を受け取る。
 */

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return webJson_({ ok: false, error: 'bad json' }); }
  var secret = PropertiesService.getScriptProperties().getProperty('WEB_API_SECRET');
  if (!secret || !req || req.secret !== secret) return webJson_({ ok: false, error: 'unauthorized' });

  var fn = WEB_ACTIONS_[req.action];
  if (!fn) return webJson_({ ok: false, error: 'unknown action' });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var result = fn(req.data || {});
    result.ok = true;
    return webJson_(result);
  } catch (err) {
    return webJson_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

var WEB_ACTIONS_ = {
  // 新しい注文を追加して注文番号を返す
  createOrder: function (d) {
    var sh = webSheet_(WEB_SHEET_NAME.ORDER, WEB_ORDER_HEADERS);
    var map = getHeaderMap_(sh);
    var no = nextWebOrderNo_(sh, map);
    var now = new Date();
    var rec = {
      '注文番号': no, '受注日時': now, '決済状態': '決済待ち', 'ステータス': '受注受付',
      '学校': d.school, '学年': d.grade, '生徒名': d.student, '商品内容': d.items, '合計金額': d.total,
      '電話番号': "'" + d.phone, // 先頭の0が消えないように
      '連絡方法': d.contact || '', 'メール': d.email || '',
      '編集日時': now
    };
    appendRecord_(sh, rec);
    return { no: no };
  },

  // 注文の項目を更新（fields: {見出し: 値}）
  updateOrder: function (d) {
    var sh = webSheet_(WEB_SHEET_NAME.ORDER, WEB_ORDER_HEADERS);
    var map = getHeaderMap_(sh);
    var row = findWebOrderRow_(sh, map, d.no);
    if (!row) throw new Error('注文が見つかりません: ' + d.no);
    var f = d.fields || {};
    Object.keys(f).forEach(function (k) {
      if (map[k] === undefined) return;
      var v = f[k];
      if (k === '電話番号' && v) v = "'" + v;
      sh.getRange(row, map[k] + 1).setValue(v);
    });
    if (map['編集日時'] !== undefined) sh.getRange(row, map['編集日時'] + 1).setValue(new Date());
    return {};
  },

  // 注文一覧（新しい順）と連絡履歴
  listOrders: function () {
    var tz = Session.getScriptTimeZone();
    var sh = webSheet_(WEB_SHEET_NAME.ORDER, WEB_ORDER_HEADERS);
    var orders = getAllRecords_(sh).map(function (r) { return webRecordToStrings_(r, tz); })
      .filter(function (o) { return o['注文番号']; });
    orders.reverse();

    var logs = {};
    var lsh = webSheet_(WEB_SHEET_NAME.CONTACT_LOG, WEB_LOG_HEADERS);
    getAllRecords_(lsh).forEach(function (r) {
      var no = String(r['注文番号']);
      (logs[no] = logs[no] || []).push({
        at: r['日時'] instanceof Date ? Utilities.formatDate(r['日時'], tz, 'yyyy-MM-dd HH:mm') : String(r['日時']),
        kind: String(r['連絡の種類']), channel: String(r['手段']), result: String(r['結果']), body: String(r['本文'])
      });
    });
    return { orders: orders, logs: logs };
  },

  // 1件取得
  getOrder: function (d) {
    var sh = webSheet_(WEB_SHEET_NAME.ORDER, WEB_ORDER_HEADERS);
    var recs = filterRecordsByColumn_(getAllRecords_(sh), '注文番号', d.no);
    return { order: recs.length ? webRecordToStrings_(recs[0], Session.getScriptTimeZone()) : null };
  },

  // 連絡履歴を残し、注文の「最終連絡」を更新
  logContact: function (d) {
    var lsh = webSheet_(WEB_SHEET_NAME.CONTACT_LOG, WEB_LOG_HEADERS);
    appendRecord_(lsh, { '日時': new Date(), '注文番号': d.no, '連絡の種類': d.kind, '手段': d.channel, '結果': d.result, '本文': d.body || '' });
    var sh = webSheet_(WEB_SHEET_NAME.ORDER, WEB_ORDER_HEADERS);
    var map = getHeaderMap_(sh);
    var row = findWebOrderRow_(sh, map, d.no);
    if (row && map['最終連絡'] !== undefined) {
      var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'M/d HH:mm');
      sh.getRange(row, map['最終連絡'] + 1).setValue(stamp + ' ' + d.kind + '（' + d.channel + '）');
    }
    return {};
  },

  // メール送信（このスクリプトを実行するアカウント＝shimaya.sagae@gmail.com から）
  sendEmail: function (d) {
    MailApp.sendEmail({ to: d.to, subject: d.subject, body: d.body, name: WEB_MAIL_SENDER_NAME });
    return {};
  }
};

/** タブを取得。無ければ見出し付きで作る。足りない見出しは右端に追加する */
function webSheet_(name, headers) {
  var ss = SpreadsheetApp.openById(SS_ID.ORDER);
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  var map = getHeaderMap_(sh);
  var missing = headers.filter(function (h) { return map[h] === undefined; });
  if (missing.length) {
    sh.getRange(1, sh.getLastColumn() + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
  return sh;
}

function nextWebOrderNo_(sh, map) {
  var max = 0;
  var col = map['注文番号'];
  var last = sh.getLastRow();
  if (col !== undefined && last > 1) {
    sh.getRange(2, col + 1, last - 1, 1).getValues().forEach(function (r) {
      var n = parseInt(String(r[0]).replace(/\D/g, ''), 10);
      if (n > max) max = n;
    });
  }
  return WEB_ORDER_NO_PREFIX + ('00000' + (max + 1)).slice(-5);
}

function findWebOrderRow_(sh, map, no) {
  var col = map['注文番号'];
  var last = sh.getLastRow();
  if (col === undefined || last < 2) return 0;
  var vals = sh.getRange(2, col + 1, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(no)) return i + 2;
  return 0;
}

function webRecordToStrings_(r, tz) {
  var o = {};
  WEB_ORDER_HEADERS.forEach(function (h) {
    var x = r[h];
    if (x instanceof Date) x = Utilities.formatDate(x, tz, (h === '到着予定日' || h === '受け取り完了日') ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm');
    o[h] = (x === null || x === undefined) ? '' : String(x);
  });
  return o;
}

function webJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 初回だけエディタから手動実行：タブを作成し、権限（スプレッドシート・メール送信）を許可する
 */
function setupWebOrder() {
  webSheet_(WEB_SHEET_NAME.ORDER, WEB_ORDER_HEADERS);
  webSheet_(WEB_SHEET_NAME.CONTACT_LOG, WEB_LOG_HEADERS);
  Logger.log('メール送信の残り回数（今日）: ' + MailApp.getRemainingDailyQuota());
  Logger.log('準備OK：Web受注・連絡履歴タブ');
}
