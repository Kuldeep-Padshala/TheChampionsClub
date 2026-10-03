import React, { useState } from 'react';
import axios from 'axios';

const ProductCard = () => {
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
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

  const handlePayment = async () => {
    try {
      setLoading(true);
      const res = await loadRazorpayScript();

      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // 1. Create order on the backend
      const { data } = await axios.post(`${API_URL}/api/payment/create-order`);
      
      if (!data.success) {
        alert('Server error. Please try again.');
        setLoading(false);
        return;
      }

      const { order, key_id } = data;

      // 2. Initialize Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Sports Store',
        description: 'Cricket Leather Ball',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on the backend
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };
            
            const verifyRes = await axios.post(`${API_URL}/api/payment/verify-payment`, verifyData);
            
            if (verifyRes.data.success) {
              alert('Payment Successful!');
            } else {
              alert('Payment Verification Failed!');
            }
          } catch (err) {
            console.error(err);
            alert('Payment Verification Failed!');
          }
        },
        prefill: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        console.error(response.error);
        alert('Payment Failed: ' + response.error.description);
      });
      
      paymentObject.open();

    } catch (error) {
      console.error('Error in payment processing:', error);
      alert('An error occurred during payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Cricket Leather Ball</h2>
      <p style={styles.price}>₹50</p>
      <button 
        style={styles.button} 
        onClick={handlePayment} 
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '300px',
    margin: '20px auto',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    margin: '10px 0'
  },
  price: {
    fontSize: '20px',
    color: '#555',
    marginBottom: '20px'
  },
  button: {
    backgroundColor: '#3399cc',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  }
};

export default ProductCard;
