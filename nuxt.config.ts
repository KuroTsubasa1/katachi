// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    config: {
      darkMode: 'class'
    }
  },

  app: {
    head: {
      title: 'Katachi - Visual Workspace',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A visual workspace for organizing creative projects' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo-icon.svg' }
      ]
    }
  }
})
