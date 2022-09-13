// ==UserScript==
// @name         RateYourMusic - Visual Rating
// @namespace    rym-visual-rating
// @version      0.4
// @description  Adds a simple horizontal and visual rating bar on releases pages.
// @author       Kazaam
// @match        https://rateyourmusic.com/release/*
// @icon         https://www.google.com/s2/favicons?domain=rateyourmusic.com
// ==/UserScript==

type BarOptions = {
  animation?: boolean
  borderRadius?: number | false
  colors?: 'vibrant' | 'rainbow' | 'neon' | 'colorBlind'
  themeMode?: string | false
  height?: number
  shadow?: boolean
  style?: 'blend' | 'gradual'
}

type RGBColor = `rgb(${number}, ${number}, ${number})`
type ThemeColors = { [themeName: string]: `#${string}`[] }

const Themes: ThemeColors = {
  vibrant: ['#fa4146', '#fa961e', '#fac850', '#91be6e', '#55a569', '#4182a5'],
  rainbow: ['#ff0000', '#ff961e', '#ffff00', '#00cd00', '#aaaaff', '#6532ff', '#c800ff'],
  neon: ['#ff00d9', '#ffb400', '#96ff00', '#00ffc8', '#0082ff', '#b432ff'],
  colorBlind: ['#dc321e', '#ffb400', '#faff00', '#23fffa', '#28b4ff', '#2850ff'],
}

class VisualRatingBar {
  barOptions: BarOptions = {}

  constructor(options?: BarOptions) {
    this.barOptions.animation = options?.animation === undefined || options?.animation
    this.barOptions.borderRadius = options?.borderRadius || 6
    this.barOptions.colors = options?.colors || 'vibrant'
    this.barOptions.themeMode = this.getThemeMode() || false
    this.barOptions.height = options?.height || 20
    this.barOptions.shadow = options?.shadow === undefined || options?.shadow
    this.barOptions.style = options?.style || 'gradual'
  }

  getBackgroundColor = (): RGBColor => {
    const elementNode: Element = document.querySelector('.release_right_column')
    return window.getComputedStyle(elementNode).backgroundColor as RGBColor
  }

  getThemeMode = (): string | null => {
    const currentThemeMode = localStorage.getItem('theme')
    if (!['eve', 'night', 'light'].includes(currentThemeMode)) return
    return currentThemeMode
  }

  buildGradient = (): string => {
    const { colors, style } = this.barOptions

    const colorsCount = colors.length - 1
    const colorCodes = Themes[colors]
    const gradientStep: number = 100 / colorsCount

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
    const ratingNode: Element = document.querySelector('span.avg_rating')
    if (!ratingNode) return

    const { animation, height, borderRadius, themeMode: mode, shadow } = this.barOptions

    const rating: number = parseFloat(ratingNode.textContent.trim())
    const ratingPercentage: number = (rating * 100) / 5

    // Bar wrapper
    const barWrapper: HTMLDivElement = document.createElement('div')
    barWrapper.id = 'userscript-bar-wrapper'
    barWrapper.style.height = `${height}px`
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
    if (mode !== 'light') barGradient.style.filter = 'saturate(50%)'
    if (shadow) barGradient.style.boxShadow = '#0000009c 0px 0px 4px 0px inset'

    const ratingNodeParent = ratingNode.parentNode.parentNode
    ratingNodeParent.appendChild(barWrapper)
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
    document.querySelectorAll('div.header_theme_button')[1].addEventListener('click', () => {
      const themeMode = this.getThemeMode()
      barMask.style.backgroundColor = this.getBackgroundColor()
      barGradient.style.filter = `saturate(${themeMode === 'light' ? 100 : 50}%)`
    })

    console.log('[USERSCRIPT] RateYourMusic Visual Rating Bar added')
  }
}

new VisualRatingBar().init()
