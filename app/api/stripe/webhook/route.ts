import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // apiVersion: '2025-01-27.acacia',
});

// We need to create a Supabase client with SERVICE_ROLE_KEY to update profiles blindly
// Note: You must add SUPABASE_SERVICE_ROLE_KEY to your .env.local
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing required Stripe/Supabase environment variables");
        return new NextResponse("Server configuration error", { status: 500 });
    }

    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook Signature Verification Failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
            console.error('Stripe Webhook Error: Missing userId in session metadata');
            return new NextResponse('Missing userId in metadata', { status: 400 });
        }

        console.log(`Upgrading user ${userId} to pro`);
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_tier: 'pro' })
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            return new NextResponse('Database Error', { status: 500 });
        }

        console.log(`Successfully upgraded user ${userId} to pro`);
    }

    return new NextResponse(null, { status: 200 });
}
