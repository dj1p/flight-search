import { runSearch } from '../services/search.js';

const bodySchema = {
  type: 'object',
  required: ['trip_type', 'slices', 'passengers'],
  properties: {
    trip_type:       { type: 'string', enum: ['one_way', 'round_trip', 'multi_city'] },
    slices: {
      type: 'array', minItems: 1, maxItems: 6,
      items: {
        type: 'object',
        required: ['origin', 'destination', 'departure_date'],
        properties: {
          origin:         { type: 'string', minLength: 3, maxLength: 3 },
          destination:    { type: 'string', minLength: 3, maxLength: 3 },
          departure_date: { type: 'string', format: 'date' },
        },
      },
    },
    passengers: {
      type: 'array', minItems: 1, maxItems: 9,
      items: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['adult', 'child', 'infant_without_seat'] },
          age:  { type: 'integer', minimum: 0, maximum: 17 },
        },
      },
    },
    cabin_class:     { type: 'string', enum: ['economy', 'premium_economy', 'business', 'first'] },
    currency:        { type: 'string', minLength: 3, maxLength: 3 },
    date_flex_days:  { type: 'integer', minimum: 0, maximum: 3 },
    airlines:        { type: 'array', items: { type: 'string' } },
    max_connections: { type: 'integer', minimum: 0, maximum: 3 },
    sort_by:         { type: 'string', enum: ['price', 'duration', 'departure'] },
    limit:           { type: 'integer', minimum: 1, maximum: 100 },
    after:           { type: 'string' },
  },
  additionalProperties: false,
};

export default async function searchRoute(app) {
  app.post('/search', { schema: { body: bodySchema } }, async (request, reply) => {
    const result = await runSearch(request.body);
    return reply.send(result);
  });
}
