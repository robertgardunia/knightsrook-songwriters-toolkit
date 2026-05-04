CREATE DATABASE IF NOT EXISTS songwriters_toolkit;
USE songwriters_toolkit;

CREATE TABLE IF NOT EXISTS songs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lyrics (
  id VARCHAR(36) PRIMARY KEY,
  song_id VARCHAR(36) NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  content TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audio files are user-owned and stored independently.
-- They persist even if all associated songs are deleted.
CREATE TABLE IF NOT EXISTS audio_files (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  duration_ms INT,
  size_bytes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many: a file can be tagged to multiple songs,
-- a song can have multiple audio files.
CREATE TABLE IF NOT EXISTS song_audio (
  song_id VARCHAR(36) NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  audio_file_id VARCHAR(36) NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, audio_file_id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
