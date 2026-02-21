"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG, BACKEND_URLS } from "@/lib/system-config";
import { api, setApiAuthToken } from "@/lib/api";
import {
  initializeGlobalPayment,
  checkIncompletePayments,
} from "@/lib/pi-payment";

export type LoginDTO = {
  id: string;
  username: string;
  credits_balance: number;
  terms_accepted: boolean;
  app_id: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price_in_pi: number;
  total_quantity: number;
  is_active: boolean;
  created_at: string;
};

export type ProductList = {
  products: Product[];
};

const COMMUNICATION_REQUEST_TYPE = '@pi:app:sdk:communication_information_request';
const DEFAULT_ERROR_MESSAGE = 'Failed to authenticate or login. Please refresh and try again.';

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (error) {
    // Cross-origin access may throw when in an iframe
    if (
      error instanceof DOMException &&
      (error.name === 'SecurityError' || error.code === DOMException.SECURITY_ERR || error.code === 18)
    ) {
      return true;
    }
    // Firefox may throw generic Permission denied errors
    if (error instanceof Error && /Permission denied/i.test(error.message)) {
      return true;
    }

    throw error;
  }
}

function parseJsonSafely(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  return typeof value === 'object' && value !== null ? value : null;
}

interface PiAuthContextType {
  isAuthenticated: boolean;
  authMessage: string;
  hasError: boolean;
  piAccessToken: string | null;
  userData: LoginDTO | null;
  error: string | null;
  reinitialize: () => Promise<void>;
  appId: string | null;
  products: Product[] | null;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

const loadPiSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    if (!PI_NETWORK_CONFIG.SDK_URL) {
      throw new Error("SDK URL is not set");
    }
    script.src = PI_NETWORK_CONFIG.SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log("✅ Pi SDK script loaded successfully");
      resolve();
    };

    script.onerror = () => {
      console.error("❌ Failed to load Pi SDK script");
      reject(new Error("Failed to load Pi SDK script"));
    };

    document.head.appendChild(script);
  });
};

/**
 * Waits for window.Pi to be available (for up to 5 seconds)
 * The Pi Browser loads the SDK asynchronously, so we need to wait for it
 * 
 * @returns {Promise<boolean>} Returns true if Pi SDK became available, false if timeout
 */
function waitForPiSDK(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if already available
    if (typeof window.Pi !== "undefined") {
      console.log("✅ Pi SDK already available");
      resolve(true);
      return;
    }

    // Check every 100ms for up to 5 seconds
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 seconds

    const timer = setInterval(() => {
      attempts++;
      
      if (typeof window.Pi !== "undefined") {
        console.log(`✅ Pi SDK detected after ${attempts * 100}ms`);
        clearInterval(timer);
        resolve(true);
        return;
      }

      if (attempts >= maxAttempts) {
        console.log("⏱️ Pi SDK not available after 5 seconds");
        clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Requests authentication credentials from the parent window (App Studio) via postMessage.
 * Returns null if not in iframe, timeout, or missing token (non-fatal check).
 *
 * @returns {Promise<{accessToken: string, appId: string}|null>} Resolves with credentials or null
 */
function requestParentCredentials(): Promise<{ accessToken: string; appId: string | null } | null> {
  // Early return if not in an iframe
  if (!isInIframe()) {
    return Promise.resolve(null);
  }

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const timeoutMs = 1500;

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Cleanup function to remove listener and clear timeout
    const cleanup = (listener: (event: MessageEvent) => void) => {
      window.removeEventListener('message', listener);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };

    const messageListener = (event: MessageEvent) => {
      // Security: only accept messages from parent window
      if (event.source !== window.parent) {
        return;
      }

      // Validate message type and request ID match
      const data = parseJsonSafely(event.data);
      if (!data || data.type !== COMMUNICATION_REQUEST_TYPE || data.id !== requestId) {
        return;
      }

      cleanup(messageListener);

      // Extract credentials from response payload
      const payload = typeof data.payload === 'object' && data.payload !== null ? data.payload : {};
      const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : null;
      const appId = typeof payload.appId === 'string' ? payload.appId : null;

      // Return credentials or null if missing token
      resolve(accessToken ? { accessToken, appId } : null);
    };

    // Set timeout handler (resolve with null on timeout)
    timeoutId = setTimeout(() => {
      cleanup(messageListener);
      resolve(null);
    }, timeoutMs);

    // Register listener before sending request to avoid race condition
    window.addEventListener('message', messageListener);

    // Send request to parent window to get credentials
    window.parent.postMessage(
      JSON.stringify({
        type: COMMUNICATION_REQUEST_TYPE,
        id: requestId
      }),
      '*'
    );
  });
}

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Initializing Pi Network...");
  const [hasError, setHasError] = useState(false);
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  const fetchProducts = async (currentAppId: string): Promise<void> => {
    try {
      const { data } = await api.get<ProductList>(
        BACKEND_URLS.GET_PRODUCTS(currentAppId)
      );
      setProducts(data?.products ?? []);
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  };

  const loginToBackend = async (accessToken: string, appId: string | null): Promise<LoginDTO> => {
    console.log("🔐 Verifying Pi Network user with official API...");
    
    const response = await fetch(BACKEND_URLS.LOGIN, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Pi-App-Id': process.env.NEXT_PUBLIC_PI_APP_ID || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Pi Network verification failed:", response.status, errorData);
      throw new Error(`Failed to verify Pi Network user (${response.status})`);
    }

    const piUser = await response.json();
    console.log("✅ Pi Network user verified:", piUser.username);

    return {
      id: piUser.uid,
      username: piUser.username,
      credits_balance: 0,
      terms_accepted: true,
      app_id: appId || '',
    };
  };

  const authenticateAndLogin = async (accessToken: string, appId: string | null): Promise<void> => {
    setAuthMessage("Logging in...");

    const userData = await loginToBackend(accessToken, appId);

    setPiAccessToken(accessToken);
    setApiAuthToken(accessToken);
    setUserData(userData);
    setAppId(userData.app_id);
  };

  const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error))
      return "An unexpected error occurred. Please try again.";

    const errorMessage = error.message;

    if (errorMessage.includes("SDK failed to load"))
      return "Failed to load Pi Network SDK. Please check your internet connection.";

    if (errorMessage.includes("authenticate"))
      return "Pi Network authentication failed. Please try again.";

    if (errorMessage.includes("login"))
      return "Failed to connect to backend server. Please try again later.";

    return `Authentication error: ${errorMessage}`;
  };

  const authenticateViaPiSdk = async (): Promise<void> => {
    try {
      setAuthMessage("Initializing Pi Network SDK...");
      console.log("📍 Initializing Pi SDK with config:", PI_NETWORK_CONFIG);
      
      await window.Pi.init({
        version: "2.0",
        sandbox: PI_NETWORK_CONFIG.SANDBOX,
      });
      console.log("✅ Pi SDK initialized successfully");

      setAuthMessage("Authenticating with Pi Network...");
      const scopes = ["username", "payments"];
      console.log("🔑 Requesting authentication with scopes:", scopes);
      
      const piAuthResult = await window.Pi.authenticate(
        scopes,
        async (payment) => {
          console.log("💳 Payment received during auth:", payment);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await checkIncompletePayments(payment);
        }
      );

      console.log("📦 Authentication result:", {
        hasAccessToken: !!piAuthResult.accessToken,
        username: piAuthResult.user?.username,
      });

      if (!piAuthResult.accessToken) {
        throw new Error(DEFAULT_ERROR_MESSAGE);
      }

      await authenticateAndLogin(piAuthResult.accessToken, null);
    } catch (err) {
      console.error("❌ Pi SDK authentication error:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      throw err;
    }
  };

  const initializePiAndAuthenticate = async () => {
    setError(null);
    setHasError(false);

    try {
      // Probe for parent credentials (App Studio iframe environment)
      const parentCredentials = await requestParentCredentials();
      console.log("📋 Parent credentials available:", !!parentCredentials);

      // If parent (App Studio) provides credentials, use iframe flow
      if (parentCredentials) {
        console.log("✅ Using parent credentials from App Studio");
        await authenticateAndLogin(parentCredentials.accessToken, parentCredentials.appId);
      } else {
        // Wait for Pi SDK to load (up to 5 seconds)
        console.log("⏳ Waiting for Pi SDK to load...");
        const piSdkAvailable = await waitForPiSDK();
        
        if (piSdkAvailable) {
          // Pi SDK is available - we're in Pi Browser
          console.log("🔄 Authenticating with Pi Network SDK...");
          console.log("📝 Waiting for user to complete Pi Browser authentication dialog...");
          console.log("⏱️ This may take 10-30 seconds, please wait...");
          setAuthMessage("Authenticating with Pi Network... (Please wait)");
          await authenticateViaPiSdk();
          console.log("✅ Pi Network authentication successful!");
        } else {
          // Pi SDK not available - not in Pi Browser
          console.log("⚠️ Pi SDK not available - using demo mode");
          setAuthMessage("Entering demo mode (Pi Browser not detected)...");
          
          // Create a mock user for testing
          const mockUser: LoginDTO = {
            id: "demo-user",
            username: "demo_user",
            credits_balance: 10,
            terms_accepted: true,
            app_id: "pipulse-demo",
          };
          
          setPiAccessToken("demo-token");
          setApiAuthToken("demo-token");
          setUserData(mockUser);
          setAppId(mockUser.app_id);
        }
      }

      setIsAuthenticated(true);
      setHasError(false);

      // Assigns payment function to window.pay
      initializeGlobalPayment();
    } catch (err) {
      console.error("❌ Pi Network initialization failed:", err);
      if (err instanceof Error) {
        console.error("Error details:", err.message, err.stack);
      }
      setHasError(true);
      const errorMessage = getErrorMessage(err);
      setAuthMessage(errorMessage);
      setError(errorMessage);
    }
  };

  useEffect(() => {
    initializePiAndAuthenticate();
  }, []);

  useEffect(() => {
    if (!appId) return;
    fetchProducts(appId);
  }, [appId]);

  const value: PiAuthContextType = {
    isAuthenticated,
    authMessage,
    hasError,
    piAccessToken,
    userData,
    error,
    reinitialize: initializePiAndAuthenticate,
    appId,
    products,
  };

  return (
    <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>
  );
}

/**
 * Hook to access Pi Network authentication state and user data
 *
 * Must be used within a component wrapped by PiAuthProvider.
 * Provides read-only access to authentication state and user data.
 *
 * @returns {PiAuthContextType} Authentication state and methods
 * @throws {Error} If used outside of PiAuthProvider
 *
 * @example
 * const { piAccessToken, userData, isAuthenticated, reinitialize } = usePiAuth();
 */
export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}
