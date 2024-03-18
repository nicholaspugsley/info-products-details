const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { items, customer } = JSON.parse(event.body);
    const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    try {
        // Preparing product details for metadata
        const productDetails = items.map(item => `ID: ${item.id}, Price: ${item.price}, Quantity: ${item.quantity}`).join('; ');

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'usd',
            receipt_email: customer.email, // Directly use email for receipts
            metadata: {
                fullName: customer.fullName, // Consider if you still need it in metadata since we'll use billing_details
                phone: customer.phone,
                productDetails // Including detailed product info for backend processing
            },
            // Using billing_details to include the name
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic'
                }
            },
            payment_method_data: {
                type: 'card',
                billing_details: {
                    name: customer.fullName // Include the name in billing details
                    // Email is not directly included here, as it's set above with receipt_email
                }
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
