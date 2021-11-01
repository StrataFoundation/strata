/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BrowserOnly from '@docusaurus/BrowserOnly';
import usePrismTheme from '@theme/hooks/usePrismTheme';
import styles from './styles.module.css';
import useIsBrowser from '@docusaurus/core/lib/client/exports/useIsBrowser';

function Header({children}) {
  return <div className={clsx(styles.playgroundHeader)}>{children}</div>;
}

function LivePreviewLoader() {
  // Is it worth improving/translating?
  return <div>Loading...</div>;
}

function ResultWithHeader() {
  return (
    <>
      {/* https://github.com/facebook/docusaurus/issues/5747 */}
      <div className={styles.playgroundPreview}>
        <BrowserOnly fallback={<LivePreviewLoader />}>
          {() => (
            <>
              <LivePreview />
              <LiveError />
            </>
          )}
        </BrowserOnly>
      </div>
    </>
  );
}

function ThemedLiveEditor() {
  const isBrowser = useIsBrowser();
  return (
    <LiveEditor
      // We force remount the editor on hydration,
      // otherwise dark prism theme is not applied
      key={isBrowser}
      className={styles.playgroundEditor}
    />
  );
}

let index = 1;
function transformAsync(code, scope, name, deps) {
  return `
function AsyncExec() {
  const scope = { ${Object.keys(scope).join(", ")} };
  const code = \`${code}\`
  return <AsyncButton name={"${name || index++}"} deps={[${(deps ||"").split(",").map(d => `"${d}"`).join(",")}]} code={code} scope={scope} />
}
  `
}

export default function Playground({children, transformCode, async, scope, name, deps, ...props}) {
  const {
    siteConfig: {
      themeConfig: {
        liveCodeBlock: {playgroundPosition},
      },
    },
  } = useDocusaurusContext();
  const prismTheme = usePrismTheme();
  const transform = async ? (c) => transformAsync(c, scope, name, deps) : ((code) => `${code};`);

  return (
    <div className={styles.playgroundContainer}>
      <LiveProvider
        code={children.replace(/\n$/, '')}
        transformCode={transformCode || transform}
        theme={prismTheme}
        scope={scope}
        {...props}>
          <>
            <ThemedLiveEditor />
            <ResultWithHeader />
          </>
      </LiveProvider>
    </div>
  );
}
