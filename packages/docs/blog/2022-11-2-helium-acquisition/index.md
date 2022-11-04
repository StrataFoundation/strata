---
slug: helium-foundation-acquisition
title: Strata is Joining the Helium Foundation
description: Strata has been acquired by the Helium Foundation
tags: [strata]
authors: [noah, bry]
keywords: [Strata, Helium, Acquisition]
---

# Strata is Joining Helium Foundation

### _Protocol Fees Have Been Eliminated, Core Protocol And Smart Contracts Have Been Open Sourced, Engineering Team To Join Helium Foundation to Advance Solana Innovation_

We’re excited to announce that Strata Protocol has been acquired by the [Helium Foundation](https://www.helium.foundation/)! 

As part of the acquisition, the Strata brand, launchpad, and core protocol IP have all be open sourced, and all protocol fees have been cut to zero. Strata is now a public good.

While Strata is an incredibly useful toolset, it is even more useful as a public good than a monetized product. Strata is most commonly used for ephemeral operations, like pricing an NFT launch. Since its inception, Strata launchpad has minted millions of tokens and helped small and large teams alike get their social tokens off the ground. 

Unfortunately, ephemeral operations relying on fees mostly lead to forks that remove the fees. Strata has seen great adoption, but is not easily monetized without building a completely new product. Instead of creating another new product, the team has decided to move to Helium to solve novel problems using our knowledge and our technology from Strata. 

Starting in November, the full protocol team will effectively transition into key engineering roles at the Helium Foundation with the goal of helping the Helium community implement [HIP 70](https://github.com/helium/HIP/blob/main/0070-scaling-helium.md), [Helium’s](https://www.helium.com/) network migration to Solana. The Strata team will primarily be handling the protocol side of the migration, as well as implementing all of the Solana smart contracts and interfaces. 

While at Strata, we developed novel ways to calculate bonding curve rewards that take into account not only the supply of the token but also the tokens in reserve and time elapsed. This tech will become the core of [Helium’s SubDAO treasury management](https://github.com/helium/HIP/blob/main/0051-helium-dao.md#subdao-treasury-management) system. We will also make good use of Strata’s typescript utilities, including its advanced account fetching cache that greatly reduces the burden on RPCs. 

Helium needs a reliable, Solana-native engineering team to help drive this migration, and it just so happens that the technology we’ve been working on solves many of the technical challenges Helium faces. The Strata team also craves the ability to continue solving novel problems that push the space forward. In sum, this was a fortuitous match for both of us.

Aside from the tech overlap noted above, the team is excited to explore the problem space that Helium is tackling. With the move towards decentralization, a decentralized data network owned by its users and operators is incredibly exciting—imagine using decentralized 5G on your Solana Saga phone! Strata’s team also comes with experience scaling data infrastructure. The Helium network has now reached a scale where real pain-points are being hit, and we are looking forward to digging in and solving them. 

We’re immensely grateful to our users. Thank you to everyone that believed in us, and that used Strata. You helped us refine our thinking and our tech, and make fungible tokens more accessible to all. 

In case you were wondering, there is no action required for Strata users. Every token created through Strata is a normal SPL token with Metaplex token metadata. Creators have full permissions over their tokens; they do not need Strata for any essential operations. If they opted to create a fully-managed token backed by a bonding curve, the bonding curve will continue functioning as designed. 

Launchpad fees have been dropped to zero and all of the codebases are open sourced. To ensure a successful transition to a public good, we will continue to monitor the discord for the next few months for any questions the community has. We will also be maintaining the launchpad and Strata contracts, though we will not be adding any new features. 

We recommend that anyone who wants to persistently use Strata fork [our contracts](https://github.com/StrataFoundation/strata) and deploy their own instance. All of our SDKs already support passing a different program ID as a parameter.

We’ll have lots more to share soon... 

But to give you a sneak peek:  

Our team has already written a majority of the smart contracts needed to drive the Helium Ecosystem on Solana. They are all open source, and you can take a look at them [here](https://github.com/helium/helium-program-library)! 

We’ve always had a strong open source culture at Strata, and we plan to continue that development ethos at Helium as well. For example, we have already made several additions to Anchor that almost eliminate the need for custom SDKs. If you’re a developer, it’s worth looking at the thin sdks and tests around these new smart contracts. Here’s a few: 



* **Circuit Breaker** - A generic contract for rate limiting mints or transfers from a token account. This can help slow down or stop exploits as they are unfolding. For example, this can allow you to “stop transferring from this token account if more than 20% of the funds have been transferred out in the last 24 hours”
* **Lazy Distributor**- A generic contract for rewarding tokens to network participants based on an off-chain calculation. This architecture reduces the amount of transactions that need to occur on chain, improving scalability. 

It has been an absolute pleasure building Strata over the last couple years, and we are extremely excited to be continuing on the forefront of Solana tech!

You can follow our progress at the [Helium Engineering Blog](https://engineering.helium.com/). 
