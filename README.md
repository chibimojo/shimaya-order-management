# 島屋学生服受発注管理システム

Google Apps Script（スタンドアロン + Web アプリ）による、学生服の受注登録システム。
スタッフが電話番号で保護者を検索し、子ども → 商品を選んで注文を登録する。

## 構成

```
src/
  appsscript.json    Apps Script マニフェスト（タイムゾーン、権限、Web アプリ設定）
  config.gs          スプレッドシートID・シート名・カラム名などの定数
  sheetManager.gs    ヘッダー名ベースのスプレッドシート読み書きユーティリティ
  orderManagement.gs 受注管理のビジネスロジック（検索・採番・登録）
  orderUI.html       受注登録画面（Web UI）
web-api/             Web予約注文API（島屋サイトのネット予約用・別の Apps Script プロジェクト）
  appsscript.json    マニフェスト（スプレッドシート・メール送信の権限）
  config.gs          受注スプレッドシートID・タブ名・見出し
  sheetManager.gs    ヘッダー名ベースの読み書き（src/sheetManager.gs と同じ関数）
  webOrderApi.gs     doPost API（注文作成・更新・一覧・連絡履歴・メール送信）
```

このスクリプトはどのスプレッドシートにも束縛されない**スタンドアロン**プロジェクトで、
`config.gs` の `SS_ID` で指定した3つの外部スプレッドシートを `SpreadsheetApp.openById()`
で読み書きする。

## 使用するスプレッドシート

| 用途 | スプレッドシートID |
| --- | --- |
| 商品マスタ | `1YM_3e8ZVvERJVdl2fPCQilhfBV5NbUFeon_0TYKAkOk` |
| 親・子ども | `179GUvz-8hxAi1WRdoDi5M9KTdiw-N7kI2LpdwFfn0EY` |
| 受注 | `1YRP0N6A9J7xbfsB9vDvU3Ef8kbu2jRi7ibq9Mg3gxDg` |

### 想定しているシート構成（`config.gs` の `SHEET_NAME` / `COL`）

コードはヘッダー名（1行目のセルの文字列）でカラムを参照するため、列の並び順が
変わっても動作する。ただし**シート名・ヘッダー名は実際のシートに合わせて
`config.gs` を書き換える必要がある**。デフォルトの想定は以下の通り。

**商品マスタ シート「商品マスタ」**

| 学校 | 商品コード | 商品名 | カテゴリ | 価格 |
| --- | --- | --- | --- | --- |

- 商品名またはカテゴリに「スラックス」を含む商品は、受注登録画面で
  「裾上げ総丈」入力欄が自動的に表示される（`config.gs` の `SLACKS_KEYWORD`）。

**親・子ども スプレッドシート**

シート「親」：

| 親ID | 電話番号 | 保護者名 |
| --- | --- | --- |

シート「子ども」：

| 子どもID | 親ID | 子ども名 | 学校 | 学年 |
| --- | --- | --- | --- | --- |

**受注 シート「受注」**

| 注文番号 | 受注日 | 親ID | 保護者名 | 電話番号 | 子どもID | 子ども名 | 学校 | 商品コード | 商品名 | 数量 | 価格 | 裾上げ総丈 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

1件の注文に複数の商品が含まれる場合、同じ「注文番号」で明細行が複数追加される。
注文番号は `#00001` 形式で自動採番される（既存の最大番号 + 1）。

## セットアップ

1. 依存関係をインストール：
   ```
   npm install
   ```
2. clasp にログイン（ブラウザで Google 認証）：
   ```
   npm run login
   ```
3. スタンドアロンの Apps Script プロジェクトを新規作成：
   ```
   npm run create
   ```
   既存のスクリプトを使う場合は `.clasp.json.example` を `.clasp.json` に
   コピーし、`scriptId` を設定する。
4. ソースを Apps Script にプッシュ：
   ```
   npm run push
   ```
5. スクリプトに実行権限を与えるため、上記3つのスプレッドシートに
   スクリプトの実行アカウント（`npm run create` を実行した Google アカウント）の
   編集権限があることを確認する。
6. Web アプリとして公開：
   ```
   npm run deploy
   ```
   または Apps Script エディタから「デプロイ」→「新しいデプロイ」→
   種類「ウェブアプリ」を選択。`appsscript.json` の `webapp` 設定では
   アクセスを `DOMAIN`（同一 Google Workspace ドメイン内）、実行ユーザーを
   `USER_DEPLOYING`（デプロイしたアカウント）としている。組織の運用に合わせて
   調整すること。

`.clasp.json` は開発者ごとのデプロイ情報を含むため gitignore されている。

## 使い方（受注登録の流れ）

1. デプロイした Web アプリの URL を開く。
2. 電話番号を入力して「検索」→ 保護者と子ども一覧が表示される。
3. 子どもを選択 → その子どもの在籍校向けの商品一覧が表示される。
4. 購入する商品の数量を入力（スラックスの場合は「裾上げ総丈」も入力）。
5. 「受注登録する」を押すと受注シートに保存され、注文番号が表示される。

## Web予約注文API（web-api/）

島屋サイト（リポジトリ `shimaya-site`、Netlify）のネット予約（指定ズック等。Square で事前決済・店頭受け取り）の
注文を、受注スプレッドシートの **「Web受注」「連絡履歴」タブ** に記録する API。
サイトの管理画面（`/admin/`）から、お客さんへのお知らせメールもこの API 経由で
**shimaya.sagae@gmail.com** から送る。

受注登録画面（`src/`）とは**別の Apps Script プロジェクト**にしている。
API は Netlify のサーバーから呼ばれるため「全員」に公開する必要があり、
同じプロジェクトにすると受注登録画面まで誰でも開けてしまうため。

| 項目 | 内容 |
| --- | --- |
| 呼び出し元 | shimaya-site の `netlify/lib/gas.mjs`（環境変数 `GAS_URL` / `GAS_SECRET`） |
| 認証 | スクリプトプロパティ `WEB_API_SECRET` と、リクエストの `secret` が一致したときだけ動く |
| 操作 | `createOrder` / `updateOrder` / `listOrders` / `getOrder` / `logContact` / `sendEmail` |
| 注文番号 | `W00001` 形式（店頭受注の `#00001` とは別の連番） |

### セットアップ（shimaya.sagae@gmail.com で）

1. `npm run web:create`（または script.google.com で新規プロジェクトを作り、
   `web-api/.clasp.json.example` を `web-api/.clasp.json` にコピーして `scriptId` を設定）
2. `npm run web:push`
3. エディタの「プロジェクトの設定」→ スクリプト プロパティに `WEB_API_SECRET`
   （Netlify の `GAS_SECRET` と同じ長いランダム文字列）を追加
4. エディタで `setupWebOrder` を1回実行して権限を許可（タブが自動で作られる）
5. 「デプロイ」→「新しいデプロイ」→ ウェブアプリ、実行ユーザー＝自分、
   アクセス＝全員 でデプロイし、URL を Netlify の `GAS_URL` に登録
6. コードを変えたら `npm run web:push` のあと「デプロイを管理」→ 編集 →
   バージョン「新バージョン」で更新する（URL は変わらない）

## 今後の予定

- 受注登録完了時に LINE 通知を送信する機能（`orderManagement.gs` の
  `submitOrder` 内に `TODO` コメントあり）。
