import React, { useState } from 'react';
import ReactJson from 'react-json-view'
import styles from './styles.module.css';
import { FaPlay } from "react-icons/fa";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePrograms } from '../../hooks/programs';

export default ({ code }) => {
  const [loading, setLoading] = useState(false);
  const [variables, setVariables] = useState<any>(null);
  const [error, setError] = useState<Error>();
  const { connected } = useWallet()
  // Leave these here so they can be used inside the eval
  const { tokenCollective, tokenBonding } = usePrograms();

  if (error) {
    throw error;
  }

  var vars = {}; // Outer variable, not stored.
  async function exec() {
    setError(null);
    setLoading(true);

    try {
      await eval(
        `
        (async function() {
          ${code.replaceAll(/(const|var|let) /g, "vars.")}
        }())
        `
      )
      setVariables(vars)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  return <div className={styles.container}>
    {loading && <div>Loading...</div>}
    {!loading && <ReactJson displayDataTypes={false} name={false} src={variables || {}} /> }
    { connected && <button
      className={styles.runButton}
      onClick={exec}
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