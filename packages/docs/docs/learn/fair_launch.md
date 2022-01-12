---
sidebar_position: 5
---

# Fair Launch

Strata has created an innovative way to combat the potentially destructive effects of automated trading bots on a newly launched bonding curve. Fair Launch begins with our acknowledgement that a bonding curve makes it profitable to get in early. The Strata Fair Launch disincentivizes bot trading by enforcing a tax on selling tokens anytime the bonding curve steepens, resulting in an increase in price. Let’s explore how Fair Launch works using the following bonding curve as an example of a particularly desirable one to get in early on. 


![Visualization](./visualization.png)

While this is a desired characteristic of bonding curves, it is also extremely vulnerable to front-running bots. If getting in early means a guaranteed profit, there is a lottery on getting your transaction through first. If there is a lottery on getting your transaction through first, a bot will send 10,000 transactions and clog the network.

So how do we disincentivise bots?

## The Bonding Curve Fair Launch

The goal is to disencentivize bots while still retaining the property that getting into the bonding curve early is ideal. We do this with a gradually steepening bonding curve.

A property of bonding curves is that the area under the price vs supply curve is always equal to the amount of money in the reserves. To get a better understanding of how bonding curves work, read [Bonding Curves](./bonding_curves) and [Advanced Bonding Curves](./advanced_bonding_curves)

At launch, the bonding curve looks like this. Let's draw a line to say that there are 5 tokens purchased at launch day:

![Launch Day](./launch.png)

Over the course of one day, the curve steepens:

![Launch Day](./day_2.png)

Notice that the area under the curve at 5 tokens is the same. The token just increased in price according to the curve, but there are still the same amount of `Reserve` tokens.

In the first day, the bots had no advantage in getting their transactions through sooner, as they received the same price as everyone else. On the second day, all day one participants gain an edge on future market entrants.

Over time, the curve steepens to its final shape:

![Final Curve Shape](./final.png)

## Gradual Change

In the example above, the curve steepens in 3 increments, piecewise. This is another opportunity for bots. Their strategy is to buy while the curve is flat, then submit 10,000 transactions to sell as soon as the curve steepens. To prevent this, we ensure that the price to sell tokens is continuously increasing on the scale of seconds. Rather than increasing all at once. This leaves no clear strategy for bots, as selling first yields lower returns.

We do accompanying each curve steepening by a period of increased sell fees. If the piecewise change causes a 10% increase in price, it will be accompanied by a 10% fee on sell that decreases linearly once per second until the next price change. These fees are directed back into the bonding curve reserves, improving the value for all holders.

## Changing Bonding Curves

The above took advantage of a powerful characteristic of Strata Bonding Curves: they do not determine price only from `Supply`. The current price is a function of both `Supply` and `Reserve`. This means that the underlying shape of the curve can change so long as the area under the new curve matches the area under the old curve. More on this in [Advanced Bonding Curves](./advanced_bonding_curves)
