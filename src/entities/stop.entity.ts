import { StopTime } from './stop-time.entity';

export type Stop = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  times?: StopTime[];
};

export const fromRedisToStop = ({
  id,
  name,
  latitude,
  longitude,
}: Record<string, string>): Stop => {
  return {
    id: parseInt(id) as number,
    name: name,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
  };
};
