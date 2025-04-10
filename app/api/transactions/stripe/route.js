// /app/api/transactions/stripe/route.js
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

    // Attempt to retrieve PaymentIntent, expand charges
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(reference, {
        expand: ['charges'],
      });
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
    if (
      paymentIntent.charges &&
      paymentIntent.charges.data &&
      paymentIntent.charges.data.length > 0
    ) {
      // Typically the first (and often only) charge has the receipt URL
      const charge = paymentIntent.charges.data[0];
      receiptUrl = charge.receipt_url;
    }

    return NextResponse.json({
      success: true,
      reference,
      receiptUrl,
    });
  } catch (error) {
    console.error('Error in stripe route:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
