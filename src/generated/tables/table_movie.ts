/* eslint-disable @typescript-eslint/no-explicit-any */
export interface table_movie {
  cast: any | null;
  created_at: string | null;
  created_by: string | null;
  deleted_at: string | null;
  director: string | null;
  duration_minutes: number;
  email_producer: any | null;
  genre: any | null;
  movie_id: string;
  poster_url: string | null;
  producer_share?: number | null;
  rating: string;
  release_date: string;
  synopsis: string | null;
  tax_rate?: number | null;
  trailer_url: string | null;
  updated_at: string | null;
}
