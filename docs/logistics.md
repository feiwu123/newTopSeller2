# Logistics Binding

## Flow (API v4)
- `merchants_logistics.php?action=lists` returns both:
  - `data.list`: bound logistics
  - `data.logisticsArr`: bindable logistics (either array or object keys)
- `merchants_logistics.php?action=insert` binds by `label_name`.

## Current UI/Backend behavior
- UI loads `/api/merchants_logistics/lists` first, then binds by selecting/searching from the bindable list.
- Backend `/api/merchants_logistics/insert` validates `label_name` is still bindable by calling `lists` before proxying `insert`.

