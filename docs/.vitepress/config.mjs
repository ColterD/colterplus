import { defineConfig } from 'vitepress'
import { execSync } from 'child_process'

const feedback = 'Made with ❤ and <a href="https://vitepress.dev/" target="_blank">VitePress</a>'
const isGitRepo = (() => {
  try {
    execSync('git rev-parse --git-dir')
    return true
  } catch {
    return false
  }
})()

const footerConfig = isGitRepo
  ? {
      message: `${feedback} (rev: ${execSync('git rev-parse --short HEAD').toString().trim()})`,
      copyright: `© ${new Date().getFullYear()}, <a href="/">Estd 2023</a>`
    }
  : {
      message: feedback,
      copyright: `© ${new Date().getFullYear()} ColterPlus`
    }

export default defineConfig({
  title: "C+",
  description: "My Digital Universe - Curated",
  appearance: {
    toggle: false,
    preference: 'dark'
  },
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.ico' }],
    ['link', { rel: 'dns-prefetch', href: 'https://github.com' }],
    ['link', { rel: 'preconnect', href: 'https://github.com' }],
    ['link', { 
      rel: 'preconnect', 
      href: 'https://fonts.googleapis.com',
      crossorigin: 'anonymous'
    }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'theme-color', content: '#1a1a1a' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'author', content: 'ColterPlus' }],
    ['meta', { name: 'keywords', content: 'blog, tech, resources, projects, ColterPlus' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { property: 'og:title', content: 'ColterPlus' }],
    ['meta', { property: 'og:description', content: 'Personal blog and resource collection' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'preload', href: '/logo.png', as: 'image' }],
    ['link', { rel: 'preload', href: '/og-image.png', as: 'image' }],
  ],

  markdown: {
    lineNumbers: true,
    headers: {
      level: [0, 2]
    }
  },

  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vitepress']
        }
      }
    }
  },

  themeConfig: {
    logo: {
      light: '/logo.png',
      dark: '/logo.png',
      alt: 'ColterPlus'
    },

    nav: [
      { text: '🏠 <span style="color: #7bc5e4">Home</span>', link: '/' },
      { text: '✍️ Blog', link: '/blog/' },
      { text: '🛠️ Projects', link: '/projects/' },
      { text: '📚 Resources', link: '/resources/' }
    ],

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, tags: 1 }
          }
        },
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search documentation'
          },
          modal: {
            noResultsText: 'No results found',
            resetButtonTitle: 'Reset search',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate'
            }
          }
        }
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/colterplus' }
    ],

    footer: footerConfig,

    outline: {
      level: 'deep',
      label: 'On this page'
    },

    editLink: {
      pattern: 'https://github.com/colterplus/docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})