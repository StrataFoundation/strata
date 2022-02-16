---
sidebar_position: 3
---

# Curve Configurator

A playground to test and plot different curve parameters

## Curve Configurator
```jsx async
var maxTime = 24 * 60 * 60; // 24 hours,
var curveConfig = new TimeDecayExponentialCurveConfig({
  c: 0.01,
  k0: 2,
  k1: 0,
  interval: maxTime,
  d: 0.5
})
```
import { CurveConfiguratorFromVariables } from "@site/src/components/CurveConfigurator";

<CurveConfiguratorFromVariables />

## LBP Configurator

```jsx async
var maxTime = 24 * 60 * 60; // 24 hours
var { curveConfig, reserves, supply } = MarketplaceSdk.lbpCurve({
  interval: maxTime,
  startPrice: 5,
  minPrice: 0.5,
  targetMintDecimals: 0,
  maxSupply: 5000
});
var startSupply = supply;
var endSupply = 2 * supply;
```

<CurveConfiguratorFromVariables />