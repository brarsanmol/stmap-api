import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import { FastifyRedis } from '@fastify/redis';
import { Stop } from '../entities/stop.entity';

const STOPS_FILE = '/tmp/gtfs_stm/stops.txt';

class StopCacherJob extends SimpleIntervalJob {
  constructor(redis: FastifyRedis) {
    super({ minutes: 60, runImmediately: true }, new StopCacherTask(redis));
  }
}

export class StopCacherTask extends AsyncTask {
  constructor(private readonly redis: FastifyRedis) {
    super('stop-cacher', async () => {
      if (
        !this.redis.exists('stop:*') ||
        (await this.redis.ttl('stop:*')) <= 120
      ) {
        fs.createReadStream(STOPS_FILE)
          .pipe(parse({ delimiter: ',' }))
          .on('data', row => {
            const stop: Stop = {
              id: row[0],
              name: row[2],
              latitude: row[3],
              longitude: row[4],
            };
            this.redis.hset(`stop:${stop.id}`, stop);
          });
        this.redis.expire('stop:*', 60 * 60 * 24);
      }
    });
  }
}

export default StopCacherJob;
