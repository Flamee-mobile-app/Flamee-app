import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("daily reminder is durable, owner-scoped, deduplicated and respects local-day check-ins", async () => {
  const { PGlite } = await import("../../.local-tools/conversation-pg-test/node_modules/@electric-sql/pglite/dist/index.js");
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE TABLE users(id TEXT PRIMARY KEY); CREATE TABLE moods(user_id TEXT,created_at TEXT); CREATE TABLE smart_nudges(id TEXT PRIMARY KEY); CREATE TABLE couples(id TEXT PRIMARY KEY);
      INSERT INTO users VALUES('a'),('b'),('c'); GRANT ALL ON users,moods TO service_role;`);
    await db.exec(await readFile(new URL("../migrations/20261116_mood_daily_reminders.sql", import.meta.url), "utf8"));
    await db.exec("SET ROLE service_role");
    assert.equal((await db.query('SELECT mood_e2e_capabilities() AS result')).rows[0].result.dual_mood_nudge,false);
    const op = async (user, action, zone = 'Asia/Ho_Chi_Minh', target = null, limit = 20, offset = 0) => (await db.query("SELECT mood_daily_reminder_operation($1,$2,$3,$4,$5,$6) AS result", [user, action, zone, target, limit, offset])).rows[0].result;
    const first = await op('a','ensure');
    assert.equal(first.data.show_prompt,true);
    assert.equal((await op('a','ensure')).data.show_prompt,false);
    assert.equal((await op('a','list')).data.unread_count,1);
    assert.equal((await op('b','read','UTC',first.data.reminder.id)).outcome,'not_found');
    assert.ok((await op('a','read','UTC',first.data.reminder.id)).data.read_at);
    assert.equal((await op('a','list')).data.unread_count,0);
    assert.equal((await op('a','read_all')).data.unread_count,0);
    assert.equal((await op('a','list','UTC',null,1,1)).data.items.length,0);
    await db.exec("INSERT INTO moods VALUES ('b',now()::text)");
    assert.equal((await op('b','ensure')).data.reminder,null);
    assert.equal((await op('c','ensure')).data.show_prompt,true);
    await db.exec("INSERT INTO moods VALUES ('c',now()::text)");
    assert.equal((await op('c','ensure')).data.reminder,null);
    assert.equal((await op('c','list')).data.unread_count,0,'completed check-in clears today reminder badge');
    assert.equal((await op('a','ensure','Invalid/Zone')).outcome,'validation');
    await db.exec("SET ROLE authenticated");
    await assert.rejects(db.query("SELECT * FROM mood_daily_reminders"), error => error.code === '42501');
    await assert.rejects(db.query("SELECT mood_daily_reminder_operation('a','list')"), error => error.code === '42501');
  } finally { await db.close(); }
});

test("dual Mood changes refresh the nudge while an identical context remains deduplicated", async () => {
  const { PGlite } = await import("../../.local-tools/conversation-pg-test/node_modules/@electric-sql/pglite/dist/index.js");
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE TABLE users(id TEXT PRIMARY KEY, couple_id TEXT, timezone TEXT);
      CREATE TABLE couples(id TEXT PRIMARY KEY, status TEXT, partner1_id TEXT, partner2_id TEXT);
      CREATE TABLE moods(user_id TEXT, created_at TEXT);
      CREATE TABLE smart_nudges(id TEXT PRIMARY KEY,couple_id TEXT,receiver_id TEXT,partner_id TEXT,status TEXT,observation TEXT,action_type TEXT,draft TEXT,reason TEXT,tone TEXT,created_at TEXT,source TEXT,latency_ms INTEGER,snoozed_until TEXT,expires_at TEXT,is_crisis BOOLEAN,helplines JSONB,version INTEGER,snooze_count INTEGER);
      INSERT INTO couples VALUES ('c','active','a','b'); INSERT INTO users VALUES ('a','c','UTC'),('b','c','UTC');`);
    await db.exec(await readFile(new URL("../migrations/20261116_mood_daily_reminders.sql", import.meta.url), "utf8"));
    await db.exec('ALTER TABLE moods ADD COLUMN draft_version INTEGER, ADD COLUMN custom_emotion_label TEXT, ADD COLUMN mascot_sticker_id TEXT, ADD COLUMN sleep_hours INTEGER, ADD COLUMN attachments JSONB, ADD COLUMN timezone TEXT, ADD COLUMN local_date DATE, ADD COLUMN mood_score INTEGER');
    assert.equal((await db.query('SELECT mood_e2e_capabilities() AS result')).rows[0].result.dual_mood_nudge, true);
    const base = { id: 'n1', couple_id: 'c', receiver_id: 'a', partner_id: 'b', dual_mood_generated: true, source_mood_id: 'b1', receiver_mood_id: 'a1' };
    const create = async payload => (await db.query('SELECT create_smart_nudge_guarded($1::jsonb) AS result', [JSON.stringify(payload)])).rows[0].result;
    assert.equal((await create(base)).outcome, 'created');
    assert.equal((await create({ ...base, id: 'n2' })).outcome, 'suppressed');
    assert.equal((await create({ ...base, id: 'n3', source_mood_id: 'b2' })).outcome, 'created');
    assert.equal((await create({ ...base, id: 'n4', source_mood_id: null })).outcome, 'suppressed');
  } finally { await db.close(); }
});
