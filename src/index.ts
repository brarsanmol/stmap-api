import { fastify, FastifyInstance } from 'fastify';
import { AddressInfo } from 'net';
import { TransitFeedJob } from './jobs/transit-feed.job';
import StopCacherJob from './jobs/stop-cacher.job';
import { fromRedisToStop, Stop } from './entities/stop.entity';
import StopTimeCacherJob from './jobs/stop-time-cacher.job';
import { fromRedisToStopTime, StopTime } from './entities/stop-time.entity';
import { Bus, fromRedisToBus } from './entities/bus.entity';
import { VehiclePositionUpdaterJob } from './jobs/vehicle-position-updater.job';
import * as process from 'process';

const useFastify = async () => {
  const app: FastifyInstance = fastify();

  await app.register(import('@fastify/cors'));
  await app.register(import('@fastify/redis'), {
    host: process.env.REDIS_HOST,
  });
  await app.register(import('@fastify/schedule'));

  app.ready().then(() => {
    app.scheduler.addSimpleIntervalJob(new TransitFeedJob());
    app.scheduler.addSimpleIntervalJob(new StopCacherJob(app.redis));
    app.scheduler.addSimpleIntervalJob(new StopTimeCacherJob(app.redis));
    app.scheduler.addSimpleIntervalJob(
      new VehiclePositionUpdaterJob(app.redis)
    );
  });

  app.get('/stops/', async (_, reply) => {
    const stops: Stop[] = await Promise.all(
      await app.redis
        .keys('stop:*')
        .then(keys =>
          keys.map(async key => fromRedisToStop(await app.redis.hgetall(key)))
        )
    );

    reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(stops);
  });

  app.get('/stop-times/', async (_, reply) => {
    const times: StopTime[] = await Promise.all(
      await app.redis
        .keys('stop-time:*')
        .then(keys =>
          keys.map(async key =>
            fromRedisToStopTime(await app.redis.hgetall(key))
          )
        )
    );

    reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(times);
  });

  app.get('/busses/', async (_, reply) => {
    const busses: Bus[] = await Promise.all(
      await app.redis
        .keys('bus:*')
        .then(keys =>
          keys.map(async key => fromRedisToBus(await app.redis.hgetall(key)))
        )
    );

    reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(busses);
  });

  app.listen({ port: parseInt(process.env.PORT!) || 3000}, () => {
    console.log(
      `server listening on ${(app.server.address() as AddressInfo).port}`
    );
  });
};

useFastify();
