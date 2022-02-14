---
sidebar_position: 3
---

# Curve Configurator

A playground to test and plot different curve parameters

## Curve Configurator
```jsx async
var curveConfig = new TimeDecayExponentialCurveConfig({
  c: 0.01,
  k0: 2,
  k1: 0,
  interval: 10
})
```
import { CurveConfiguratorFromVariables } from "@site/src/components/CurveConfigurator";

<CurveConfiguratorFromVariables />

## LBP Configurator

```jsx async
var { curveConfig, reserves, supply } = MarketplaceSdk.lbpCurve({
  interval: 10, // 10 seconds
  maxPrice: 5,
  minPrice: 0.5,
  targetMintDecimals: 0,
  maxSupply: 5000
});
var startSupply = supply;
var endSupply = 2 * supply;
```

<CurveConfiguratorFromVariables />