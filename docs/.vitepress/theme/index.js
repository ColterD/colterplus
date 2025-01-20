import DefaultTheme from 'vitepress/theme'
import './custom.css'
import NProgress from 'nprogress'
import { useRouter } from 'vitepress'
import { onMounted, defineComponent, ref } from 'vue'

// Error Boundary Component
const ErrorBoundary = defineComponent({
  name: 'ErrorBoundary',
  methods: {
    handleError(err) {
      console.error('VitePress error:', err)
    }
  },
  template: '<slot />'
})

// Back to Top Component
const BackToTop = defineComponent({
  name: 'BackToTop',
  setup() {
    const show = ref(false)

    onMounted(() => {
      window.addEventListener('scroll', () => {
        show.value = window.pageYOffset > 300
      })
    })

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return {
      show,
      scrollToTop
    }
  },
  template: `
    <button
      class="back-to-top"
      :class="{ visible: show }"
      @click="scrollToTop"
      aria-label="Back to top"
    >
      ↑
    </button>
  `
})

// Handle image loading
const handleImageLoading = () => {
  const images = document.querySelectorAll('img')
  images.forEach(img => {
    if (img.complete) {
      img.classList.add('loaded')
    } else {
      img.addEventListener('load', () => {
        img.classList.add('loaded')
      })
    }
  })
}

// Enhanced error handling
const handleErrors = () => {
  window.addEventListener('unhandledrejection', event => {
    console.error('Failed to load resource:', event.reason)
  })

  window.addEventListener('error', event => {
    console.error('Error occurred:', event.error)
  })
}

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('ErrorBoundary', ErrorBoundary)
    app.component('BackToTop', BackToTop)

    // Global error handler
    app.config.errorHandler = (error, instance, info) => {
      console.error('Vue error:', { error, instance, info })
    }
  },
  setup() {
    const router = useRouter()

    onMounted(() => {
      // Progress bar
      router.onBeforeRouteChange = () => {
        requestAnimationFrame(() => {
          NProgress.start()
          document.body.classList.add('loading')
        })
      }
      router.onAfterRouteChanged = () => {
        requestAnimationFrame(() => {
          NProgress.done()
          document.body.classList.remove('loading')
          handleImageLoading() // Initialize image loading effects after route change
        })
      }

      // Initial handlers
      handleImageLoading()
      handleErrors()
    })
  }
}