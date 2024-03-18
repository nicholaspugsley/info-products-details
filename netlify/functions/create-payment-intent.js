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
            metadata: {
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone,
                productDetails // Including detailed product info for backend processing
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
