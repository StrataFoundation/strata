import React from "react";
import type { NextPage } from "next";

import { Hero } from "../components/Splash/Hero";
import { Bounties } from "../components/Splash/Bounties";
import { Lbc } from "../components/Splash/Lbc";
import { Investors } from "../components/Splash/Investors";
import { GetStarted } from "../components/Splash/GetStarted";

const Home: NextPage = () => (
  <>
    <Hero />
    <Bounties />
    <Lbc />
    <GetStarted />
  </>
);

export default Home;
