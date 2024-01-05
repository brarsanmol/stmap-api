export type StopTime = {
  id: number;
  stop: number;
  arrival: string;
  departure: string;
  sequence: number;
};

export const fromRedisToStopTime = ({
  id,
  stop,
  arrival,
  departure,
  sequence,
}: Record<string, string>): StopTime => {
  return {
    id: parseInt(id),
    stop: parseInt(stop),
    arrival: arrival,
    departure: departure,
    sequence: parseInt(sequence),
  };
};
