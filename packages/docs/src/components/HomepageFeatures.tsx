/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import clsx from "clsx";
//@ts-ignore
import styles from "./HomepageFeatures.module.css";

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Easy to Use",
    image: "/img/EasytoUse.png",
    description: (
      <>
        Strata provides SDKs to launch Tokens in an instant. No Rust or Solana
        experience needed!
      </>
    ),
  },
  {
    title: "Free and Open",
    image: "/img/FreeandOpen.png",
    description: (
      <>
        Strata is free to use and Open Source. Launch your token without someone
        else taking a cut!
      </>
    ),
  },
  {
    title: "Build Quickly with React",
    image: "/img/BuildwithReact.png",
    description: (
      <>
        Strata comes with hooks and helpers to make coding using React a breeze.
      </>
    ),
  },
];

function Feature({ title, image, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img
          style={{ width: "100px", height: "100px" }}
          className={styles.featureSvg}
          alt={title}
          src={image}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
