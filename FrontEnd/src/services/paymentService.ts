import api from '../api/client';

export interface CreateOrderParams {
  amount: number; // in Rupees (e.g. 50, 500, 2500)
  currency?: string;
  productName?: string;
  invoice_id?: number | null;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  invoice_id?: number | null;
}

export interface RazorpayCheckoutOptions {
  amount: number; // in Rupees
  productName: string;
  invoice_id?: number | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: { payment_id: string; order_id: string; receipt_no?: string }) => void;
  onError?: (error: any) => void;
}

/**
 * Dynamically loads the official Razorpay checkout script if not present
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const paymentService = {
  /**
   * 1. Create order on the backend with Razorpay
   */
  createOrder: async (data: CreateOrderParams) => {
    const res = await api.post('/payment/create-order', data);
    return res.data;
  },

  /**
   * 2. Verify payment HMAC signature on the backend
   */
  verifyPayment: async (data: VerifyPaymentParams) => {
    const res = await api.post('/payment/verify-payment', data);
    return res.data;
  },

  /**
   * 3. End-to-end Luxury Razorpay Checkout Flow
   */
  openCheckout: async ({
    amount,
    productName,
    invoice_id,
    customerName = 'Club Member',
    customerEmail = '',
    customerPhone = '',
    onSuccess,
    onError,
  }: RazorpayCheckoutOptions): Promise<void> => {
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      // Step A: Create order on server
      const { data: resData } = await api.post('/payment/create-order', {
        amount,
        productName,
        invoice_id,
      });

      if (!resData.success || !resData.order) {
        throw new Error(resData.message || 'Failed to initialize payment order');
      }

      const { order, key_id } = resData;

      // Step B: Configure Razorpay modal with Champions Club styling
      const options = {
        key: key_id || (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TjJUqJ4Y2LFsm3',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'The Champions Club',
        description: productName,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Step C: Verify signature on server
            const verifyRes = await api.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoice_id,
            });

            if (verifyRes.data.success) {
              onSuccess({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
              });
            } else {
              if (onError) onError(new Error('Payment signature verification failed'));
            }
          } catch (err) {
            console.error('[Payment Verification Error]', err);
            if (onError) onError(err);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#B89047', // Champagne Gold brand accent
        },
        modal: {
          ondismiss: function () {
            if (onError) onError(new Error('Payment modal closed by user'));
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        console.error('[Razorpay payment failed]', resp.error);
        if (onError) onError(resp.error);
      });
      rzp.open();
    } catch (err: any) {
      console.error('[Razorpay openCheckout error]', err);
      if (onError) onError(err);
      else throw err;
    }
  },
};

export default paymentService;
