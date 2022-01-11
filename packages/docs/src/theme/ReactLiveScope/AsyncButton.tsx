import BrowserOnly from "@docusaurus/BrowserOnly";
import { useEndpoint } from "../../contexts/Endpoint";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useProvider, useStrataSdks } from "@strata-foundation/react";
import BN from "bn.js";
import clsx from "clsx";
import { parse } from "esprima";
import React, { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";
import ReactJson from "react-json-view";
import { useVariablesContext } from "../Root/variables";
import styles from "./styles.module.css";
import { clusterApiUrl } from "@solana/web3.js";

function wrapAndCollectVars(code: string, injectedVars): string {
  const wrapped = `(async function() {
    ${code}
  }())`;
  const declarations = parse(wrapped)
    .body[0].expression.callee.body.body.filter(
      ({ type }) => type === "VariableDeclaration"
    )
    .flatMap(({ declarations }) => declarations)
    .map(({ id }) => id);

  const variables = declarations.flatMap(({ type, name, properties }) => {
    if (type === "Identifier") {
      return [name];
    } else if (type === "ObjectPattern") {
      return properties.map(({ key }) => key.name);
    }
    return [];
  });

  return `
(async function() {
  var { ${Object.keys(injectedVars).join(", ")} } = injectedVars;
  ${code}
  ${variables.map((variable) => `vars.${variable} = ${variable};`).join("\n")}
}())
  `;
}

// Turn all BN into base 10 numbers as strings
function recursiveTransformBN(
  args: any,
  seen: Map<any, any> = new Map()
): Record<string, any> {
  if (seen.has(args)) {
    return seen.get(args);
  }

  const ret = Object.entries(args).reduce((acc, [key, value]) => {
    if (value instanceof BN) {
      acc[key] = value.toString(10);
    } else if (value instanceof PublicKey) {
      // @ts-ignore
      acc[key] = value.toBase58();
    } else if (value && (value as any)._bn) {
      acc[key] = new PublicKey(new BN((value as any)._bn, "hex")).toBase58();
    } else if (typeof value === "object" && value !== null) {
      acc[key] = recursiveTransformBN(value, seen);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, any>);
  seen.set(args, ret);
  return ret;
}

const AsyncButton = ({ code, scope, name, deps }) => {
  const [loading, setLoading] = useState(false);
  const [runningThisCommand, setRunningThisCommand] = useState(false);
  const { register, execWithDeps } = useVariablesContext();
  const [variables, setVariables] = useState<any>(null);
  const [error, setError] = useState<Error>();
  const { connected, publicKey } = useWallet();
  const sdks = useStrataSdks();
  const { connection } = useConnection();
  const { provider } = useProvider();
  const { endpoint, setEndpoint } = useEndpoint();

  var vars = {}; // Outer variable, not stored.
  async function exec(globalVariables: any) {
    setRunningThisCommand(true);
    try {
      const walletAcct = await connection.getAccountInfo(publicKey);
      if (!walletAcct || walletAcct.lamports < 500000000) {
        await connection.requestAirdrop(publicKey, 1000000000);
      }
      const injectedVars = {
        provider,
        ...sdks,
        publicKey,
        ...scope,
        ...globalVariables,
      };
      await eval(wrapAndCollectVars(code, injectedVars));
      setVariables(vars);
      return {
        ...globalVariables,
        ...vars,
      };
    } finally {
      setRunningThisCommand(false);
    }
  }

  async function wrappedExecWithDeps() {
    setError(null);
    setLoading(true);
    try {
      await execWithDeps(name);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    register(name, deps.filter(Boolean), exec);
  }, [publicKey, ...Object.values(sdks)]);

  if (error) {
    throw error;
  }

  const fullLoading =
    loading || !sdks.tokenBondingSdk || !sdks.tokenCollectiveSdk;

  if (endpoint.includes("mainnet")) {
    return (
      <div className={styles.container}>
        <button
          onClick={() => {
            setEndpoint(clusterApiUrl(WalletAdapterNetwork.Devnet));
          }}
          className="white button button--primary"
        >
          Switch to Devnet
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {(!sdks.tokenBondingSdk || !sdks.tokenCollectiveSdk) && (
        <div>Loading SDK...</div>
      )}
      {loading && !runningThisCommand && (
        <div>Running previous commands...</div>
      )}
      {loading && runningThisCommand && <div>Loading...</div>}
      {!fullLoading && (
        <ReactJson
          theme="bright:inverted"
          collapsed={1}
          displayDataTypes={false}
          name={false}
          src={recursiveTransformBN(variables || {})}
        />
      )}
      {connected && (
        <button
          disabled={fullLoading}
          className={clsx(styles.runButton, "white button button--primary")}
          onClick={wrappedExecWithDeps}
        >
          <FaPlay className={styles.buttonIcon} /> Run
        </button>
      )}
      {!connected && (
        <>
          <WalletModalProvider>
            <WalletMultiButton />
          </WalletModalProvider>
        </>
      )}
    </div>
  );
};

export default (props: any) => (
  <BrowserOnly fallback={<div>...</div>}>
    {() => <AsyncButton {...props} />}
  </BrowserOnly>
);
