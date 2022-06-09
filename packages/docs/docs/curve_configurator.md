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

## LBC Configurator

```jsx async
var maxTime = 24 * 60 * 60; // 24 hours
var startSupply = 0;
var endSupply = 5000;
var { curveConfig, reserves, supply } = MarketplaceSdk.lbcCurve({
  interval: maxTime,
  startPrice: 5,
  minPrice: 0.5,
  targetMintDecimals: 0,
  maxSupply: endSupply
});
var supplyOffset = supply; // So that ticks format correctly
```

<CurveConfiguratorFromVariables rateVsTime />