import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE EVENT \`ev_update_showtime_status\`
    ON SCHEDULE EVERY 10 MINUTE
    ON COMPLETION PRESERVE
    ENABLE
    COMMENT 'event to update showtime status to started or ended'  
    DO BEGIN
      UPDATE showtime 
      SET status = 'started' 
      WHERE status IN ('scheduled','selling', 'sold_out') 
      AND start_time <= CONVERT_TZ(NOW(), 'UTC', 'Asia/Phnom_Penh') 
      AND end_time > CONVERT_TZ(NOW(), 'UTC', 'Asia/Phnom_Penh');
      
      UPDATE showtime 
      SET status = 'ended' 
      WHERE status <> 'ended' 
      AND end_time <= CONVERT_TZ(NOW(), 'UTC', 'Asia/Phnom_Penh');
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS ev_update_showtime_status;
  `);
}
