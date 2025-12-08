import { Show } from "./booking";


export interface Theater {
  _id: string;
  userId?: string;
  // movieId?: string;
  theatername: string;
  screens: string;
  contact: string;
  assignedMovies: string[]; // movieIds
  district: string;
  state: string;
  showTimes: string[]; // default show times
  createdAt?: string;
  updatedAt?: string;
}

export interface NearbyTheater extends Theater {
  distance: number;
}
export interface TheatersByStateRequest {
  state: string;
  movieId?: string;
}

export interface TheatersByDistrictRequest {
  district: string;
  movieId?: string;
}

export interface TheaterWithShows extends Theater {
  shows?: Show[];
}