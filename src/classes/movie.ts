import { table_movie } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { Knex } from "knex";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export interface MovieInput {
  variantId: string;
  durationMinutes: number;
  rating: string;
  genre: string[];
  releaseDate: string;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  director?: string | null;
  cast?: string[];
  synopsis?: string | null;
  emailProducer?: string[];
  producerShare?: number;
  taxRate?: number;
}

export class MovieService {
  constructor(
    private trx: Knex,
    private user: UserInfo,
  ) {}

  async createMovie(input: MovieInput): Promise<void> {
    const now = Formatter.getNowDateTime();

    const movieData: table_movie = {
      movie_id: input.variantId,
      duration_minutes: input.durationMinutes,
      rating: input.rating,
      genre: input.genre.length > 0 ? JSON.stringify(input.genre) : null,
      release_date: input.releaseDate,
      poster_url: input.posterUrl || null,
      trailer_url: input.trailerUrl || null,
      director: input.director || null,
      cast:
        input.cast && input.cast.length > 0 ? JSON.stringify(input.cast) : null,
      synopsis: input.synopsis || null,
      created_by: this.user.id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      email_producer:
        input.emailProducer && input.emailProducer.length > 0
          ? JSON.stringify(input.emailProducer)
          : null,
      producer_share: input.producerShare || 0,
      tax_rate: input.taxRate || 0,
    };

    await this.trx.table<table_movie>("movie").insert(movieData);
  }

  async updateMovie(input: MovieInput): Promise<void> {
    const now = Formatter.getNowDateTime();

    const movieData: Partial<table_movie> = {
      duration_minutes: input.durationMinutes,
      rating: input.rating,
      genre: input.genre.length > 0 ? JSON.stringify(input.genre) : null,
      release_date: input.releaseDate,
      poster_url: input.posterUrl || null,
      trailer_url: input.trailerUrl || null,
      director: input.director || null,
      cast:
        input.cast && input.cast.length > 0 ? JSON.stringify(input.cast) : null,
      synopsis: input.synopsis || null,
      updated_at: now,
      email_producer:
        input.emailProducer && input.emailProducer.length > 0
          ? JSON.stringify(input.emailProducer)
          : null,
      producer_share: input.producerShare || 0,
      tax_rate: input.taxRate || 0,
    };

    await this.trx
      .table<table_movie>("movie")
      .where({ movie_id: input.variantId })
      .update(movieData);
  }

  async getMovieByVariantId(variantId: string): Promise<MovieInput | null> {
    const movie = await this.trx
      .table<table_movie>("movie")
      .where({ movie_id: variantId })
      .whereNull("deleted_at")
      .first();

    if (!movie) return null;

    return {
      variantId: movie.movie_id,
      durationMinutes: movie.duration_minutes,
      rating: movie.rating,
      genre: movie.genre ? movie.genre : [],
      releaseDate: movie.release_date
        ? Formatter.date(movie.release_date)!
        : "",
      posterUrl: movie.poster_url,
      trailerUrl: movie.trailer_url,
      director: movie.director,
      cast: movie.cast ? movie.cast : [],
      synopsis: movie.synopsis,
      emailProducer: movie.email_producer ? movie.email_producer : [],
      producerShare: movie.producer_share,
      taxRate: movie.tax_rate,
    };
  }

  async deleteMovie(variantId: string): Promise<void> {
    const now = Formatter.getNowDateTime();
    await this.trx
      .table<table_movie>("movie")
      .where({ movie_id: variantId })
      .update({ deleted_at: now });
  }
}
