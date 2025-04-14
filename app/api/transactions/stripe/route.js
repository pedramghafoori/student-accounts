import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// We'll read STRIPE_SECRET_KEY from your environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'No Stripe reference provided' },
        { status: 400 }
      );
    }

    // Attempt to retrieve PaymentIntent, expand charges and payment method
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(reference, {
        expand: ['charges', 'payment_method'],
      });
      console.log("[Stripe route] Retrieved paymentIntent:", paymentIntent);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message: `Error retrieving PaymentIntent with ID ${reference}: ${err.message}`,
        },
        { status: 400 }
      );
    }

    if (!paymentIntent) {
      return NextResponse.json(
        { success: false, message: 'PaymentIntent not found' },
        { status: 404 }
      );
    }

    let receiptUrl = null;
    let cardType = null;
    let last4 = null;

    if (
      paymentIntent.charges &&
      paymentIntent.charges.data &&
      paymentIntent.charges.data.length > 0
    ) {
      // Typically the first (and often only) charge has the receipt URL
      const charge = paymentIntent.charges.data[0];
      receiptUrl = charge.receipt_url;

      // Get payment method details
      if (charge.payment_method_details?.card) {
        cardType = charge.payment_method_details.card.brand;
        last4 = charge.payment_method_details.card.last4;
        // Capitalize first letter
        cardType = cardType.charAt(0).toUpperCase() + cardType.slice(1);
      }
    }

    // If we couldn't get the charge data, try to retrieve it directly
    if (!receiptUrl && paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        receiptUrl = charge.receipt_url;
        
        if (charge.payment_method_details?.card) {
          cardType = charge.payment_method_details.card.brand;
          last4 = charge.payment_method_details.card.last4;
          cardType = cardType.charAt(0).toUpperCase() + cardType.slice(1);
        }
      } catch (err) {
        console.error("Error retrieving charge:", err);
      }
    }

    // If we couldn't get card details from the charge, try the payment method
    if ((!cardType || !last4) && paymentIntent.payment_method) {
      // Check if payment_method is already an expanded object or just an ID
      const pmObject = typeof paymentIntent.payment_method === 'string'
        ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
        : paymentIntent.payment_method; // Already expanded

      if (pmObject.card) {
        if (!cardType) {
          cardType = pmObject.card.brand;
          // Capitalize first letter
          cardType = cardType.charAt(0).toUpperCase() + cardType.slice(1);
        }
        if (!last4) {
          last4 = pmObject.card.last4;
        }
      }
    }

    console.log("[Stripe route] returning:", {
      success: true,
      reference,
      receiptUrl,
      cardType,
      last4,
    });

    return NextResponse.json({
      success: true,
      reference,
      receiptUrl,
      cardType,
      last4,
    });
  } catch (error) {
    console.error('Error in stripe route:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
