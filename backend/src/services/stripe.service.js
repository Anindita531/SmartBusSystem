import { stripe } from '../config/stripe.js';

export const createPaymentIntent = async (amount, currency = 'usd') => {
  return await stripe.paymentIntents.create({
    amount: amount * 100,
    currency,
    automatic_payment_methods: { enabled: true }
  });
};

export const retrievePaymentIntent = async (id) => {
  return await stripe.paymentIntents.retrieve(id);
};