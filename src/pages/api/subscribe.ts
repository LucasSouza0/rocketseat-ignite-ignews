import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { query as q } from 'faunadb';
import { stripe } from './../../services/stripe';
import { fauna } from './../../services/fauna';

type User = {
  ref: {
    id: string;
  }
  data: { 
    stripe_customer_id: string 
  }
}

export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).end('Method not allowed');
    return;
  }

  const session = await getSession({ req: request });
  if (!session?.user) {
    response.status(401).end('User not found');
    return;
  }

  const user = await fauna.query<User>(
    q.Get(
      q.Match(
        q.Index('user_by_email'),
        q.Casefold(session.user.email || ''),
      ),
    ),
  );

  let customeId = user.data.stripe_customer_id;
  if (!customeId) {
    const stripeCustomer = await stripe.customers.create({
      email: session.user.email || '',
    });
  
    await fauna.query(
      q.Update(
        q.Ref(q.Collection('users'), user.ref.id),
        {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        },
      ),
    );

    customeId = stripeCustomer.id
  }
  

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customeId,
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    line_items: [
      { price: 'price_1KWVq0Esd3m6a9cH7PsiXg9I', quantity: 1 }
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: process.env.STRIPE_SUCCESS_URL || '',
    cancel_url: process.env.STRIPE_CANCEL_URL || '',
  });

  return response.status(200).json({ sessionId: checkoutSession.id });
}
