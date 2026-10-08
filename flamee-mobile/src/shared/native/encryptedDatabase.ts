import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "flamee.db";
const DATABASE_KEY_NAME = "flamee.sqlite.sqlcipher-key.v1";
let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function loadOrCreateDatabaseKey(): Promise<string> {
  const storedKey = await SecureStore.getItemAsync(DATABASE_KEY_NAME);
  if (storedKey) return storedKey;

  const generatedKey = toHex(await Crypto.getRandomBytesAsync(32));
  await SecureStore.setItemAsync(DATABASE_KEY_NAME, generatedKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return generatedKey;
}

async function openEncryptedDatabase(): Promise<SQLite.SQLiteDatabase> {
  const key = await loadOrCreateDatabaseKey();
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // SQLCipher is compiled by the config plugin. Set the hex key before issuing
  // any schema/query operation; the key itself remains in SecureStore.
  await database.execAsync(`PRAGMA key = "x'${key}'";`);
  const cipherStatus = await database.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version;");
  if (!cipherStatus?.cipher_version) {
    await database.closeAsync();
    throw new Error("SQLCipher is not enabled in this native build.");
  }
  await database.execAsync("PRAGMA cipher_memory_security = ON;");
  return database;
}

export function getEncryptedDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openEncryptedDatabase().catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}
