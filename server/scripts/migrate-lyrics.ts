/**
 * Migration: Convert lyrics from song-dependent rows to first-class objects.
 *
 * For each row in the old lyrics table (which had a song_id column), this script:
 *  1. Looks up the user_id from the songs table.
 *  2. Inserts a new row into the lyrics table (new schema: user_id, title, content).
 *  3. Inserts a row into song_lyrics to preserve the association.
 *
 * Safe to run multiple times — skips lyrics rows that are already migrated
 * (detected by checking whether the lyrics.id already exists in song_lyrics).
 *
 * Run: npx tsx scripts/migrate-lyrics.ts
 */
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../src/lib/db.js";

async function main() {
  // Detect whether the old schema (song_id column on lyrics) still exists.
  const [cols] = await pool.execute<any[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lyrics'
       AND COLUMN_NAME = 'song_id'`
  );

  if ((cols as any[]).length === 0) {
    console.log("Old song_id column not found on lyrics table — schema already migrated.");
    console.log("Nothing to do.");
    await pool.end();
    return;
  }

  // Fetch all old-schema lyrics rows with their song's user_id.
  const [oldRows] = await pool.execute<any[]>(
    `SELECT l.id, l.song_id, l.content, l.updated_at,
            s.user_id, s.title AS song_title
     FROM lyrics l
     JOIN songs s ON s.id = l.song_id`
  );

  console.log(`Found ${(oldRows as any[]).length} legacy lyrics rows to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const row of oldRows as any[]) {
    // Check if already migrated (song_lyrics row exists for this lyrics id).
    const [existing] = await pool.execute<any[]>(
      "SELECT 1 FROM song_lyrics WHERE lyrics_id = ? AND song_id = ? LIMIT 1",
      [row.id, row.song_id]
    );

    if ((existing as any[]).length > 0) {
      console.log(`  SKIP  ${row.id} (already in song_lyrics)`);
      skipped++;
      continue;
    }

    // Update the lyrics row in-place to add user_id and title.
    // (The old row already has the correct id and content.)
    await pool.execute(
      `UPDATE lyrics
          SET user_id = ?,
              title   = ?,
              created_at = updated_at
        WHERE id = ?`,
      [row.user_id, row.song_title ?? "Untitled", row.id]
    );

    // Create the song_lyrics association.
    await pool.execute(
      "INSERT INTO song_lyrics (song_id, lyrics_id) VALUES (?, ?)",
      [row.song_id, row.id]
    );

    console.log(`  OK    ${row.id} → song ${row.song_id} (user ${row.user_id})`);
    migrated++;
  }

  console.log(`\nMigration complete. Migrated: ${migrated}, Skipped: ${skipped}.`);
  console.log(
    "\nNEXT STEP: Run the following SQL to drop the old song_id column:\n" +
    "  ALTER TABLE lyrics DROP COLUMN song_id;\n" +
    "Only run this after confirming the migration looks correct."
  );

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
