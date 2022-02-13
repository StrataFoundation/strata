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

```jsx live allowMainnet
 function ShowCurveConfigurator() {
   const { curveConfig } = useVariables(); // Getting token bonding from above code;
   if (curveConfig) {
      return <CurveConfigurator curve={curveConfig} />
   }

   return <div>Please run the code block above</div>
 }
```