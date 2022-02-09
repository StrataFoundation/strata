import {
  PublicKey, SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} from "@solana/web3.js";
import { BPF_UPGRADE_LOADER_ID } from "./createUpgradeInstruction";

export async function createCloseInstruction(
  programId: PublicKey,
  bufferAddress: PublicKey,
  upgradeAuthority: PublicKey,
  recipientAddress: PublicKey
) {
  const bpfUpgradableLoaderId = BPF_UPGRADE_LOADER_ID;

  const [programDataAddress] = await PublicKey.findProgramAddress(
    [programId.toBuffer()],
    bpfUpgradableLoaderId
  );

  const keys = [
    {
      pubkey: bufferAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: recipientAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: upgradeAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: programDataAddress,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    }
  ];

  return new TransactionInstruction({
    keys,
    programId: bpfUpgradableLoaderId,
    data: Buffer.from([5, 0, 0, 0]), // Upgrade instruction bincode
  });
}
