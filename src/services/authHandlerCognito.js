import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};
if (!poolData.UserPoolId || !poolData.ClientId) {
  console.error('[AUTH] Missing Cognito environment variables:', poolData);
}

const userPool = new CognitoUserPool(poolData);

// Temporary storage for tokens to log after navigation
let pendingTokens = null;

export const authHandlerCognito = {
  async register(email, password, attributes = {}) {
    const attributeList = Object.entries(attributes).map(([key, value]) =>
      new CognitoUserAttribute({ Name: key, Value: value })
    );
    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  async confirmSignUp(email, code) {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    return new Promise((resolve, reject) => {
      user.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  async login(email, password) {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    return new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().getJwtToken();
          const accessToken = result.getAccessToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();
          // Store tokens for logging after navigation
          pendingTokens = { idToken, accessToken, refreshToken };
          // Update lastlogin with Unix timestamp as string (seconds since epoch)
          const formattedDate = Math.floor(new Date().getTime() / 1000).toString();
          user.updateAttributes([
            new CognitoUserAttribute({ Name: 'custom:lastlogin', Value: formattedDate })
          ], (err) => {
            if (err) {
              console.error('[AUTH] Failed to update lastlogin:', err);
              // Proceed with login despite error
            }
            resolve({ idToken, accessToken, refreshToken });
          });
        },
        onFailure: reject
      });
    });
  },

  // Method to retrieve and clear pending tokens
  getPendingTokens() {
    const tokens = pendingTokens;
    pendingTokens = null; // Clear after retrieval
    return tokens;
  },

  logout() {
    const user = userPool.getCurrentUser();
    if (user) user.signOut();
    localStorage.clear();
    pendingTokens = null;
  },

  async changePassword(currentPassword, newPassword) {
    const user = userPool.getCurrentUser();
    if (!user) return Promise.reject('Not authenticated');
    return new Promise((resolve, reject) => {
      user.getSession((err) => {
        if (err) return reject(err);
        user.changePassword(currentPassword, newPassword, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    });
  },

  async forgotPassword(email) {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    return new Promise((resolve, reject) => {
      user.forgotPassword({ onSuccess: resolve, onFailure: reject });
    });
  },

  async confirmPassword(email, code, newPassword) {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    return new Promise((resolve, reject) => {
      user.confirmPassword(code, newPassword, {
        onSuccess: resolve,
        onFailure: reject,
      });
    });
  },

  // updateProfileAttributes(attributes) {
  //   const user = userPool.getCurrentUser();
  //   if (!user) return Promise.reject('Not authenticated');
  //   console.log("[COGNITO] Sending updateProfileAttributes:", attributes);
  //   return new Promise((resolve, reject) => {
  //     user.getSession((err, session) => {
  //       if (err || !session.isValid()) return reject(err || 'Invalid session');

  //       const attrList = Object.entries(attributes).map(
  //         ([key, value]) => new CognitoUserAttribute({ Name: key, Value: value })
  //       );

  //       user.updateAttributes(attrList, (err, result) => {
  //         if (err) return reject(err);
  //         resolve(result);
  //       });
  //     });
  //   });
  // },

  updateProfileAttributes(attributes) {
    const user = userPool.getCurrentUser();
    if (!user) return Promise.reject("Not authenticated");

    console.log("[COGNITO] Sending updateProfileAttributes:", attributes);

    return new Promise((resolve, reject) => {
      user.getSession((err, session) => {
        if (err || !session.isValid()) {
          console.error("[COGNITO] Invalid session during update:", err);
          return reject(err || "Invalid session");
        }

        const attrList = Object.entries(attributes).map(
          ([key, value]) => new CognitoUserAttribute({ Name: key, Value: value })
        );

        user.updateAttributes(attrList, (err, result) => {
          if (err) {
            console.error("[COGNITO] updateProfileAttributes error:", err);
            return reject(err);
          }
          console.log("[COGNITO] updateProfileAttributes response:", result);
          resolve(result);
        });
      });
    });
  },
  // async restoreSession() {
  //   const user = userPool.getCurrentUser();
  //   if (!user) {
  //     console.log('[AUTH] No current user found');
  //     return Promise.reject('No user');
  //   }

  //   return new Promise((resolve, reject) => {
  //     user.getSession((err, session) => {
  //       if (err || !session.isValid()) {
  //         console.log('[AUTH] Session invalid or error:', err);
  //         return reject(err || 'Invalid session');
  //       }

  //       const idToken = session.getIdToken().getJwtToken();
  //       const accessToken = session.getAccessToken().getJwtToken();
  //       const refreshToken = session.getRefreshToken().getToken();
  //       // Store tokens for logging after navigation
  //       pendingTokens = { idToken, accessToken, refreshToken };
  //       console.log('[AUTH] Session restored successfully');
  //       resolve({ idToken, accessToken, refreshToken });
  //     });
  //   });
  // }

  async restoreSession() {
    const user = userPool.getCurrentUser();
    if (!user) {
      console.log("[AUTH] No current user found");
      return Promise.reject("No user");
    }

    return new Promise((resolve, reject) => {
      user.getSession((err, session) => {
        if (err || !session.isValid()) {
          console.log("[AUTH] Session invalid or error:", err);
          return reject(err || "Invalid session");
        }

        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        pendingTokens = { idToken, accessToken, refreshToken };

        console.log("[AUTH] Session restored successfully");
        console.log("[AUTH] Restored tokens (truncated):", {
          idToken: idToken?.substring(0, 20) + "...",
          accessToken: accessToken?.substring(0, 20) + "...",
          refreshToken: refreshToken?.substring(0, 10) + "...",
        });

        resolve({ idToken, accessToken, refreshToken });
      });
    });
  },
};