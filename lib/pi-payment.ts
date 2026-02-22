/**
 * Pi Network Payment Integration Module
 *
 * Provides a global payment system for Pi Network transactions with:
 * - Automatic payment approval and completion
 * - On-chain validation
 * - Reward processing
 * - Incomplete payment recovery
 */

import { api } from "@/lib/api";
import { BACKEND_URLS, PI_BLOCKCHAIN_URLS } from "@/lib/system-config";

// ============================================================================
// Type Definitions
// ============================================================================

export type PaymentMetadata = {
  [key: string]: any;
};

export type PaymentOptions = {
  amount: number;
  memo?: string;
  metadata: PaymentMetadata;
  onComplete?: (metadata: PaymentMetadata) => void;
  onError?: (error: Error, payment?: PiPayment) => void;
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: PaymentMetadata;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPayment) => void;
};

export type PiPayment = {
  identifier: string;
  amount: number;
  metadata: PaymentMetadata;
  transaction: {
    txid: string;
  };
};

export type BlockchainTransactionResponse = {
  _embedded: {
    records: Array<{ amount: string }>;
  };
};

// ============================================================================
// Global Window Declaration
// ============================================================================

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (
        scopes: string[],
        checkIncompletePayments: (payment: PiPayment) => Promise<void>
      ) => Promise<{
        accessToken: string;
        user: { uid: string; username: string };
      }>;
      createPayment: (
        paymentData: PiPaymentData,
        callbacks: PiPaymentCallbacks
      ) => void;
      getIncompletePayments: () => Promise<PiPayment[]>;
    };
    pay: (options: PaymentOptions) => Promise<void>;
  }
}

// ============================================================================
// Configuration
// ============================================================================

let rewardHandler: ((metadata: PaymentMetadata) => void) | null = null;

export const setPaymentRewardHandler = (
  handler: (metadata: PaymentMetadata) => void
): void => {
  rewardHandler = handler;
};

// ============================================================================
// Payment Validation
// ============================================================================

const checkPaymentValid = async (
  txid: string,
  expectedAmount: number
): Promise<boolean> => {
  try {
    const { data, status } = await api.get<string>(
      PI_BLOCKCHAIN_URLS.GET_TRANSACTION(txid)
    );
    const parsedData: BlockchainTransactionResponse =
      typeof data === "string" ? JSON.parse(data) : data;

    if (status !== 200) return false;

    const records = parsedData._embedded?.records;
    if (!records || records.length === 0) return false;

    const onchainAmount = parseFloat(records[0].amount);
    const isValid = onchainAmount >= expectedAmount;

    if (!isValid) {
      console.log("Payment validation failed:", {
        onchainAmount,
        expectedAmount,
      });
    }

    return isValid;
  } catch (error) {
    console.error("Failed to validate payment on blockchain:", error);
    return false;
  }
};

// ============================================================================
// Payment Completion
// ============================================================================

const completePaymentWithReward = async (
  payment: PiPayment,
  txidFromUser: string
): Promise<void> => {
  try {
    const isPaymentValid = await checkPaymentValid(
      txidFromUser,
      payment.amount
    );

    if (!isPaymentValid) {
      console.error("Payment validation failed: amount mismatch");
      return;
    }

    const { status } = await api.post(
      BACKEND_URLS.COMPLETE_PAYMENT(payment.identifier),
      { txid: payment.transaction.txid }
    );

    if (status === 200) {
      if (rewardHandler) {
        rewardHandler(payment.metadata);
      }
    }
  } catch (error) {
    console.error("Failed to complete payment:", error);
    throw error;
  }
};

// ============================================================================
// Payment Callbacks
// ============================================================================

const createPaymentCallbacks = (
  options: PaymentOptions
): PiPaymentCallbacks => {
  const onReadyForServerApproval = async (paymentId: string): Promise<void> => {
    try {
      console.log(`💳 Sending payment approval request to /api/payments/approve: ${paymentId}`);
      const response = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve payment');
      }

      console.log(`✅ Payment approved successfully: ${paymentId}`);
    } catch (error) {
      console.error("❌ Failed to approve payment:", error);
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error("Payment approval failed")
        );
      }
    }
  };

  const onReadyForServerCompletion = async (
    paymentId: string,
    txid: string
  ): Promise<void> => {
    try {
      console.log(`💳 Sending payment completion request to /api/payments/complete: ${paymentId}, txid: ${txid}`);
      
      // Extract metadata values for API request
      const metadata = options.metadata || {};
      const submissionId = metadata.submission_id || metadata.submissionId;
      const workerId = metadata.worker_id || metadata.workerId;
      const amount = metadata.amount;

      const response = await fetch('/api/payments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          txid,
          submissionId,
          amount,
          workerId,
          metadata, // Also send full metadata for reference
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete payment');
      }

      console.log(`✅ Payment completed successfully: ${paymentId}`);

      if (options.onComplete) {
        options.onComplete(options.metadata);
      }
    } catch (error) {
      console.error("❌ Failed to complete payment:", error);
      if (options.onError) {
        options.onError(
          error instanceof Error
            ? error
            : new Error("Payment completion failed")
        );
      }
    }
  };

  const onCancel = (paymentId: string): void => {
    console.log("Payment cancelled:", paymentId);
  };

  const onError = (error: Error, payment?: PiPayment): void => {
    console.error("Payment error:", error, payment);
    if (options.onError) {
      options.onError(error, payment);
    }
  };

  return {
    onReadyForServerApproval,
    onReadyForServerCompletion,
    onCancel,
    onError,
  };
};

// ============================================================================
// Core Payment Function
// ============================================================================

export const pay = async (options: PaymentOptions): Promise<void> => {
  const paymentData: PiPaymentData = {
    amount: options.amount,
    memo: options.memo || `Payment of ${options.amount} Pi`,
    metadata: options.metadata,
  };

  const callbacks = createPaymentCallbacks(options);

  try {
    window.Pi.createPayment(paymentData, callbacks);
  } catch (error) {
    console.error("Failed to create payment:", error);
    if (options.onError) {
      options.onError(
        error instanceof Error ? error : new Error("Failed to create payment")
      );
    }
    throw error;
  }
};

// ============================================================================
// Incomplete Payment Recovery
// ============================================================================

export const checkIncompletePayments = async (
  payment: PiPayment
): Promise<void> => {
  try {
    console.log("Found incomplete payment:", payment.identifier);

    // Use our server-side endpoint instead of Pi Network API directly
    // Server-side has PI_API_KEY authorization
    const response = await fetch('/api/payments/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.identifier,
        txid: payment.transaction.txid,
        metadata: payment.metadata || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Server error: ${response.status}`);
    }

    console.log("✅ Incomplete payment recovered:", payment.identifier);
  } catch (error) {
    console.error("Failed to recover incomplete payment:", error);
    // Don't throw - incomplete payments should not block authentication
  }
};

// ============================================================================
// Initialize Global Payment Function
// ============================================================================

export const initializeGlobalPayment = (): void => {
  if (typeof window !== "undefined") {
    window.pay = pay;
  }
};
