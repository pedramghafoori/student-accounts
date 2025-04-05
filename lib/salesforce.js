import jsforce from 'jsforce';

let tokens = {
  accessToken: null,
  refreshToken: null,
  instanceUrl: null
};

export function getOAuth2() {
  return new jsforce.OAuth2({
    loginUrl: process.env.SF_LOGIN_URL,
    clientId: process.env.SF_CLIENT_ID,
    clientSecret: process.env.SF_CLIENT_SECRET,
    redirectUri: process.env.SF_OAUTH_CALLBACK
  });
}

export function storeTokens({ accessToken, refreshToken, instanceUrl }) {
  // Partial assignment if you prefer that style:
  tokens.accessToken = accessToken;
  tokens.refreshToken = refreshToken;
  tokens.instanceUrl = instanceUrl;
  console.log('storeTokens called with:', { accessToken, refreshToken, instanceUrl });
  if (accessToken && refreshToken && instanceUrl) {
    console.log("Salesforce tokens are now set:", { accessToken, refreshToken, instanceUrl });
  } else {
    console.warn("One or more Salesforce tokens are null:", { accessToken, refreshToken, instanceUrl });
  }
}

// NEW: let other modules retrieve the tokens directly
export function getStoredTokens() {
  return tokens;
}

export function getSalesforceConnection() {
  const conn = new jsforce.Connection({
    oauth2: getOAuth2(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    instanceUrl: tokens.instanceUrl
  });
  conn.on('refresh', (accessToken, res) => {
    tokens.accessToken = accessToken;
    console.log('Access token refreshed:', accessToken);
  });
  return conn;
}

export const getSystemTokens = getStoredTokens;