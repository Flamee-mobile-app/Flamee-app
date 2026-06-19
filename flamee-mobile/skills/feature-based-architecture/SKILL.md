---
name: feature-based-architecture
description: "Use when: reviewing code structure, implementing new features, understanding architecture, discussing file organization, or enforcing project layout conventions. Explains the feature-based architecture pattern used in this project."
---

# Feature-Based Architecture Guide

## Architecture Overview

The project uses **Feature-Based Architecture** to organize code by business domain rather than technical layers. Each feature is an independent domain with complete components, services, and logic.

```
src/
├── app/              # Routing and main layout
├── features/         # Main business features
├── shared/           # Reusable components, hooks, utils
├── services/         # API clients, storage, query managers
├── stores/           # Global state management
└── theme/            # Colors, spacing, typography, styling
```

---

## 📂 Folder Details

### `app/`

**Purpose:** Routing and main application layout

**Content:**

- `_layout.tsx` - Root layout
- `modal.tsx` - Modal provider/wrapper
- `(tabs)/` - Tab-based routing structure
  - `_layout.tsx` - Tab layout
  - `home.tsx` - Home tab screen
  - `profile.tsx` - Profile tab screen

**Rules:**

- Contains only routing logic, no business logic
- Layout files define navigation structure
- All business logic belongs to `features/`

---

### `features/`

**Purpose:** Main application features and business logic

**Structure of each feature:**

```
features/
└── auth/
    ├── components/     # UI components specific to this feature
    ├── hooks/          # Custom hooks specific to this feature
    ├── services/       # Business logic, API calls
    ├── schemas/        # Zod/validation schemas
    ├── store/          # Feature-level state (Zustand)
    ├── types.ts        # TypeScript types
    └── index.ts        # Public exports
```

**Example features:**

- `auth/` - Authentication & Authorization
- `product/` - Product management
- `orders/` - Order management
- `profile/` - User profile
- `settings/` - App settings

**Rules:**

- Each feature is a self-contained module
- Feature can import from `shared/` and `services/`
- Do not import from other features (if needed, move to `shared/`)
- Export public API via `index.ts`

---

### `shared/`

**Purpose:** Reusable components, hooks, and utilities

**Structure:**

```
shared/
├── components/       # Shared UI components (Button, Input, Card, etc.)
├── hooks/           # Shared custom hooks (useAsync, useDebounce, etc.)
└── utils/           # Utility functions (formatters, helpers, etc.)
```

**Examples:**

- `components/Button.tsx`
- `components/Input.tsx`
- `components/Modal.tsx`
- `hooks/useAsync.ts`
- `hooks/useDebounce.ts`
- `utils/formatters.ts`
- `utils/validators.ts`

**Rules:**

- Not dependent on specific features
- Can be reused across multiple features
- Does not contain business logic

---

### `services/`

**Purpose:** API clients, storage engines, query managers

**Structure:**

```
services/
├── api/
│   ├── axiosClient.ts      # Axios instance + interceptors
│   ├── queryClient.ts      # React Query client
│   └── endpoints.ts        # API endpoints definitions
├── storage/
│   ├── asyncStorage.ts     # Async storage (local/SQLite)
│   └── secureStorage.ts    # Secure token storage
└── focusManager.ts         # App focus management
```

**Content:**

- **API Clients:** Axios/Fetch setup, interceptors, base URLs
- **Query Manager:** React Query/TanStack Query configuration
- **Storage:** AsyncStorage, SecureStore setup
- **Focus Manager:** App state tracking

**Rules:**

- Does not contain business logic
- Is an abstraction layer for external services
- Imported by features

---

### `stores/`

**Purpose:** Global state management

**Structure:**

```
stores/
├── app.store.ts        # App-wide state (theme, language, user)
├── ui.store.ts         # UI state (modals, notifications, sidebar)
└── notification.store.ts # Notification queue
```

**Use:** Zustand

**Rules:**

- Only truly **global** state used across multiple features
- Feature-specific state in `features/[name]/store/`
- Each store is a separate file
- Export actions + selectors clearly

**Example:**

```typescript
// stores/app.store.ts
import { create } from "zustand";

interface AppState {
  theme: "light" | "dark";
  language: string;
  setTheme: (theme: "light" | "dark") => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  language: "en",
  setTheme: (theme) => set({ theme }),
}));
```

---

### `services/api/`

**Purpose:** API communication setup

**Content:**

```typescript
// services/api/axiosClient.ts
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

// Interceptors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors
  },
);
```

---

### `services/storage/`

**Purpose:** Storage solutions (local, secure)

**Content:**

```typescript
// services/storage/asyncStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const storageService = {
  setItem: (key: string, value: any) =>
    AsyncStorage.setItem(key, JSON.stringify(value)),
  getItem: (key: string) => AsyncStorage.getItem(key),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

// services/storage/secureStorage.ts
import * as SecureStore from "expo-secure-store";

export const secureStorageService = {
  setToken: (token: string) => SecureStore.setItemAsync("auth_token", token),
  getToken: () => SecureStore.getItemAsync("auth_token"),
};
```

---

### `theme/`

**Purpose:** Design tokens, colors, spacing, typography

**Structure:**

```
theme/
├── colors.ts         # Color palette
├── spacing.ts        # Margin, padding scale
├── typography.ts     # Font sizes, families
└── shadows.ts        # Shadow definitions
```

**Examples:**

```typescript
// theme/colors.ts
export const colors = {
  primary: "#007AFF",
  secondary: "#5AC8FA",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  background: "#F2F2F7",
  text: "#000000",
};

// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// theme/typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: "bold" },
  h2: { fontSize: 24, fontWeight: "bold" },
  body: { fontSize: 16, fontWeight: "400" },
};
```

---

## 🔄 Import Rules

### ✅ Allowed

```typescript
// features/product/components/ProductCard.tsx
import { Button } from "@/shared/components"; // ✅ Import from shared
import { axiosClient } from "@/services/api"; // ✅ Import from services
import { useAppStore } from "@/stores/app.store"; // ✅ Import from global stores
import { colors } from "@/theme/colors"; // ✅ Import from theme
```

### ❌ Not Allowed

```typescript
// features/auth/services/authService.ts
import { Button } from "@/features/product/components"; // ❌ Features should not import from other features
import { productStore } from "@/features/product/store"; // ❌ Features should not import from other feature stores
```

---

## 📋 General Rules

| Rule                  | Details                                                      |
| --------------------- | ------------------------------------------------------------ |
| **Feature Isolation** | Each feature is independent, not dependent on other features |
| **Shared Reuse**      | Shared code goes to `shared/`, no duplication                |
| **Public API**        | Export public interface via `index.ts`                       |
| **No Cross-Feature**  | Features should not import from other features               |
| **Business Logic**    | Only in `features/` and `services/`                          |
| **Global State**      | Only use `stores/` for truly global state                    |
| **Theme Tokens**      | All styling values go in `theme/`                            |

---

## 🎯 Benefits

✨ **Scalability** - Easy to add new features  
🔒 **Modularity** - Each feature is independent  
🔍 **Maintainability** - Easy to find related code  
♻️ **Reusability** - Shared code in one place  
🧪 **Testability** - Easy to test each feature  
👥 **Team Collaboration** - Clear ownership per feature

---

## 📝 New Feature Checklist

- [ ] Create folder `features/[featureName]/`
- [ ] Create subdirectories: `components/`, `hooks/`, `services/`, `schemas/`, `store/`
- [ ] Create `types.ts` for types/interfaces
- [ ] Create `index.ts` to export public API
- [ ] Implement components in `components/`
- [ ] Implement services (if needed) in `services/`
- [ ] Do not import from other features
- [ ] Export via `index.ts`

---

## 🔗 Related Documentation

- **State Management:** Zustand docs
- **API Client:** Axios + React Query
- **Storage:** AsyncStorage + Expo SecureStore
- **Styling:** NativeWind / React Native StyleSheet
