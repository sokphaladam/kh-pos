import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TRIGGER \`trg_update_showtime_status\` 
    AFTER UPDATE ON \`seat_reservation\` 
    FOR EACH ROW 
    BEGIN
      IF OLD.reservation_status = 'pending' AND NEW.reservation_status = 'confirmed' THEN 
        UPDATE showtime 
        SET available_seats = available_seats - 1 
        WHERE showtime_id = NEW.showtime_id; 
      END IF;

      IF OLD.reservation_status = 'confirmed' AND NEW.reservation_status = 'pending' THEN 
        UPDATE showtime 
        SET available_seats = available_seats + 1 
        WHERE showtime_id = NEW.showtime_id; 
      END IF;
      
      UPDATE showtime 
      SET status = CASE 
        WHEN available_seats = 0 AND status IN ('scheduled','selling')
        THEN 'sold_out' 
        WHEN available_seats > 0 AND status IN ('scheduled','sold_out')
        THEN 'selling' 
        ELSE status 
      END 
      WHERE showtime_id = NEW.showtime_id;
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS trg_update_showtime_status;
  `);
}
