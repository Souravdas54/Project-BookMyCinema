export interface Movie {
  _id: string;
  moviename: string;
  genre: string;
  language: string;
  duration: string;
  cast: string[];
  director: string[];
  releaseDate: string;
  description: string;
  poster: string;
  rating: number;
  votes?: number;
  likes?: number;
  promoted?: boolean;
}

export interface ReactMovieRequest {
  action: 'like' | 'unlike' | 'vote';
  rating?: number; // Optional for rating actions
}

export interface SimulateRatingRequest {
  futureVotes: number;
  userRating: number;
}

export interface SimulateRatingResponse {
  predictedRating: number;
}
