import { getOffer } from '../providers/duffel.js';
import { mapOffer }  from '../services/mapper.js';
import { getOrSet }  from '../services/cache.js';
import config        from '../config.js';

export default async function offersRoute(app) {
  app.get('/offers/:id', async (request, reply) => {
    const { id } = request.params;

    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return reply.status(400).send({ error: 'Invalid offer id', code: 'BAD_REQUEST' });
    }

    const offer = await getOrSet(
      `offer:${id}`,
      config.cache.offerTtl,
      () => getOffer(id).then(mapOffer)
    );

    return reply.send(offer);
  });
}
