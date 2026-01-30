# Test Plan & Implementation Status

## OAuth2 Implementation Status

The following OAuth2 providers are fully implemented in the backend (`passport.ts`, `routes/auth.ts`) and frontend (`OAuthButtons.tsx`):

- **Google**
- **GitHub**
- **GitLab**
- **Discord**
- **LinkedIn**

**Status:** ✅ Implemented & Aligned with Documentation.

## Missing Tests & Gaps

### 1. Backend: OAuth Integration Tests

**Current State:** `backend/src/test/auth.test.ts` only covers local email/password flows.
**Missing:**

- Tests for `handleOAuthLogin` logic (mocking the profile data).
- Verification of account linking (same email from different providers).
- Handling of missing email scenarios (e.g., private GitHub emails).
- JWT generation on successful OAuth callback.

### 2. Frontend: Authentication State

**Current State:** `AuthContext.tsx` handles tokens but lacks unit tests.
**Missing:**

- Tests for `AuthContext` processing the JWT from the URL query string after redirect.
- Tests for `OAuthButtons` rendering correct links.
- Tests for `Login` and `Register` form validation.

### 3. Feature Gap: Magic Link

**Current State:** `Login.tsx` has a "Send Magic Link" button that is purely cosmetic.
**Missing:**

- Backend route to generate and email magic links.
- Backend route to verify magic link tokens.
- Frontend logic to handle magic link clicks.
- **Action:** We should either implement this feature or remove the misleading UI.

## Recommended Action Items

1.  **Create OAuth Mock Tests:** Add unit tests for `handleOAuthLogin` in `backend/src/test/auth.test.ts` by mocking the Passport profile response.
2.  **Frontend Auth Tests:** Create `frontend/src/test/context/AuthContext.test.tsx` to verify token parsing and state updates.
3.  **Cleanup:** Remove the "Magic Link" UI from `Login.tsx` if it's not being implemented immediately, to avoid user confusion.
