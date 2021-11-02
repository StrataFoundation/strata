import React, { useEffect, useState } from 'react';
import ReactJson from 'react-json-view'
import styles from './styles.module.css';
import { FaPlay } from "react-icons/fa";
import { PublicKey } from '@solana/web3.js';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { usePrograms } from '../../hooks/programs';
import { parse } from "esprima";
import BN from 'bn.js';
import { load } from 'quicktype-core/dist/MarkovChain';
import { useVariablesContext } from '../Root/variables';
import { useProvider } from '@site/src/hooks/provider';


function wrapAndCollectVars(code: string, injectedVars): string {
  const wrapped = `(async function() {
    ${code}
  }())`
  const declarations = parse(wrapped)
    .body[0].expression.callee.body.body
    .filter(({ type }) => type === "VariableDeclaration")
    .flatMap(({ declarations }) => declarations)
    .map(({ id }) => id);

  const variables = declarations.flatMap(({ type, name, properties }) => {
    if (type === "Identifier") {
      return [name]
    } else if (type === "ObjectPattern") {
      return properties.map(({ key }) => key.name)
    }
    return []
  })

  return `
(async function() {
  var { ${Object.keys(injectedVars).join(", ")} } = injectedVars;
  ${code}
  ${variables.map(variable => 
    `vars.${variable} = ${variable};`
  ).join("\n")}
}())
  `;
}

// Turn all BN into base 10 numbers as strings
function recursiveTransformBN(args: any): Record<string, any> {
  return Object.entries(args).reduce((acc, [key, value]) => {
    if (value instanceof BN) {
      acc[key] = value.toString(10);
    } else if (value instanceof PublicKey) {
      acc[key] = value.toBase58();
    } else if (value && (value as any)._bn) {
      acc[key] = new PublicKey(new BN((value as any)._bn, 'hex')).toBase58();
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = recursiveTransformBN(value);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, any>);
}

export default ({ code, scope, name, deps }) => {
  const [loading, setLoading] = useState(false);
  const [runningThisCommand, setRunningThisCommand] = useState(false);
  const  { register, execWithDeps } = useVariablesContext();
  const [variables, setVariables] = useState<any>(null);
  const [error, setError] = useState<Error>();
  const { connected, publicKey } = useWallet()
  const { tokenCollectiveSdk, tokenBondingSdk } = usePrograms();
  const { connection } = useConnection();
  const provider = useProvider();

  var vars = {}; // Outer variable, not stored.
  async function exec(globalVariables: any) {
    setRunningThisCommand(true);
    try {
      const walletAcct = await connection.getAccountInfo(publicKey)
      if (!walletAcct || walletAcct.lamports < 500000000) {
        await connection.requestAirdrop(publicKey, 1000000000);
      }
      const injectedVars = { provider, tokenCollectiveSdk, tokenBondingSdk, publicKey, ...scope, ...globalVariables };
      await eval(wrapAndCollectVars(code, injectedVars))
      setVariables(vars)
      return {
        ...globalVariables,
        ...vars,
      }
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
  }, [publicKey, tokenBondingSdk, tokenCollectiveSdk]);

  if (error) {
    throw error;
  }

  const fullLoading = loading || !tokenBondingSdk || !tokenCollectiveSdk

  return <div className={styles.container}>
    { (!tokenBondingSdk || !tokenCollectiveSdk) && <div>Loading SDK...</div>}
    {loading && !runningThisCommand && <div>Running previous commands...</div>}
    {loading && runningThisCommand && <div>Loading...</div>}
    {!fullLoading && <ReactJson collapsed={1} displayDataTypes={false} name={false} src={recursiveTransformBN(variables || {})} /> }
    { connected && <button
      disabled={fullLoading}
      className={styles.runButton}
      onClick={wrappedExecWithDeps}
    >
      <FaPlay className={styles.buttonIcon} /> Run
    </button> }
    {!connected && <>
      <WalletModalProvider>
        <WalletMultiButton />
      </WalletModalProvider>
    </>}
  </div>
}