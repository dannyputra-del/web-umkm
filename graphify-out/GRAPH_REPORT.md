# Graph Report - umkm-ecommerce  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 105 nodes · 185 edges · 8 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `555357ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- compilerOptions
- AdminDashboard.tsx
- page.tsx
- index.ts
- layout.tsx
- devDependencies
- ImageDropzone.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `react` - 12 edges
3. `HomePage()` - 10 edges
4. `StoreInfo` - 9 edges
5. `CartItem` - 8 edges
6. `Product` - 7 edges
7. `Order` - 6 edges
8. `scripts` - 5 edges
9. `AdminDashboardProps` - 4 edges
10. `PaymentMethod` - 4 edges

## Surprising Connections (you probably didn't know these)
- `HeaderProps` --references--> `StoreInfo`  [EXTRACTED]
  src/components/Header.tsx → src/types/index.ts
- `ProductCardProps` --references--> `Product`  [EXTRACTED]
  src/components/ProductCard.tsx → src/types/index.ts
- `CartDrawerProps` --references--> `CartItem`  [EXTRACTED]
  src/components/CartDrawer.tsx → src/types/index.ts
- `CartFloatingBarProps` --references--> `CartItem`  [EXTRACTED]
  src/components/CartFloatingBar.tsx → src/types/index.ts
- `HomePage()` --calls--> `AdminDashboard()`  [EXTRACTED]
  src/app/page.tsx → src/components/AdminDashboard.tsx

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.10
Nodes (20): eslintConfig, dependencies, next, react, react-dom, name, private, scripts (+12 more)

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 2 - "AdminDashboard.tsx"
Cohesion: 0.21
Nodes (12): AdminDashboard(), AdminDashboardProps, HeaderProps, ImageDropzone(), OrderSuccessModalProps, ProductCardProps, CATEGORIES, INITIAL_PRODUCTS (+4 more)

### Community 3 - "page.tsx"
Cohesion: 0.25
Nodes (12): HomePage(), CartDrawer(), CartFloatingBar(), CategoryFilter(), CategoryFilterProps, CheckoutModal(), Header(), OrderSuccessModal() (+4 more)

### Community 4 - "index.ts"
Cohesion: 0.38
Nodes (7): react, CartDrawerProps, CartFloatingBarProps, CheckoutModalProps, CartItem, CustomerDetails, OrderType

### Community 5 - "layout.tsx"
Cohesion: 0.29
Nodes (3): nextConfig, next, metadata

### Community 6 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, eslint, eslint-config-next, @types/node, @types/react, @types/react-dom, typescript

### Community 7 - "ImageDropzone.tsx"
Cohesion: 0.43
Nodes (5): ImageDropzoneProps, compressImage(), CompressionOptions, CompressionResult, formatBytes()

## Knowledge Gaps
- **5 isolated node(s):** `react-dom`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 46 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `index.ts` to `package.json`, `AdminDashboard.tsx`, `page.tsx`, `ImageDropzone.tsx`?**
  _High betweenness centrality (0.365) - this node is a cross-community bridge._
- **What connects `react-dom`, `@types/node`, `@types/react` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `next` connect `layout.tsx` to `package.json`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._