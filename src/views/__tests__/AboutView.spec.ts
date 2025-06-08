import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from '../AboutView.vue'
import { createI18n } from 'vue-i18n'

// Mock the global build variables
vi.stubGlobal('__BUILD_TIME__', '2024-01-01T00:00:00.000Z')
vi.stubGlobal('__APP_VERSION__', 'abc1234')
vi.stubGlobal('__GIT_COMMIT_HASH__', 'abc1234567890abcdef1234567890abcdef123456')

// Mock window.open
const mockOpen = vi.fn()
vi.stubGlobal('open', mockOpen)

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      aboutView: {
        title: 'About This Application',
        subtitle: 'Swiss Financial Data Explorer',
        description: 'This application allows you to explore and analyze Swiss financial data.',
        features: {
          title: 'Key Features',
          treeNavigation: 'Hierarchical tree navigation',
          tableView: 'Interactive table view',
          dataBrowser: 'Comprehensive data browser',
          multiLanguage: 'Multi-language support',
          responsive: 'Responsive design',
        },
        dataInfo: {
          title: 'Data Information',
          description: 'Official Swiss financial data from municipalities and cantons.',
          sources: 'Data sources: Federal Finance Administration',
          coverage: 'Coverage: 2015-2023, all Swiss municipalities',
        },
        technology: {
          title: 'Technology',
          description: 'Built with modern web technologies.',
          frontend: 'Frontend: Vue 3, TypeScript, PrimeVue',
          testing: 'Testing: Vitest, Vue Test Utils',
          build: 'Build: Vite, ESLint',
        },
        buildInfo: {
          title: 'Build Information',
          buildTime: 'Built on',
          commit: 'Commit',
          fullCommit: 'Full commit hash',
        },
        repository: {
          title: 'Source Code',
          description: 'This project is open source and available on GitHub.',
          viewOnGitHub: 'View on GitHub',
          contribute: 'Contribute',
        },
      },
    },
  },
})

describe('AboutView', () => {
  it('renders the main title correctly', () => {
    const wrapper = mount(AboutView, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('h1').text()).toBe('About This Application')
  })

  it('displays build information correctly', () => {
    const wrapper = mount(AboutView, {
      global: {
        plugins: [i18n],
      },
    })

    const buildTimeText = wrapper.text()
    expect(buildTimeText).toContain('Built on')
    expect(buildTimeText).toContain('Commit')
    expect(buildTimeText).toContain('abc1234')
  })

  it('renders all main sections', () => {
    const wrapper = mount(AboutView, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.text()).toContain('Data Information')
    expect(wrapper.text()).toContain('Technology')
    expect(wrapper.text()).toContain('Build Information')
    expect(wrapper.text()).toContain('Source Code')
    expect(wrapper.text()).toContain('Vue 3, TypeScript, PrimeVue')
  })

  it('opens GitHub repository when button is clicked', async () => {
    const wrapper = mount(AboutView, {
      global: {
        plugins: [i18n],
      },
    })

    // Find all buttons and get the GitHub one (should be the second button in the repository section)
    const buttons = wrapper.findAll('button')
    // The Federal Finance Admin button is first, GitHub buttons are second and third
    const githubButton = buttons[1] // "View on GitHub" button
    await githubButton.trigger('click')

    expect(mockOpen).toHaveBeenCalledWith(
      'https://github.com/gitu/gdn_ktn_bund',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('has proper test marker for e2e tests', () => {
    const wrapper = mount(AboutView, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('[data-testid="about-main"]').exists()).toBe(true)
  })
})
