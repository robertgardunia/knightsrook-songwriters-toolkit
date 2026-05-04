/**
 * Dev seed: creates a test song with 4 generated audio tracks.
 * Run: npx tsx scripts/seed-dev.ts <clerk-user-id>
 *
 * Generates simple WAV sine-wave tones so the mixer has real audio to work with.
 * Replace these with real stems later.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../src/lib/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const SAMPLE_RATE = 44100;
const DURATION = 8; // seconds

function makeWav(freq: number, amplitude = 0.4): Buffer {
  const numSamples = SAMPLE_RATE * DURATION;
  const dataBytes = numSamples * 2; // 16-bit = 2 bytes per sample

  const buf = Buffer.alloc(44 + dataBytes);
  // RIFF header
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);         // chunk size
  buf.writeUInt16LE(1, 20);          // PCM
  buf.writeUInt16LE(1, 22);          // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);          // block align
  buf.writeUInt16LE(16, 34);         // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < numSamples; i++) {
    // fade in/out to avoid clicks
    const fade = Math.min(1, Math.min(i, numSamples - i) / (SAMPLE_RATE * 0.05));
    const sample = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE) * amplitude * fade;
    buf.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return buf;
}

// Simple kick-like thump: decaying low-freq burst
function makeKick(): Buffer {
  const numSamples = SAMPLE_RATE * DURATION;
  const dataBytes = numSamples * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataBytes, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(dataBytes, 40);

  const beatInterval = Math.floor(SAMPLE_RATE * 2); // kick every 2 seconds
  for (let i = 0; i < numSamples; i++) {
    const pos = i % beatInterval;
    const decay = Math.exp(-pos / (SAMPLE_RATE * 0.08));
    const freq = 60 + 120 * Math.exp(-pos / (SAMPLE_RATE * 0.015));
    const sample = Math.sin(2 * Math.PI * freq * pos / SAMPLE_RATE) * decay * 0.7;
    buf.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return buf;
}

const TRACKS = [
  { name: "Bass",    wav: makeWav(80, 0.5) },
  { name: "Melody",  wav: makeWav(440, 0.3) },
  { name: "Harmony", wav: makeWav(523, 0.25) },
  { name: "Kick",    wav: makeKick() },
];

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: npx tsx scripts/seed-dev.ts <clerk-user-id>");
    process.exit(1);
  }

  console.log(`Seeding dev song for user: ${userId}`);

  // Create song
  const songId = uuidv4();
  await pool.execute(
    "INSERT INTO songs (id, user_id, title) VALUES (?, ?, ?)",
    [songId, userId, "Dev Test Track"]
  );
  console.log(`Created song: Dev Test Track (${songId})`);

  // Upload each track
  for (const track of TRACKS) {
    const filename = `${uuidv4()}.wav`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, track.wav);

    const fileId = uuidv4();
    await pool.execute(
      "INSERT INTO audio_files (id, user_id, filename, original_name, mime_type, duration_ms, size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [fileId, userId, filename, `${track.name}.wav`, "audio/wav", DURATION * 1000, track.wav.length]
    );
    await pool.execute(
      "INSERT INTO song_audio (song_id, audio_file_id) VALUES (?, ?)",
      [songId, fileId]
    );
    console.log(`  Added track: ${track.name} → ${filename}`);
  }

  console.log("\nDone. Load the app, select 'Dev Test Track', go to Mixer.");
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
