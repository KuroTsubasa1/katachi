// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  nitro: {
    experimental: {
      websocket: true
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Katachi — Visual Workspace',
      short_name: 'Katachi',
      description: 'A visual workspace for organizing creative projects',
      theme_color: '#3B82F6',
      background_color: '#f5f5f5',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          // App navigations: serve from network, fall back to cache offline.
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'katachi-pages',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 32 }
          }
        },
        {
          // OpenStreetMap tiles: degrade gracefully offline.
          urlPattern: ({ url }) => url.host.includes('tile.openstreetmap.org'),
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'osm-tiles', expiration: { maxEntries: 200 } }
        }
      ]
    },
    devOptions: {
      enabled: false
    }
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Katachi - Visual Workspace',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'A visual workspace for organizing creative projects' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo-icon.svg' }
      ]
    }
  }
})
