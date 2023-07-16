"use strict";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::order.order",
  ({ strapi, env }) => ({
    async create(ctx) {
      const { products, username, email } = ctx.request.body;
      try {
        // create tax
        const taxRate = await stripe.taxRates.create({
          display_name: "Sales Tax",
          inclusive: false,
          percentage: 20,
        });

        //create shipping rate
        const shippingRate = await stripe.shippingRates.create({
          display_name: "shipping",
          type: "fixed_amount",
          fixed_amount: { amount: 5000, currency: "usd" },
        });
        // retrieve product information
        const line_items = await Promise.all(
          products.map(async (product) => {
            const item = await strapi
              .service("api::product.product")
              .findOne(product.id);
            return {
              price_data: {
                currency: "usd",
                product_data: {
                  name: item.name,
                },
                unit_amount: item.price * 100,
              },
              quantity: product.quantity,
              tax_rates: [taxRate.id],
            };
          })
        );
        // create stripe session
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: line_items,
          success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: process.env.APP_URL,
          shipping_options: [
            {
              shipping_rate: shippingRate.id,
            },
          ],
          // Save the cart for future usage / prefilling
          customer: "cus_O15fC4GGMBQeT2",
          payment_intent_data: {
            setup_future_usage: "on_session",
          },
        });

        // create the item
        await strapi.service("api::order.order").create({
          data: { username, products, stripeSessionId: session.id },
        });

        // return the session id
        return { id: session.id };
      } catch (error) {
        console.error("Error creating order:", error); // Log the specific error to the console
        ctx.response.status = 500;
        console.log({ error });
        return {
          error: {
            message: "There was a problem creating the order, please try again",
          },
          detailedError: error, // Include the detailed error object in the response for debugging purposes
        };
      }
    },

    async findOne(ctx) {
      const { stripeSessionId } = ctx.params;

      const entity = await strapi.db.query("api::order.order").findOne({
        where: { stripeSessionId },
      });

      const sanitizedEntity = await this.sanitizeOutput(entity);

      return this.transformResponse(sanitizedEntity);
    },
  })
);
