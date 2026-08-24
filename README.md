# Shimaya Order Management

A Google Apps Script app, bound to a Google Sheet, for tracking customer orders.

## Structure

```
src/
  appsscript.json   Apps Script manifest (timezone, scopes)
  Code.js           Menu + sidebar entry points
  Constants.js      Sheet names, column layout, order statuses
  SheetService.js   Generic sheet read/write helpers
  OrderService.js   Order CRUD (add, list, get, update status, delete)
  Sidebar.html      "Add Order" form shown in the Sheets sidebar
```

Orders are stored in an `Orders` sheet with columns: Order ID, Order Date,
Customer Name, Contact, Item, Quantity, Unit Price, Total, Status, Notes.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Log in to clasp (opens a browser for Google OAuth):
   ```
   npm run login
   ```
3. Either create a new bound Apps Script project attached to a new Sheet:
   ```
   npm run create
   ```
   or, if a script already exists, copy `.clasp.json.example` to `.clasp.json`
   and fill in its `scriptId`.
4. Push the source to Apps Script:
   ```
   npm run push
   ```
5. Open the project in the Apps Script editor or the bound Sheet:
   ```
   npm run open
   ```

`.clasp.json` is gitignored since it's specific to each developer's Apps
Script deployment.

## Usage

Open the bound spreadsheet and use the **Order Management** menu:

- **Initialize Sheet** — creates the `Orders` sheet with headers if it
  doesn't exist yet.
- **Add Order...** — opens a sidebar form to add a new order (status
  defaults to `Pending`).

Order statuses: `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`.
