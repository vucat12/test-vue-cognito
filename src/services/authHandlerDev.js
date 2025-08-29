// TODO: open this import { signJwtHS256 } from '@/dev/jwtDev'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Development Authentication Handler
 * 
 * Bypasses AWS Cognito for local development while maintaining compatibility:
 * - Uses existing login/signup API endpoints and database
 * - Mints fake JWTs that mimic Cognito token structure
 * - Ensures guards, routes, and auth store behave consistently
 * - Provides same interface as production Cognito handler
 */

let pendingTokens = null;

const Credential = {
  idToken: "eyJraWQiOiJLOHY5XC9jdFFoem9Vb0pkMHB4RmVDWll4SjBRdyt1YVFmNVM4Q0I5RnJTbz0iLCJhbGciOiJSUzI1NiJ9.eyJjdXN0b206a3ljIjoidHJ1ZSIsInN1YiI6Ijk3YzQ1YWM4LTcwZTEtNzA5My0yYTEzLWM0OTI0NThiNDg2YyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTFfSWtXME9DV05vIiwiY29nbml0bzp1c2VybmFtZSI6IjE4NTIwNTE1QGdtLnVpdC5lZHUudm4iLCJvcmlnaW5fanRpIjoiMzIzNGE5ODUtM2I4YS00ZDAxLThiMzQtNjQ3MWM4ZjcxZjllIiwiYXVkIjoiNmRub2JnaTNlazBxYmJjcDg5cWtoYm9iNm8iLCJldmVudF9pZCI6Ijc1ZDZkYWU4LWNjNGQtNGVhOC1hMWJkLWM2YjBiOThmNTU1NSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzU2MzkyMTYzLCJuYW1lIjoiMTg1MjA1MTUiLCJjdXN0b206bGFzdGxvZ2luIjoiMTc1NjM5MTkyOCIsImV4cCI6MTc1NjM5NTc2MywiY3VzdG9tOnJvbGUiOiJjcmVhdG9yIiwiaWF0IjoxNzU2MzkyMTYzLCJqdGkiOiJiMzFjYzc1Yi1hM2UxLTQ1NjAtYjA2NS1iOTliZmFmZGQwYzUiLCJlbWFpbCI6IjE4NTIwNTE1QGdtLnVpdC5lZHUudm4ifQ.eGRxlaGKfJvaIPJtGxZZnoFQwSb5QZb8x75GnXQoi1TbRlbKDobt8FCcVcBE7OkwDR6suRmW1UQP9S3ZqL-b1DpXMSmYe9Hpv5GrPWnpoUiBdJypDoqNyM55cwxgdmQfIUKJDjh9S0f8s2Bf2Zqt12Do9LFlZlqB6Absf7t0MZyUF9RFBiJyf6QuLuuisrFj75Lm4XdydZO2hmB-Aw86Pzj90gq4ZojldDDuEXm1nIEGO8K79yFWczgChZvxeLOOg5yPd7BRPKcPHkoJiqsqXmpQD_u-PjBirDRdzLIRIK0OuVRhCRkUph509y775pDCerWeGADk-tM9UYzH_WR0JA",
  refreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.SGslq2_s0csRWCkYMHEkBnwLEIH5EULR6IdFChxXPTO181SUan7R--aVG5GXjNDY5-jCAL53jMz8OHxfSA4ftWO9x1p16erj-cZ9B6Xsy6EsV1Om2wvVUt9W0FtKq1hm9KQ98hW58m5J-guSiuttgZL10QOOdkcbyRslz8AxUsF5i07OGyD7QAsV6By91k6mLeYRW10iBhWIW61abr7K_MjmQBON3V5FDlxgfgaqADJxt6eZs_UbHIDRus-f0oFrJf8iLSVXrsFKs5_zrM-78ARKjP8aGdLUCgaH4r8FRPASGTa8DwaPsVbuo28i68oIU8-AWk8tyc_qjtNvb1iU1A.y8mwI5DsCL7iW7tR.8T7qQIBE4ugEvu03lHohA9iTSshPRrT_SxUkW_Qee9QiJdFeFFlwIBiJFZoodUlDil8A5-xWw30xojr0izxH4E-tatko2ImNU0_8faWKf2P40upfeFZmbabN4df_gtel4gb2dtWIvl3QvS5qqKplKyzMIACBEI7N_VfrCW8Qn7KhD_CRneICoVLZYN60Rtya8-rEdDrrl4UJ3bKSVdHioIMml2DDT39eBfiv3hRFQGx9LvvmLFTMvb5MpG1bKaivkw9ImFWks_dk1GF2m2MikmzPS9iadGDUvZrpqDrveVinJjK2LmQLIVizS94EkF1zqhb_epd3zdsWHwq8zz21suy1qgwC_v8SUufylseG2WLAS8iRpVOzhBQ-wBYEJTxeaZ0cxAZGnaIKU1EOr1l6WQu0LYnI0VpHaDDXPR83g_05ypK6MXZyLLFdgJ-D_kuCVSqYS6lnk7qn6a2Ns3PByx_pJ4JXuNCsw5VAKA_2Qciw1sHjUiMHvfHWtRbw6FzfN97LSDPxneAZNhWUtcS30KxKIJimWXwo1vc2CW4YKOvbQbsFhdZZS26Jls3TV7jm0aszYxNyPKlnVTije39-N_yCMzBK49O-V59mCphzywAZq9hc0ZzoQetjikEHS3p_6lrei59bClEPXZbfKyt81SWox85-Mw7NQbkboqJqVsS4_HI3HIvhfr025QC2QKb1vDndan_t0MmV336zlPSnXRyRrjWK-M0r1iSjpr3soh0y6Am7uWBgQQ9BUkfDWPBkYOxH6-Dyww0YvgukTZk-OX0q4lNC0Wf0furX0fegYe9ljeTzdY_J-gtObS0UeGn7bC3ujz_Jrf9kTxvULLpTRcPJ7i8b3WgSenBKH9jzGxeXMzc1cLbJJi98cSi2yX0SO51UxhJS3qcgLzv0PQ028R1dbRhbuMVOwhso0Bxq4A3h_sNwU-PdCR8Jpf_sr0YixwycXT89A0tKKeoCP4nsrJikVVlGNqoUfo2QOyQ34imGmlbJKBFrCDRkQDfX81YIC92Rv-pYccrbWrP83HYluk3gst5AagcaWGjubwonewwXIf_qmcNhmoqPWqpi3hrnHh4WXsgAKGIiUCXys7ogcd6_0zUjssZwkAPGcQYT0-jM-dmw64Nk8QkORHp4J3LJvmCu4dmhtO5mTIgMXn0WiarJFj4-_-O1mj6-Biqt6nOBVlYWW_bmAkjctKXNqdSSkDt_AZSWJAKVbr_m-fHrA5ATRUfUUuGp0-kV4HKbeDwmvaaV_9B3hWD9gqz65BgoCPqSpk6XLZ9LptjjBHlxXC202-ODvsS9OxVz833x0c2umiFEiV7M.hlZnmGULZwW-12Pqd0y3tQ",
  accessToken: "eyJraWQiOiJTZnlFXC9PNnErWEFkOUFTNkJ5eFQzUVp1TUxHYXlCQlVjeCtXOEoyQVZoOD0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI5N2M0NWFjOC03MGUxLTcwOTMtMmExMy1jNDkyNDU4YjQ4NmMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtbm9ydGhlYXN0LTFfSWtXME9DV05vIiwiY2xpZW50X2lkIjoiNmRub2JnaTNlazBxYmJjcDg5cWtoYm9iNm8iLCJvcmlnaW5fanRpIjoiMzIzNGE5ODUtM2I4YS00ZDAxLThiMzQtNjQ3MWM4ZjcxZjllIiwiZXZlbnRfaWQiOiI3NWQ2ZGFlOC1jYzRkLTRlYTgtYTFiZC1jNmIwYjk4ZjU1NTUiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNzU2MzkyMTYzLCJleHAiOjE3NTYzOTU3NjMsImlhdCI6MTc1NjM5MjE2MywianRpIjoiOTkxODEyNzktNjAwMi00YjY2LTk0ZjItM2FlZmI5ZjM3ZTExIiwidXNlcm5hbWUiOiIxODUyMDUxNUBnbS51aXQuZWR1LnZuIn0.x6pi4gxYSnhgeTHVqEigolnzvg_NxhvbqW6gEvVqXSmtmVhCs1781-qz29ZBntgxCPXAGp7HAKg2u73D0_WsmZXjEgYEyy_7jwxhLqWzIIZFcSVVZAQjYgYZucPY6I_naE63m4ViIOIBDiEy4bm2uXVBSGaXqSFNW0hYoYw2E3sLxaqQGd0D2guNzB-eAigmJpMJPOscIPRJNEBJvWs_L4tPBl5gW_VztmhW1vMvz4qMpQL8oSuO7Ga2NAIxfR4mxKqoh8rCPlck-07FicY1KWSAD0jM5l670hqi4q7SUk2svELAvxKW5HFhmQJzFSashZtvKEv-Amuf36DDtzM0RA"
}

const User = {
  "email": "18520515@gm.uit.edu.vn",
  "role": "creator",
  "kycPassed": true,
  "onboardingPassed": false,
  "raw": {
    "custom:kyc": "true",
    "sub": "97c45ac8-70e1-7093-2a13-c492458b486c",
    "email_verified": true,
    "iss": "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_IkW0OCWNo",
    "cognito:username": "18520515@gm.uit.edu.vn",
    "origin_jti": "3234a985-3b8a-4d01-8b34-6471c8f71f9e",
    "aud": "6dnobgi3ek0qbbcp89qkhbob6o",
    "event_id": "75d6dae8-cc4d-4ea8-a1bd-c6b0b98f5555",
    "token_use": "id",
    "auth_time": Math.floor(Date.now() / 1000) + 1000,
    "name": "18520515",
    "custom:lastlogin": "1756391928",
    "exp": Math.floor(Date.now() / 1000) + 1000,
    "custom:role": "creator",
    "iat": Math.floor(Date.now() / 1000) + 1000,
    "jti": "b31cc75b-a3e1-4560-b065-b99bfafdd0c5",
    "email": "18520515@gm.uit.edu.vn"
  }
}

export const authHandlerDev = {
  signJwtHS256: (payload, options = {}) => {
    const header = {
      alg: options.alg || 'HS256',
      typ: 'JWT'
    }

    const base64UrlEncode = (obj) => {
      return btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }

    const encodedHeader = base64UrlEncode(header)
    const encodedPayload = base64UrlEncode(payload)
    const signature = 'fake-signature-for-dev-only'

    return `${encodedHeader}.${encodedPayload}.${signature}`
  },

  async login({ email, password }) {
    try {
      // Hit existing login API (same as production, but dev endpoint)
      // const res = await fetch('/api/dev-login', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password }),
      //   headers: { 'Content-Type': 'application/json' }
      // })

      // if (!res.ok) throw new Error('Login failed')

      // For dev: use mock credentials and user data
      let res = Credential
      const { idToken: tempIdToken, accessToken, refreshToken } = res;

      // Store tokens for session restoration
      pendingTokens = { tempIdToken, accessToken, refreshToken };

      // Hydrate auth store using the existing API
      const auth = useAuthStore()

      // Update onboarding status locally
      const user = User
      auth.updateUserAttributesLocally({
        onboardingPassed: user.onboardingPassed
      })

      const idToken = this.signJwtHS256({
        sub: user.raw.sub,                      // Cognito user ID
        email: user.email,                      // Email claim
        'cognito:username': user.email,         // Cognito username
        'custom:role': user.role,               // User role
        'custom:kyc': user.kycPassed.toString(), // KYC status
        'custom:onboardingPassed': user.onboardingPassed.toString(),
        aud: user.raw.aud,                      // Audience
        iss: user.raw.iss,                      // Issuer (mimic Cognito)
        token_use: 'id',                        // Cognito token type
        name: user.raw.name,                    // User name
        email_verified: user.raw.email_verified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
        jti: user.raw.jti,                      // JWT ID
        auth_time: user.raw.auth_time,          // Auth time
        event_id: user.raw.event_id,            // Event ID
        origin_jti: user.raw.origin_jti         // Origin JWT ID
      }, { alg: 'HS256' })

      auth.setTokenAndDecode(idToken)

      // Store token in localStorage for persistence (like production)
      localStorage.setItem('idToken', idToken)

      console.log('[AUTH-DEV] Login successful, bypassing Cognito:', user.email)
      return { idToken, accessToken, refreshToken }
    } catch (error) {
      console.error('[AUTH-DEV] Login error:', error)
      throw error
    }
  },

  async signup(data) {
    try {
      // Hit existing signup API (same as production, but dev endpoint)
      const res = await fetch('/api/dev-signup', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Signup failed')
      }

      console.log('[AUTH-DEV] Signup successful, bypassing Cognito')
      return res.json()
    } catch (error) {
      console.error('[AUTH-DEV] Signup error:', error)
      throw error
    }
  },

  async handleCallback() {
    try {
      // In production: handles Cognito OAuth callback with authorization code
      // In dev: simulate OAuth callback flow for testing

      // Check if we have pending tokens from a simulated OAuth flow
      if (pendingTokens) {
        const { idToken, accessToken, refreshToken } = pendingTokens;

        // Use the mock user data to complete the callback
        const user = User;

        // Hydrate auth store (same as production callback flow)
        console.log('[AUTH-DEV] OAuth callback completed (bypassing Cognito):', user.email);
        return { idToken, accessToken, refreshToken };
      }

      // If no pending tokens, simulate a successful callback anyway
      console.log('[AUTH-DEV] OAuth callback handled without tokens (simulation mode)');
      return true;
    } catch (error) {
      console.error('[AUTH-DEV] Callback error:', error);
      throw error;
    }
  },

  async restoreSession() {
    try {

      console.log("Restoring session...");

      // In production: validates Cognito tokens from localStorage
      // In dev: restore session from persisted Pinia store or mock tokens
      const auth = useAuthStore()

      // First try to restore from localStorage (like production)
      auth.refreshFromStorage()

      console.log("auth.idToken", auth.idToken);

      // Check if we have a valid session after refresh
      if (auth.currentUser && auth.idToken) {
        console.log('[AUTH-DEV] Session restored from localStorage (bypassing Cognito)')
        return { idToken: auth.idToken }
      }

      // Check if we have pending tokens from recent login
      if (pendingTokens) {
        console.log('[AUTH-DEV] Restoring session from pending tokens')

        // Use the stored token to restore session
        auth.setTokenAndDecode(pendingTokens.idToken)
        localStorage.setItem('idToken', pendingTokens.idToken)

        // Update onboarding status
        const user = User
        auth.updateUserAttributesLocally({
          onboardingPassed: user.onboardingPassed
        })

        console.log('[AUTH-DEV] Session successfully restored for:', user.email)
        return { idToken: pendingTokens.idToken }
      }

      console.log('[AUTH-DEV] No session to restore')
      return false
    } catch (error) {
      console.error('[AUTH-DEV] Error restoring session:', error)
      return false
    }
  },

  async logout() {
    try {
      const auth = useAuthStore()

      // In production: would call Cognito logout + invalidate tokens
      // In dev: just clear local state (optionally call logout API)

      // Optional: Call dev logout API to maintain consistency with backend
      // await fetch('/api/dev-logout', { 
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })

      // Clear localStorage and auth store using existing method
      localStorage.clear()
      auth.$reset()

      // Clear pending tokens
      pendingTokens = null

      console.log('[AUTH-DEV] Logout successful (bypassing Cognito)')
      return true
    } catch (error) {
      console.error('[AUTH-DEV] Logout error:', error)
      throw error
    }
  },

  // Development utility methods (not available in production)
  async refreshToken() {
    try {
      const auth = useAuthStore()

      // In production: would refresh Cognito tokens using refresh token
      // In dev: simulate token refresh with mock tokens

      if (!auth.currentUser || !pendingTokens) {
        console.log('[AUTH-DEV] No active session to refresh')
        return false
      }

      // Simulate network delay for realistic testing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Generate new mock tokens with updated timestamps
      const now = Math.floor(Date.now() / 1000)
      const newTokens = {
        idToken: pendingTokens.idToken, // In real implementation, would generate new token
        accessToken: pendingTokens.accessToken, // In real implementation, would generate new token  
        refreshToken: pendingTokens.refreshToken // Refresh token typically stays the same
      }

      // Update pending tokens
      pendingTokens = newTokens

      // Refresh the token in the store and localStorage
      auth.setTokenAndDecode(newTokens.idToken)
      localStorage.setItem('idToken', newTokens.idToken)

      console.log('[AUTH-DEV] Token refresh successful (simulated):', User.email)
      return newTokens
    } catch (error) {
      console.error('[AUTH-DEV] Token refresh error:', error)

      // On refresh failure, clear auth state
      localStorage.clear()
      const auth = useAuthStore()
      auth.$reset()
      pendingTokens = null

      return false
    }
  },

  async updateProfileAttributes(attributes) {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      console.warn('[AUTH-DEV] No user is currently logged in')
      return false
    }

    // Simulate a network request to update user attributes
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update the user attributes in the store
    auth.updateUserAttributesLocally(attributes)
    console.log('[AUTH-DEV] User attributes updated:', attributes)
    return true
  },

  async getCurrentUser() {
    const auth = useAuthStore()
    return auth.currentUser
  },

  // Mock method to simulate different user roles for testing
  async mockUserRole(role) {
    const auth = useAuthStore()
    if (auth.currentUser) {
      auth.simulate = { role }
      console.log(`[AUTH-DEV] Simulating user role: ${role} (for testing)`)
    }
  },

  // Simulate Cognito token validation (always returns true in dev)
  async validateToken(token) {
    console.log('[AUTH-DEV] Token validation bypassed (would validate with Cognito)')
    return true
  }
}
