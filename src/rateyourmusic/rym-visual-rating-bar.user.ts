// ==UserScript==
// @name         RateYourMusic - Visual Rating Bar
// @namespace    rym-visual-rating-bar
// @version      0.4
// @description  Adds a visual rating bar on releases pages.
// @author       ewauq
// @updateURL    https://raw.githubusercontent.com/ewauq/userscripts/main/dist/rym-visual-rating-bar.user.js
// @downloadURL  https://raw.githubusercontent.com/ewauq/userscripts/main/dist/rym-visual-rating-bar.user.js
// @supportURL   https://github.com/ewauq/userscripts/issues
// @match        https://rateyourmusic.com/release/*
// @icon         https://www.google.com/s2/favicons?domain=rateyourmusic.com
// ==/UserScript==

type BarOptions = {
  animation: boolean
  borderRadius: number | false
  colors: 'vibrant' | 'rainbow' | 'neon' | 'colorBlind'
  themeMode: string | false
  height: number
  shadow: boolean
  style: 'blend' | 'gradual'
}

type RGBColor = `rgb(${number}, ${number}, ${number})`
type ThemeColors = { [themeName: string]: `#${string}`[] }

const Themes: ThemeColors = {
  vibrant: ['#fa4146', '#fa961e', '#fac850', '#91be6e', '#55a569', '#4182a5'],
  rainbow: ['#ff0000', '#ff961e', '#ffff00', '#00cd00', '#aaaaff', '#6532ff', '#c800ff'],
  neon: ['#ff00d9', '#ffb400', '#96ff00', '#00ffc8', '#0082ff', '#b432ff'],
  colorBlind: ['#dc321e', '#ffb400', '#faff00', '#23fffa', '#28b4ff', '#2850ff'],
}

class OptionsMenu {
  build(): HTMLDivElement {
    document.body.style.overflow = 'hidden'

    const optionsMenuOverlay = document.createElement('div')
    optionsMenuOverlay.style.width = '100%'
    optionsMenuOverlay.style.height = '100%'
    optionsMenuOverlay.style.zIndex = '1010'
    optionsMenuOverlay.style.top = '0'
    optionsMenuOverlay.style.left = '0'
    optionsMenuOverlay.style.position = 'fixed'
    optionsMenuOverlay.style.display = 'flex'
    optionsMenuOverlay.style.justifyContent = 'center'
    optionsMenuOverlay.style.fontFamily = 'Roboto, Helvetica, Arial, sans-serif'
    optionsMenuOverlay.style.fontSize = '16px'
    optionsMenuOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'

    const optionsMenuContainer = document.createElement('div')
    optionsMenuContainer.style.width = '50%'
    optionsMenuContainer.style.margin = 'auto'
    optionsMenuContainer.style.padding = '20px'
    optionsMenuContainer.style.zIndex = '1020'
    optionsMenuContainer.style.backgroundColor = '#FFFFFF'
    optionsMenuContainer.style.borderRadius = '6px'
    optionsMenuContainer.style.outline = '6px solid rgba(0,0,0,0.3)'

    const optionsMenuSectionTitle = document.createElement('h2')
    optionsMenuSectionTitle.style.fontSize = '20px'
    optionsMenuSectionTitle.style.fontWeight = 'bold'
    optionsMenuSectionTitle.innerHTML = 'Options'

    optionsMenuContainer.appendChild(optionsMenuSectionTitle)

    const headerNode = document.getElementById('page_header')
    const pageWrapper = document.getElementById('content_wrapper_outer')

    if (headerNode) headerNode.style.filter = 'blur(3px)'
    if (pageWrapper) pageWrapper.style.filter = 'blur(3px)'

    optionsMenuOverlay.appendChild(optionsMenuContainer)

    return optionsMenuOverlay
  }
}

class VisualRatingBar {
  // Default values
  barOptions: BarOptions = {
    animation: true,
    borderRadius: 6,
    colors: 'vibrant',
    themeMode: false,
    height: 20,
    shadow: true,
    style: 'gradual',
  }

  constructor(options?: BarOptions) {
    const { animation, borderRadius, colors, themeMode, height, shadow, style } = this.barOptions

    this.barOptions.animation = options?.animation == undefined ? animation : options?.animation
    this.barOptions.borderRadius = options?.borderRadius || borderRadius
    this.barOptions.colors = options?.colors || colors
    this.barOptions.themeMode = this.getThemeMode() || themeMode
    this.barOptions.height = options?.height || height
    this.barOptions.shadow = options?.shadow == undefined ? shadow : options?.shadow
    this.barOptions.style = options?.style || style
  }

  getBackgroundColor = (): RGBColor => {
    const elementNode: Element | null = document.querySelector('.release_right_column')
    if (!elementNode) throw new Error("Can't find the .release_right_column element")
    return window.getComputedStyle(elementNode).backgroundColor as RGBColor
  }

  getThemeMode = (): string | null => {
    const currentThemeMode = localStorage.getItem('theme')
    if (!currentThemeMode) return null
    if (!['eve', 'night', 'light'].includes(currentThemeMode)) return null
    return currentThemeMode
  }

  buildGradient = (): string => {
    const { colors, style } = this.barOptions

    const colorsCount = colors.length - 1
    const colorCodes = Themes[colors]
    const gradientStep = 100 / colorsCount

    const cssValues: string[] = []
    let currentStep = 0

    colorCodes.forEach((color, index) => {
      cssValues.push(`${color} ${currentStep}%`)

      if (style === 'gradual' && index + 1 < colorsCount) {
        cssValues.push(`${color} ${currentStep + gradientStep}%`)
      }

      // Needed to prevent artifacts from elements superposition with a border radius
      if (index + 1 == colorsCount) {
        cssValues.push(`${color} 98%`)
        cssValues.push('transparent 98%')
        cssValues.push('transparent 100%')
      }

      currentStep += gradientStep
    })

    return cssValues.join(', ')
  }

  init(): void {
    const ratingNode = document.querySelector('span.avg_rating')
    if (!ratingNode) return

    const { animation, height, borderRadius, themeMode, shadow } = this.barOptions

    const ratingText = ratingNode?.textContent

    if (!ratingText) throw new Error("Can't retieve the rating text of element span.avg_rating")

    const rating = parseFloat(ratingText.trim())
    const ratingPercentage = (rating * 100) / 5

    // Bar wrapper
    const barWrapper: HTMLDivElement = document.createElement('div')
    barWrapper.id = 'userscript-bar-wrapper'
    barWrapper.style.height = `${height}px`
    barWrapper.style.cursor = 'pointer'
    barWrapper.style.position = 'relative'
    barWrapper.style.marginTop = '6px'
    barWrapper.title = `${rating}/5 (${ratingPercentage}%)`

    // Bar mask
    const barMask = document.createElement('div')
    barMask.style.width = animation ? '90%' : `${100 - ratingPercentage}%`
    barMask.style.height = '100%'
    barMask.style.backgroundColor = this.getBackgroundColor()
    barMask.style.marginTop = `-${height}px`
    barMask.style.right = '0'
    barMask.style.position = 'absolute'
    barMask.style.filter = 'contrast(90%)'
    if (animation) barMask.style.transition = 'width 500ms cubic-bezier(0.250, 0.460, 0.450, 0.940)'
    if (borderRadius) barMask.style.borderTopRightRadius = `${borderRadius}px`
    if (borderRadius) barMask.style.borderBottomRightRadius = `${borderRadius}px`
    if (shadow) barMask.style.boxShadow = '#00000063 0px 0px 3px 0px inset'

    // Bar gradient
    const barGradient: HTMLDivElement = document.createElement('div')
    barGradient.style.height = '100%'
    barGradient.style.background = `linear-gradient(90deg, ${this.buildGradient()})`
    if (borderRadius) barGradient.style.borderRadius = `${borderRadius}px`
    if (themeMode !== 'light') barGradient.style.filter = 'saturate(50%)'
    if (shadow) barGradient.style.boxShadow = '#0000009c 0px 0px 4px 0px inset'

    const ratingNodeParent = ratingNode?.parentNode?.parentNode
    ratingNodeParent?.appendChild(barWrapper)
    barWrapper.appendChild(barGradient)
    barWrapper.appendChild(barMask)

    // Bar animation
    const waitingBarVisiblility = window.setInterval(function () {
      const barWrapperNode = document.getElementById('userscript-bar-wrapper')
      if (barWrapperNode) {
        barMask.style.width = `${100 - ratingPercentage}%`
        window.clearInterval(waitingBarVisiblility)
      }
    }, 50)

    // Handling RYM theme mode switching
    document.querySelectorAll('div.header_theme_button')[1]?.addEventListener('click', () => {
      const themeMode = this.getThemeMode()
      barMask.style.backgroundColor = this.getBackgroundColor()
      barGradient.style.filter = `saturate(${themeMode === 'light' ? 100 : 50}%)`
    })

    // Options menu
    document.getElementById('userscript-bar-wrapper')?.addEventListener('click', () => {
      alert('hello ici!!!')
    })

    const optionsMenu = new OptionsMenu()
    document.body.appendChild(optionsMenu.build())

    console.log('[USERSCRIPT] RateYourMusic Visual Rating Bar added')
  }
}

new VisualRatingBar().init()
