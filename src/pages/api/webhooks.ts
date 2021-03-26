import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../services/stripe";

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    );
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false
  }
};

const relevantEvents = new Set([
  'checkout.session.completed',
]);

export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'POST') {
    const buf = await buffer(request);

    const secret = request.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return response.status(400).send(`Webhook error: ${err.message}`);
    }

    const { type } = event;

    if (relevantEvents.has(type)) {
      console.log('evento recebido', event);
    }

    response.json({ received: true });
  } else {
    response.setHeader('Allow', 'POST');
    response.status(405).end('Method now allowed');
  }
}