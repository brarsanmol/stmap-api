import { fastify, FastifyInstance } from 'fastify';
import { AddressInfo } from 'net';

const useFastify = async () => {
  const app: FastifyInstance = fastify();

  await app.register(import('@fastify/cors'));

  app.listen({ port: 3000 }, () => {
    console.log(
      `server listening on ${(app.server.address() as AddressInfo).port}`
    );
  });
};

useFastify();
