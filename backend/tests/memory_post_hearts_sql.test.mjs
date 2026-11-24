import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("post hearts authorize the current pair, set desired state idempotently and cascade on deletion", async () => {
  const { PGlite } = await import("../../.local-tools/conversation-pg-test/node_modules/@electric-sql/pglite/dist/index.js");
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE TABLE users(id TEXT PRIMARY KEY,couple_id TEXT);
      CREATE TABLE couples(id TEXT PRIMARY KEY,partner1_id TEXT,partner2_id TEXT,status TEXT);
      CREATE TABLE memories(id TEXT PRIMARY KEY,couple_id TEXT);
      INSERT INTO users VALUES('a','pair'),('b','pair'),('c','other');
      INSERT INTO couples VALUES('pair','a','b','active'),('other','c','d','active');
      INSERT INTO memories VALUES('post','pair'),('foreign','other');
      GRANT ALL ON users,couples,memories TO service_role;`);
    await db.exec(await readFile(new URL("../migrations/20261116_memory_post_hearts.sql", import.meta.url), "utf8"));
    await db.exec("SET ROLE service_role");
    const op = async (actor, memory, desired = null) => (await db.query("SELECT memory_post_heart_operation($1,$2,$3) AS result", [actor, memory, desired])).rows[0].result;
    assert.deepEqual((await op('a','post')).data,{memory_id:'post',heart_count:0,hearted:false});
    assert.equal((await op('a','post',true)).data.heart_count,1);
    assert.equal((await op('a','post',true)).data.heart_count,1);
    assert.equal((await op('b','post')).data.hearted,false);
    assert.equal((await op('b','post',true)).data.heart_count,2);
    assert.equal((await op('a','post',false)).data.heart_count,1);
    assert.equal((await op('a','post',false)).data.heart_count,1);
    assert.equal((await op('a','foreign',true)).outcome,'not_found');
    await db.exec("UPDATE users SET couple_id=NULL WHERE id='b'");
    assert.equal((await op('a','post')).outcome,'forbidden');
    await db.exec("UPDATE users SET couple_id='pair' WHERE id='b'; DELETE FROM memories WHERE id='post'");
    assert.equal((await db.query('SELECT count(*)::int AS count FROM memory_post_hearts')).rows[0].count,0);
    assert.equal((await op('a','post',true)).outcome,'not_found');
    await db.exec("SET ROLE authenticated");
    await assert.rejects(db.query('SELECT * FROM memory_post_hearts'), error => error.code === '42501');
    await assert.rejects(db.query("SELECT memory_post_heart_operation('a','post',true)"), error => error.code === '42501');
  } finally { await db.close(); }
});
