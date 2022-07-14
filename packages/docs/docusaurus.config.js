// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const math = require("remark-math");
const katex = require("rehype-katex");
const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const plantuml = require("@akebifiky/remark-simple-plantuml");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Strata Protocol",
  tagline: "Launch a token around a person, idea, or collective in minutes",
  url: process.env.DOCS_ONLY
    ? "https://docs.strataprotocol.com"
    : process.env.BLOG_ONLY
    ? "https://blog.strataprotocol.com"
    : "https://strataprotocol.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "StrataFoundation", // Usually your GitHub org/user name.
  projectName: "strata", // Usually your repo name.
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        sitemap: {
          changefreq: "weekly",
          priority: 0.5,
        },
        docs: process.env.BLOG_ONLY
          ? false
          : {
              remarkPlugins: [math, plantuml],
              rehypePlugins: [katex],
              sidebarPath: require.resolve("./sidebars.js"),
              // Please change this to your repo.
              editUrl:
                "https://github.com/StrataFoundation/strata/edit/master/packages/docs",
              routeBasePath: process.env.DOCS_ONLY ? "/" : "docs",
            },
        blog: process.env.DOCS_ONLY
          ? false
          : {
              remarkPlugins: [math, plantuml],
              rehypePlugins: [katex],
              blogSidebarTitle: "All our posts",
              blogSidebarCount: "ALL",
              showReadingTime: true,
              // Please change this to your repo.
              editUrl:
                "https://github.com/StrataFoundation/strata/edit/master/packages/docs/blog",
              routeBasePath: process.env.BLOG_ONLY ? "/" : "blog",
            },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],
  plugins: [
    "./src/plugins/webpack-loader",
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "bonding",
        entryPoints: ["../spl-token-bonding/src/index.ts"],
        tsconfig: "../spl-token-bonding/tsconfig.json",
        out: "api/spl-token-bonding",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "collective",
        entryPoints: ["../spl-token-collective/src/index.ts"],
        tsconfig: "../spl-token-collective/tsconfig.json",
        out: "api/spl-token-collective",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "react",
        entryPoints: ["../react/src/index.ts"],
        tsconfig: "../react/tsconfig.json",
        out: "api/react",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "marketplace-sdk",
        entryPoints: ["../marketplace-sdk/src/index.ts"],
        tsconfig: "../marketplace-sdk/tsconfig.json",
        out: "api/marketplace-sdk",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "marketplace-ui",
        entryPoints: ["../marketplace-ui/src/index.ts"],
        tsconfig: "../marketplace-ui/tsconfig.json",
        out: "api/marketplace-ui",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "chat",
        entryPoints: ["../chat/src/index.ts"],
        tsconfig: "../chat/tsconfig.json",
        out: "api/chat",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "chat-ui",
        entryPoints: ["../chat-ui/src/index.ts"],
        tsconfig: "../chat-ui/tsconfig.json",
        out: "api/chat-ui",
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      // Plugin / TypeDoc options
      {
        id: "fungible-entangler",
        entryPoints: ["../fungible-entangler/src/index.ts"],
        tsconfig: "../fungible-entangler/tsconfig.json",
        out: "api/fungible-entangler",
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          ...(process.env.BLOG_ONLY
            ? [
                {
                  to: "/how-to-create-a-solana-token-on-strata",
                  from: "/create-a-token",
                },
              ]
            : [
                {
                  from: "/marketplace/lbc",
                  to: "/launchpad/lbc",
                },
                {
                  from: "/marketplace/bounties",
                  to: "/launchpad/bounties",
                },
              ]),
        ],
      },
    ],
  ],
  stylesheets: [
    {
      href: "https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css",
      integrity:
        "sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc",
      crossorigin: "anonymous",
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      ...(process.env.GOOGLE_ANALYTICS
        ? {
            gtag: {
              trackingID: process.env.GOOGLE_ANALYTICS,
              anonymizeIP: true,
            },
          }
        : {}),
      liveCodeBlock: {
        /**
         * The position of the live playground, above or under the editor
         * Possible values: "top" | "bottom"
         */
        playgroundPosition: "bottom",
      },
      navbar: {
        title: "Strata",
        logo: {
          alt: "Strata Logo",
          src: "img/logo.png",
          href: "https://strataprotocol.com",
        },
        items: [
          // {
          //   type: "doc",
          //   docId: "getting_started",
          //   position: "left",
          //   label: "Docs",
          // },
          // {
          //   to: "/blog",
          //   label: "Blog",
          //   position: "left",
          // },
          {
            href: "https://github.com/StrataFoundation/strata",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Tutorial",
                to: "https://docs.strataprotocol.com/getting_started",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/XQhCFg77WM",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/StrataProtocol",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "https://blog.strataprotocol.com",
              },
              {
                label: "GitHub",
                href: "https://github.com/StrataFoundation/strata",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Strata Foundation.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
