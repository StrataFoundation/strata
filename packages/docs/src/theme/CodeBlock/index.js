import CodeBlock from '@theme-init/CodeBlock';
import React from 'react';
import Playground from '@theme/Playground';
import ReactLiveScope from '@theme/ReactLiveScope';
import { useVariablesContext } from '../Root/variables';

const withLiveEditor = (Component) => {
  const WrappedComponent = (props) => {
    if (props.live || props.async) {
      return <Playground scope={ReactLiveScope} {...props} />;
    }

    return <Component {...props} />;
  };

  return WrappedComponent;
};

export default withLiveEditor(CodeBlock);
