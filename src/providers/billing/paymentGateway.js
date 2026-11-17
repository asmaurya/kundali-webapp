/**
 * PaymentGateway port — Noop now; Razorpay/Stripe adapters later.
 *
 * Do NOT call real money APIs until Phase C (ARCHITECTURE §4).
 * UI should depend only on this interface + Wallet snapshot.
 */

export const PAYMENT_GATEWAY_IDS = {
  noop: 'noop',
  razorpay: 'razorpay', // future
};

export function createNoopPaymentGateway() {
  return {
    id: PAYMENT_GATEWAY_IDS.noop,
    async createTopUpSession({ amount, currency = 'INR' }) {
      return {
        status: 'stub',
        sessionId: `stub_${Date.now()}`,
        amount,
        currency,
        message:
          'Payment gateway not connected yet. Usage is metered locally; top-up will land in Phase C.',
      };
    },
    async confirmTopUp() {
      return { status: 'stub', credited: false };
    },
  };
}

/**
 * Skeleton for a future Razorpay adapter — not wired; kept so the seam is obvious.
 */
export function createRazorpayPaymentGateway({ keyId, fetchImpl = fetch } = {}) {
  return {
    id: PAYMENT_GATEWAY_IDS.razorpay,
    async createTopUpSession({ amount, currency = 'INR', receipt }) {
      if (!keyId) {
        throw new Error('Razorpay key is not configured.');
      }
      // Real implementation will POST to our Worker, which creates a Razorpay order.
      void fetchImpl;
      return {
        status: 'pending_implementation',
        keyId,
        amount,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      };
    },
    async confirmTopUp() {
      throw new Error('Razorpay confirmTopUp is not implemented yet.');
    },
  };
}

let gateway = createNoopPaymentGateway();

export function getPaymentGateway() {
  return gateway;
}

export function setPaymentGateway(next) {
  gateway = next;
}
