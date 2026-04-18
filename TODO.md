# Fix insertBefore DOM Error (React 19 RC Bug)

## Plan Status: Approved - Implementing

**Root Cause:** React 19 RC DOM reconciliation race with Lucide icons (<Check>) during StrictMode double-render.

**Steps:**

### 1. [x] Downgrade React to stable 18.3.1
- Edit package.json
- `npm install`

### 2. [✓] Memoize dynamic icons (prevent re-mount)
- src/components/ProductDetail.tsx (copySku Check) ✓
- src/components/Layout.tsx (TopBar notifications)

### 3. [ ] Test triggers
- Copy SKU in ProductDetail
- Modal saves (ProductModal)
- TopBar notifications open/close

### 4. [✓] Add global error handlers + disable StrictMode temp
- src/main.tsx ✓

### 5. [ ] Cleanup & attempt_completion

**Next:** Implementing step 1 (package.json).
