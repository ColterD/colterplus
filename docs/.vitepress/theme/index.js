import DefaultTheme from 'vitepress/theme'
import Search from './components/Search.vue'
import TableOfContents from './components/TableOfContents.vue'
import PageTransition from './components/PageTransition.vue'
import PageSkeleton from './components/PageSkeleton.vue'
import AnimatedCard from './components/AnimatedCard.vue'
import FloatingActions from './components/FloatingActions.vue'
import NotificationSystem from './components/NotificationSystem.vue'
import ImageLightbox from './components/ImageLightbox.vue'
import CodeBlock from './components/CodeBlock.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import ThemeCustomizer from './components/ThemeCustomizer.vue'
import ContentSuggestions from './components/ContentSuggestions.vue'
import ContentEngagement from './components/ContentEngagement.vue'
import SearchAnalytics from './components/SearchAnalytics.vue'
import LearningProgress from './components/LearningProgress.vue'
import AnalyticsDashboard from './components/AnalyticsDashboard.vue'
import UserPreferences from './components/UserPreferences.vue'
import PDFExporter from './components/PDFExporter.vue'
import ContentEmbed from './components/ContentEmbed.vue'
import ContentVersion from './components/ContentVersion.vue'
import { createI18nInstance } from './i18n'
import LanguageSwitch from './components/LanguageSwitch.vue'
import './custom.css'
import NProgress from 'nprogress'
import { useRouter } from 'vitepress'
import { onMounted, defineComponent, ref } from 'vue'
import SocialInteraction from './components/SocialInteraction.vue'
import MediaGallery from './components/MediaGallery.vue'
import DataExplorer from './components/DataExplorer.vue'
import ContentWizard from './components/ContentWizard.vue'
import CommentSystem from './components/CommentSystem.vue'
import SearchExplorer from './components/SearchExplorer.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import FeedbackWidget from './components/FeedbackWidget.vue'
import CodePlayground from './components/CodePlayground.vue'

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
    app.component('Search', Search)
    app.component('TableOfContents', TableOfContents)
    app.component('PageTransition', PageTransition)
    app.component('PageSkeleton', PageSkeleton)
    app.component('AnimatedCard', AnimatedCard)
    app.component('FloatingActions', FloatingActions)
    app.component('NotificationSystem', NotificationSystem)
    app.component('ImageLightbox', ImageLightbox)
    app.component('CodeBlock', CodeBlock)
    app.component('ReadingProgress', ReadingProgress)
    app.component('ThemeCustomizer', ThemeCustomizer)
    app.component('ContentSuggestions', ContentSuggestions)
    app.component('ContentEngagement', ContentEngagement)
    app.component('SearchAnalytics', SearchAnalytics)
    app.component('LearningProgress', LearningProgress)
    app.component('AnalyticsDashboard', AnalyticsDashboard)
    app.component('apexchart', VueApexCharts)
    app.component('UserPreferences', UserPreferences)
    app.component('PDFExporter', PDFExporter)
    app.component('ContentEmbed', ContentEmbed)
    app.component('ContentVersion', ContentVersion)
    const i18n = createI18nInstance()
    app.use(i18n)
    app.component('LanguageSwitch', LanguageSwitch)
    app.component('SocialInteraction', SocialInteraction)
    app.component('MediaGallery', MediaGallery)
    app.component('DataExplorer', DataExplorer)
    app.component('ContentWizard', ContentWizard)
    app.component('CommentSystem', CommentSystem)
    app.component('SearchExplorer', SearchExplorer)
    app.component('NotificationCenter', NotificationCenter)
    app.component('FeedbackWidget', FeedbackWidget)
    app.component('CodePlayground', CodePlayground)
    
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