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
  url: "https://strataprotocol.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "StrataFoundation", // Usually your GitHub org/user name.
  projectName: "strata", // Usually your repo name.
  ssrTemplate: `<!DOCTYPE html>
  <html <%~ it.htmlAttributes %>>
    <head>
      <meta charset="UTF-8">
      <%~ it.headTags %>
      <% it.metaAttributes.forEach((metaAttribute) => { %>
        <%~ metaAttribute %>
      <% }); %>      
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="generator" content="Docusaurus v<%= it.version %>">
      <% if (it.noIndex) { %>
        <meta name="robots" content="noindex, nofollow" />
      <% } %>
      <% it.stylesheets.forEach((stylesheet) => { %>
        <link rel="stylesheet" href="<%= it.baseUrl %><%= stylesheet %>" />
      <% }); %>
      <% it.scripts.forEach((script) => { %>
        <link rel="preload" href="<%= it.baseUrl %><%= script %>" as="script">
      <% }); %>
    </head>
    <body <%~ it.bodyAttributes %>>
      <%~ it.preBodyTags %>
      <div id="__docusaurus">
        <%~ it.appHtml %>
      </div>
      <% it.scripts.forEach((script) => { %>
        <script src="<%= it.baseUrl %><%= script %>"></script>
      <% }); %>
      <%~ it.postBodyTags %>
    </body>
  </html>`,
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [math, plantuml],
          rehypePlugins: [katex],
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl:
            "https://github.com/StrataFoundation/strata/edit/master/packages/docs",
          ...(process.env.DOCS_ONLY ? { routeBasePath: "/" } : {}),
        },
        blog: process.env.DOCS_ONLY
          ? false
          : {
              blogSidebarTitle: "Posts",
              blogSidebarCount: "ALL",
              remarkPlugins: [math, plantuml],
              rehypePlugins: [katex],
              showReadingTime: true,
              // Please change this to your repo.
              editUrl:
                "https://github.com/StrataFoundation/strata/edit/master/packages/docs/blog",
              ...(process.env.BLOG_ONLY ? { routeBasePath: "/" } : {}),
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
        id: "marketplace",
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
        tsconfig: "../marketplace-ui/tsconfig-build.json",
        out: "api/marketplace-ui",
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
      googleAnalytics: {
        trackingID: process.env.GOOGLE_ANALYTICS,
        anonymizeIP: true,
      },
      gtag: {
        trackingID: process.env.GOOGLE_ANALYTICS,
        anonymizeIP: true,
      },
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
