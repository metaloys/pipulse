/**
 * Pi Network Escrow Payment Management
 * 
 * Handles the two-step payment flow:
 * 1. Employer pays full amount to PiPulse owner wallet (locked in escrow)
 * 2. On approval, PiPulse owner pays worker (amount - 15% fee)
 */

import { pay, setPaymentRewardHandler } from '@/lib/pi-payment';
import { createTransaction, updateTask } from '@/lib/database';
import type { PaymentMetadata } from '@/lib/pi-payment';

// ============================================================================
// Configuration - SET THESE TO YOUR VALUES
// ============================================================================

// CRITICAL: Update this to your actual PiPulse owner Pi wallet address
export const PIPULSE_OWNER_WALLET_ID = 'GAFGTGK5VKSVETFUAEYGTVXENSAENKF2KGGTMHEKSOO3RE2322HMADL6'; // Your wallet address

// CRITICAL: Update this to the actual Pi username that owns the PiPulse app
export const PIPULSE_OWNER_USERNAME = 'aloysmet'; // Your Pi username

// Commission rate (15%)
export const PIPULSE_COMMISSION_RATE = 0.15;

// ============================================================================
// Type Definitions
// ============================================================================

export type EscrowPaymentMetadata = {
  type: 'escrow_lock' | 'escrow_release';
  task_id: string;
  employer_id: string;
  worker_id?: string;
  amount: number;
  fee?: number;
  timestamp: string;
  description: string;
};

// ============================================================================
// Step 1: Initiate Escrow Payment (Employer → PiPulse Owner)
// ============================================================================

/**
 * When employer posts a task, collect the full reward amount upfront
 * This payment goes to PiPulse owner wallet and is locked in escrow
 * 
 * @param taskId - The task being posted
 * @param employerId - The employer's Pi wallet ID
 * @param rewardAmount - Total Pi amount (e.g., 10π)
 * @param taskTitle - Task title for the memo
 * 
 * @returns Promise that resolves when payment is complete
 */
export async function initiateEscrowPayment(
  taskId: string,
  employerId: string,
  rewardAmount: number,
  taskTitle: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const metadata: EscrowPaymentMetadata = {
      type: 'escrow_lock',
      task_id: taskId,
      employer_id: employerId,
      amount: rewardAmount,
      timestamp: new Date().toISOString(),
      description: `Escrow payment for task: ${taskTitle}`,
    };

    const paymentOptions = {
      amount: rewardAmount,
      memo: `PiPulse Task Escrow: ${taskTitle} (${rewardAmount}π)`,
      metadata,
      onComplete: async (completedMetadata: PaymentMetadata) => {
        try {
          console.log('✅ Escrow payment completed:', completedMetadata);
          
          // Create transaction record showing funds are locked
          await createTransaction({
            sender_id: employerId,
            receiver_id: PIPULSE_OWNER_WALLET_ID,
            amount: rewardAmount,
            pipulse_fee: 0, // No fee on escrow lock
            task_id: taskId,
            transaction_type: 'payment',
            transaction_status: 'completed',
            pi_blockchain_txid: completedMetadata.pi_blockchain_txid || null,
            timestamp: new Date().toISOString(),
          });

          resolve();
        } catch (error) {
          console.error('❌ Failed to record escrow transaction:', error);
          reject(error);
        }
      },
      onError: (error: Error) => {
        console.error('❌ Escrow payment failed:', error);
        reject(error);
      },
    };

    window.pay?.(paymentOptions).catch(reject);
  });
}

// ============================================================================
// Step 2: Release Payment to Worker (PiPulse Owner → Worker)
// ============================================================================

/**
 * When employer approves a submission, pay the worker their portion
 * PiPulse keeps the 15% commission
 * 
 * This simulates PiPulse owner wallet releasing the worker's share
 * In a real implementation, this would require a backend-signed transaction
 * 
 * @param taskId - The completed task ID
 * @param workerId - Worker's Pi wallet ID
 * @param workerUsername - Worker's Pi username
 * @param rewardAmount - Original task reward (e.g., 10π)
 * 
 * @returns Promise that resolves when payment completes
 */
export async function releasePaymentToWorker(
  taskId: string,
  workerId: string,
  workerUsername: string,
  rewardAmount: number
): Promise<void> {
  // Calculate amounts
  const pipulseFee = rewardAmount * PIPULSE_COMMISSION_RATE; // 15%
  const workerPayment = rewardAmount - pipulseFee; // 85%

  return new Promise((resolve, reject) => {
    const metadata: EscrowPaymentMetadata = {
      type: 'escrow_release',
      task_id: taskId,
      employer_id: taskId, // Using taskId as placeholder since we don't have employer_id in this context
      worker_id: workerId,
      amount: workerPayment,
      fee: pipulseFee,
      timestamp: new Date().toISOString(),
      description: `Payment for completed task (${workerPayment}π + ${pipulseFee}π fee)`,
    };

    const paymentOptions = {
      amount: workerPayment,
      memo: `PiPulse Task Reward: ${workerPayment}π to ${workerUsername}`,
      metadata,
      onComplete: async (completedMetadata: PaymentMetadata) => {
        try {
          console.log('✅ Worker payment completed:', completedMetadata);
          
          // Record payment to worker
          await createTransaction({
            sender_id: PIPULSE_OWNER_WALLET_ID,
            receiver_id: workerId,
            amount: workerPayment,
            pipulse_fee: pipulseFee,
            task_id: taskId,
            transaction_type: 'payment',
            transaction_status: 'completed',
            pi_blockchain_txid: completedMetadata.pi_blockchain_txid || null,
            timestamp: new Date().toISOString(),
          });

          // Record PiPulse commission as separate transaction
          await createTransaction({
            sender_id: PIPULSE_OWNER_WALLET_ID,
            receiver_id: PIPULSE_OWNER_WALLET_ID,
            amount: pipulseFee,
            pipulse_fee: 0,
            task_id: taskId,
            transaction_type: 'fee',
            transaction_status: 'completed',
            pi_blockchain_txid: null,
            timestamp: new Date().toISOString(),
          });

          resolve();
        } catch (error) {
          console.error('❌ Failed to record worker payment:', error);
          reject(error);
        }
      },
      onError: (error: Error) => {
        console.error('❌ Worker payment failed:', error);
        reject(error);
      },
    };

    window.pay?.(paymentOptions).catch(reject);
  });
}

// ============================================================================
// Utility: Calculate Worker Payment
// ============================================================================

/**
 * Calculate how much the worker receives after PiPulse commission
 * 
 * @param rewardAmount - Original task reward amount
 * @returns Object with worker payment and fee amounts
 */
export function calculateWorkerPayment(rewardAmount: number) {
  const pipulseFee = rewardAmount * PIPULSE_COMMISSION_RATE;
  const workerPayment = rewardAmount - pipulseFee;
  
  return {
    workerPayment: Math.round(workerPayment * 100) / 100, // Round to 2 decimals
    pipulseFee: Math.round(pipulseFee * 100) / 100,
    originalAmount: rewardAmount,
  };
}

// ============================================================================
// Utility: Verify Payment Configuration
// ============================================================================

/**
 * Check if payment system is properly configured
 * Call this during app initialization to catch config errors early
 */
export function verifyPaymentConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!PIPULSE_OWNER_WALLET_ID || PIPULSE_OWNER_WALLET_ID.length < 30) {
    errors.push('PIPULSE_OWNER_WALLET_ID must be set to actual wallet ID');
  }

  if (!PIPULSE_OWNER_USERNAME || PIPULSE_OWNER_USERNAME.length < 3) {
    errors.push('PIPULSE_OWNER_USERNAME must be set to actual username');
  }

  if (PIPULSE_COMMISSION_RATE < 0 || PIPULSE_COMMISSION_RATE > 1) {
    errors.push('PIPULSE_COMMISSION_RATE must be between 0 and 1');
  }

  if (typeof window === 'undefined' || !window.pay) {
    errors.push('Pi payment system not initialized');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Initialize Payment Reward Handler
// ============================================================================

/**
 * Set up the reward handler for completed payments
 * This is called during app initialization
 */
export function initializePaymentRewardHandling() {
  setPaymentRewardHandler(async (metadata: PaymentMetadata) => {
    console.log('🎉 Payment reward metadata received:', metadata);
    // You can add analytics, notifications, etc. here
  });
}
