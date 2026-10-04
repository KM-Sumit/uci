---
name: Expo authentication storage
description: Platform-specific token persistence for the UCI Expo app.
---

Use `expo-secure-store` for tokens on native iOS and Android. Its browser implementation may not support the same methods; the web preview must use a browser-session storage fallback and must not call SecureStore methods on web.

**Why:** On 2026-10-04, the web preview threw `deleteValueWithKeyAsync is not a function` during session restoration when the native storage API was invoked in the browser.

**How to apply:** Keep platform checks inside shared auth storage helpers so the API client's token getter, login, restore, and logout all use the same platform-aware functions.