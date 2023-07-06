"use strict";

/**
 * product controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const { sanitize } = require("@strapi/utils");
module.exports = createCoreController("api::product.product", ({ strapi }) => ({
  // instead of modifying the findOne which uses the id we can create a filter to return a single product
  async findBySlug(ctx) {
    const { slug } = ctx.params;

    const query = {
      filters: { slug },
      ...ctx.query,
    };

    const entity = await strapi.entityService.findMany(
      "api::product.product",
      query
    );
    const schema = strapi.getModel("api::product.product");
    const sanitizedEntity = await sanitize.contentAPI.output(entity, schema);

    return this.transformResponse(sanitizedEntity[0]);
  },
}));
