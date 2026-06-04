const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
})

async function initDB() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email      VARCHAR(255) UNIQUE NOT NULL,
      nickname   VARCHAR(50)  NOT NULL,
      password   VARCHAR(255) NOT NULL,
      plan       VARCHAR(20)  NOT NULL DEFAULT 'free',
      created_at TIMESTAMP    NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id        UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      season_num     INT   NOT NULL,
      year           INT   NOT NULL,
      club_id        VARCHAR(50)  NOT NULL,
      club_name      VARCHAR(100) NOT NULL,
      final_position INT   NOT NULL,
      points         INT   NOT NULL,
      wins           INT   NOT NULL,
      draws          INT   NOT NULL,
      losses         INT   NOT NULL,
      goals_for      INT   NOT NULL,
      goals_against  INT   NOT NULL,
      -- Títulos individuais por competição
      title_brasileirao  BOOLEAN NOT NULL DEFAULT FALSE,
      title_copa_brasil  BOOLEAN NOT NULL DEFAULT FALSE,
      title_libertadores BOOLEAN NOT NULL DEFAULT FALSE,
      title_sulamericana BOOLEAN NOT NULL DEFAULT FALSE,
      title_recopa       BOOLEAN NOT NULL DEFAULT FALSE,
      title_mundial      BOOLEAN NOT NULL DEFAULT FALSE,
      title_estadual     INT     NOT NULL DEFAULT 0,
      completed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, season_num)
    );

    -- Migração segura: adiciona colunas se já existir a tabela sem elas
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_brasileirao  BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_copa_brasil  BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_libertadores BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_sulamericana BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_recopa       BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_mundial      BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE seasons ADD COLUMN IF NOT EXISTS title_estadual     INT     NOT NULL DEFAULT 0;
  `)
  console.log('✅ Database tables ready')
}

initDB().catch(err => {
  console.error('❌ DB init error:', err.message)
})

module.exports = pool
