import { MovieInput } from "@/classes/movie";
import { table_movie } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";

export function createMovieByVariantIDLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_movie[] = await db
      .table<table_movie>("movie")
      .whereNull("deleted_at")
      .whereIn("movie_id", keys);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.find((row) => row.movie_id === key);
        if (!row) return null;

        return {
          variantId: row.movie_id,
          durationMinutes: row.duration_minutes,
          rating: row.rating,
          genre: row.genre ? row.genre : [],
          releaseDate: row.release_date
            ? Formatter.date(row.release_date)!
            : "",
          posterUrl: row.poster_url,
          trailerUrl: row.trailer_url,
          director: row.director,
          cast: row.cast ? row.cast : [],
          synopsis: row.synopsis,
          emailProducer: row.email_producer ? row.email_producer : [],
          producerShare: row.producer_share,
          taxRate: row.tax_rate,
        } as MovieInput;
      }),
    );
  });
}
