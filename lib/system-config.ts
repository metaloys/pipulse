export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: true, // Enabled for sandbox testing with real Pi test users
} as const;

export const BACKEND_CONFIG = {
  BASE_URL: "https://api.minepi.com", // Production API with sandbox mode enabled
  BLOCKCHAIN_BASE_URL: "https://api.testnet.minepi.com", // Testnet blockchain
} as const;

export const BACKEND_URLS = {
  LOGIN: `${BACKEND_CONFIG.BASE_URL}/v2/me`,
  LOGIN_PREVIEW: `${BACKEND_CONFIG.BASE_URL}/v2/me`,
  GET_PRODUCTS: (appId: string) => ``,
  GET_PAYMENT: (paymentId: string) =>
    `${BACKEND_CONFIG.BASE_URL}/v2/payments/${paymentId}`,
  APPROVE_PAYMENT: (paymentId: string) =>
    `${BACKEND_CONFIG.BASE_URL}/v2/payments/${paymentId}/approve`,
  COMPLETE_PAYMENT: (paymentId: string) =>
    `${BACKEND_CONFIG.BASE_URL}/v2/payments/${paymentId}/complete`,
} as const;

export const PI_PLATFORM_URLS = {} as const;

export const PI_BLOCKCHAIN_URLS = {
  GET_TRANSACTION: (txid: string) =>
    `${BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/transactions/${txid}/effects`,
} as const;
