# Spl Bonding Presale

This contract allows a fair launch of a token bonding curve via a presale. The presale works in two stages.

## Stage 1

A presale bonding curve is created to exchange base tokens for a presale token. The presale lasts some set period of time.

## Launch

The bonding curve launches. All funds from the presale curve are dumped into the main bonding curve.

## Stage 2

A separate bonding curve is launched to swap presale tokens for target tokens of the bonding curve. This curve disincentivizes early selloffs.

See whitepaper for more info.

# Process

This smart contract really only requires two commands. The first command, `InitializeTokenBondingPresale` ensures that all 3 necessary bonding curves are setup to execute a presale. The second command, `Launch` is a permissionless endpoint that, after the freeze date of the presale curve unfreezes the bonding curve and injects all of presale balance. 

## InitializeTokenBondingPresale

This setup requires 3 bonding curves.

1. Token bonding of a to b (this is what we’re fair launching)
2. Presale token bonding of a to preA, freeze_buy = 3 days from now. 
3. Post token bonding of preA to b. go live date = 3 days from now.

## Launch

Step 1. Unfreeze the bonding curve
Step 2. Buy using the entirety of the presale base storage.
Step 3. Send bought tokens to the post sale base storage.



