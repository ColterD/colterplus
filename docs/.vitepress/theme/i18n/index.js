// .vitepress/theme/i18n/index.js
import { createI18n } from 'vue-i18n'
import messages from './messages'

export function createI18nInstance() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages,
    silentTranslationWarn: true,
    silentFallbackWarn: true,
    pluralizationRules: {
      /**
       * @param choice {number} a choice index given by the input to $tc: `$tc('path.to.rule', choiceIndex)`
       * @param choicesLength {number} an overall amount of available choices
       * @returns a final choice index to select plural word by
       */
      'ar': function(choice, choicesLength) {
        // Arabic has different plural rules
        if (choice === 0) return 0
        if (choice === 1) return 1
        if (choice === 2) return 2
        if (choice >= 3 && choice <= 10) return 3
        if (choice >= 11 && choice <= 99) return 4
        return 5
      }
    }
  })

  return i18n
}