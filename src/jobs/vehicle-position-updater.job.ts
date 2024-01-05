import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import GtfsRealtimeBindings, { transit_realtime } from 'gtfs-realtime-bindings';
import { Bus, OccupancyStatus } from '../entities/bus.entity';
import { FastifyRedis } from '@fastify/redis';

const VEHICLE_POSITION_UPDATE_URL =
  'https://api.stm.info/pub/od/gtfs-rt/ic/v2/vehiclePositions/';

export class VehiclePositionUpdaterJob extends SimpleIntervalJob {
  constructor(redis: FastifyRedis) {
    // 8640 magic number because global rate limit of STM API is 10 RPS and 10,000 requests a day.
    // (60 seconds / 8.64 seconds) * 60 minutes * 24 hours = 10,000, thus sending a request every 8.64 seconds is the perfect update time.
    super(
      { milliseconds: 8640, runImmediately: true },
      new VehiclePositionUpdaterTask(redis)
    );
  }
}

class VehiclePositionUpdaterTask extends AsyncTask {
  constructor(private readonly redis: FastifyRedis) {
    super(
      'vehicle-position-updater',
      () =>
        fetch(VEHICLE_POSITION_UPDATE_URL, {
          headers: {
            apiKey: process.env.STM_API_KEY!, // TODO: Gracefully fail.
          },
        })
          .then(response => response.arrayBuffer())
          .then(buffer => new Uint8Array(buffer))
          .then(buffer =>
            GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer)
          )
          .then(feed =>
            feed.entity.filter(
              entity =>
                entity.vehicle && entity.vehicle.trip && entity.vehicle.position
            )
          )
          .then(entities =>
            entities
              .map(({ id, vehicle }: transit_realtime.IFeedEntity) => {
                const bus: Bus = {
                  id: parseInt(id),
                  route: vehicle?.trip?.routeId!,
                  movement: vehicle?.currentStatus?.valueOf()!,
                  occupancy:
                    vehicle?.occupancyStatus?.valueOf() ??
                    OccupancyStatus.Unavailable,
                  latitude: vehicle?.position?.latitude!,
                  longitude: vehicle?.position?.longitude!,
                  trip: vehicle?.trip?.routeId!,
                  sequence: vehicle?.currentStopSequence!,
                  speed: vehicle?.position?.speed!,
                  updatedAt: vehicle?.timestamp! as number,
                };
                return bus;
              })
              .forEach(bus => this.redis.hset(`bus:${bus.id}`, bus))
          ),
      error => console.log(error)
    );
  }
}
