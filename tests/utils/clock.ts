import { Connection, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';

export async function sleep(ts: number) {
  return new Promise((resolve) => {
   setTimeout(resolve, ts);
  })
}

export async function getClockTime(connection: Connection): Promise<bigint> {
  const clock = (await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY))!;
  return clock.data.readBigInt64LE(8 * 4);
}

export async function waitForUnixTime(connection: Connection, unixTime: bigint, sleepInterval: number = 500) {
  while (await getClockTime(connection) < unixTime) {
    await sleep(sleepInterval);
  }
}