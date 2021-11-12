import { Connection } from "@solana/web3.js";

export const getFeesPerSignature = async (
  connection: Connection
): Promise<number | undefined> => {
  const feeCalculator = await connection.getFeeCalculatorForBlockhash(
    (
      await connection.getRecentBlockhash()
    ).blockhash
  );

  return feeCalculator.value?.lamportsPerSignature;
};
