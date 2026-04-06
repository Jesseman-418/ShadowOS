import aiosqlite
import os

DB_PATH = os.getenv("DB_PATH", "shadowos.db")


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS prospects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                handle TEXT UNIQUE NOT NULL,
                name TEXT,
                platform TEXT DEFAULT 'instagram',
                followers INTEGER,
                niche TEXT,
                email TEXT,
                youtube_url TEXT,
                website TEXT,
                has_podcast INTEGER DEFAULT 0,
                has_youtube INTEGER DEFAULT 0,
                has_product INTEGER DEFAULT 0,
                qualification_score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'discovered',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prospect_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                hook_type TEXT,
                status TEXT DEFAULT 'draft',
                sent_at TIMESTAMP,
                replied_at TIMESTAMP,
                reply_sentiment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prospect_id) REFERENCES prospects(id)
            );

            CREATE TABLE IF NOT EXISTS research (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prospect_id INTEGER NOT NULL,
                content_summary TEXT,
                personalization_hooks TEXT,
                content_gaps TEXT,
                recommended_spec_work TEXT,
                raw_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prospect_id) REFERENCES prospects(id)
            );

            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                niche TEXT,
                prospects_found INTEGER DEFAULT 0,
                emails_sent INTEGER DEFAULT 0,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                status TEXT DEFAULT 'running'
            );
        """)
        await db.commit()
