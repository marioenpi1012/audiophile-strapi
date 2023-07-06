module.exports = {
  routes: [
    {
      method: "GET",
      path: "/orders/:stripeSessionId",
      handler: "order.findOne",
    },
  ],
};
