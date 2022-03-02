import React from "react";
import type { NextPage } from "next";

import { Hero } from "@/components/Splash/Hero";
import { Bounties } from "@/components/Splash/Bounties";
import { Bootstrapper } from "@/components/Splash/Bootstrapper";
import { Investors } from "@/components/Splash/Investors";
import { GetStarted } from "@/components/Splash/GetStarted";

const Home: NextPage = () => (
  <>
    <Hero />
    <Bounties />
    <Bootstrapper />
    <Investors />
    <GetStarted />
  </>
);

export default Home;
