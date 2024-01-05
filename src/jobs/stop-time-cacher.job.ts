import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import { FastifyRedis } from '@fastify/redis';
import { StopTime } from '../entities/stop-time.entity';

const STOP_TIMES_FILE = '/tmp/gtfs_stm/stop_times.txt';

class StopTimeCacherJob extends SimpleIntervalJob {
  constructor(redis: FastifyRedis) {
    super({ minutes: 60, runImmediately: true }, new StopTimeCacherTask(redis));
  }
}

export class StopTimeCacherTask extends AsyncTask {
  constructor(private readonly redis: FastifyRedis) {
    super('stop-time-cacher', async () => {
      if (
        !this.redis.exists('stop-time:*') ||
        (await this.redis.ttl('stop-time:*')) <= 120
      ) {
        fs.createReadStream(STOP_TIMES_FILE)
          .pipe(parse({ delimiter: ',' }))
          .on('data', row => {
            const time: StopTime = {
              id: row[0],
              stop: row[3],
              arrival: row[1],
              departure: row[2],
              sequence: row[4],
            };
            this.redis.hset(`stop-time:${time.id}`, time);
          });
        this.redis.expire('stop-time:*', 60 * 60 * 24);
      }
    });
  }
}

export default StopTimeCacherJob;
