// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const math = require('remark-math');
const katex = require('rehype-katex');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const plantuml = require("@akebifiky/remark-simple-plantuml");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Strata Protocol',
  tagline: 'Launch a token around a person, idea, or collective in minutes',
  url: 'https://strataprotocol.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'StrataFoundation', // Usually your GitHub org/user name.
  projectName: 'strata', // Usually your repo name.
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [math, plantuml],
          rehypePlugins: [katex],
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/StrataFoundation/strata/edit/master/packages/docs',
        },
        blog: {
          remarkPlugins: [math, plantuml],
          rehypePlugins: [katex],
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/StrataFoundation/strata/edit/master/packages/docs/blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    "./src/plugins/webpack-loader",
    [
      'docusaurus-plugin-typedoc',

      // Plugin / TypeDoc options
      {
        id: 'bonding',
        entryPoints: ['../spl-token-bonding/src/index.ts'],
        tsconfig: '../spl-token-bonding/tsconfig.json',
        out: 'api/spl-token-bonding'
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      // Plugin / TypeDoc options
      {
        id: 'collective',
        entryPoints: ['../spl-token-collective/src/index.ts'],
        tsconfig: '../spl-token-collective/tsconfig.json',
        out: 'api/spl-token-collective'
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      // Plugin / TypeDoc options
      {
        id: 'react',
        entryPoints: ['../react/src/index.ts'],
        tsconfig: '../react/tsconfig.json',
        out: 'api/react'
      },
    ]
  ],
  stylesheets: [
    {
      href: "https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css",
      integrity: "sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc",
      crossorigin: "anonymous",
    }
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      liveCodeBlock: {
        /**
         * The position of the live playground, above or under the editor
         * Possible values: "top" | "bottom"
         */
        playgroundPosition: 'bottom',
      },
      navbar: {
        title: 'Strata',
        logo: {
          alt: 'Strata Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'getting_started',
            position: 'left',
            label: 'Docs',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/StrataFoundation/strata',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/getting_started',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/XQhCFg77WM',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/StrataProtocol',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/StrataFoundation/strata',
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
