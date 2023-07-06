module.exports = {
  routes: [
    {
      method: "GET",
      path: "/product/find-by-slug/:slug",
      handler: "api::product.product.findBySlug",
    },
  ],
};
