import * as anchor from "@project-serum/anchor";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";

use(ChaiAsPromised);

const sleep = (ts: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ts);
  });

describe("spl-wumbo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());

  const program = anchor.workspace.SplWumbo;

  it("Uses the workspace to invoke the initialize instruction", async () => {
    await program.rpc.initialize();
  });
});
