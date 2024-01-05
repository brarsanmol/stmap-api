export type Bus = {
  id: number;
  route: string;
  movement: MovementStatus;
  occupancy: OccupancyStatus;
  latitude: number;
  longitude: number;
  trip: string;
  sequence: number;
  speed?: number;
  updatedAt: number;
};

export enum MovementStatus {
  Stopped = 1,
  InTransit = 2,
}

export enum OccupancyStatus {
  Empty = 0,
  ManySeatsAvailable = 1,
  FewSeatsAvailable = 2,
  StandingRoomOnly = 3,
  Full = 4,
  Unavailable = 5,
}

export const fromRedisToBus = ({
  id,
  route,
  movement,
  occupancy,
  latitude,
  longitude,
  trip,
  sequence,
  speed,
  updatedAt,
}: Record<string, string>): Bus => {
  return {
    id: parseInt(id) as number,
    route: route,
    movement: MovementStatus[movement],
    occupancy: OccupancyStatus[occupancy],
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    trip: trip,
    sequence: parseInt(sequence),
    speed: parseFloat(speed),
    updatedAt: parseInt(updatedAt),
  };
};
