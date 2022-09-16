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

type ThemeName = 'vibrant' | 'rainbow' | 'neon' | 'colorBlind'
type ThemeStyleName = 'blend' | 'gradual'

type BarOptions = {
  animation: boolean
  borderRadius: number | false
  theme: ThemeName
  height: number
  shadow: boolean
  style: ThemeStyleName
}

type OptionsElements = {
  type: 'number' | 'checkbox' | 'select'
  name: string
  label: string
  default: number | string | boolean
  min?: number
  max?: number
  options?: string[]
}

type RGBColor = `rgb(${number}, ${number}, ${number})`
type ThemeColors = { [themeName: string]: `#${string}`[] }

const Themes: ThemeColors = {
  vibrant: ['#fa4146', '#fa961e', '#fac850', '#91be6e', '#55a569', '#4182a5'],
  rainbow: ['#ff0000', '#ff961e', '#ffff00', '#00cd00', '#aaaaff', '#6532ff', '#c800ff'],
  neon: ['#ff00d9', '#ffb400', '#96ff00', '#00ffc8', '#0082ff', '#b432ff'],
  colorBlind: ['#dc321e', '#ffb400', '#faff00', '#23fffa', '#28b4ff', '#2850ff'],
}

const getStoredValue = (name: string): string | undefined => {
  const storedValue = localStorage.getItem(name)

  if (!storedValue) return
  return storedValue
}

const setStoredValue = (name: string, value: string | number | boolean): void => {
  localStorage.setItem(name, String(value))
}

class OptionsMenu {
  show() {
    const optionsMenuOverlayNode = document.getElementById('userscript-options-menu')
    const headerNode = document.getElementById('page_header')
    const pageWrapper = document.getElementById('content_wrapper_outer')

    if (optionsMenuOverlayNode) optionsMenuOverlayNode.style.display = 'flex'
    if (headerNode) headerNode.style.filter = 'blur(3px)'
    if (pageWrapper) pageWrapper.style.filter = 'blur(3px)'
  }

  hide() {
    const optionsMenuOverlayNode = document.getElementById('userscript-options-menu')
    const headerNode = document.getElementById('page_header')
    const pageWrapper = document.getElementById('content_wrapper_outer')
    if (optionsMenuOverlayNode) optionsMenuOverlayNode.style.display = 'none'
    if (headerNode) headerNode.style.filter = 'none'
    if (pageWrapper) pageWrapper.style.filter = 'none'

    location.reload()
  }

  build(): HTMLDivElement {
    document.body.style.overflow = 'hidden'

    const optionsMenuOverlay = document.createElement('div')
    optionsMenuOverlay.id = 'userscript-options-menu'
    optionsMenuOverlay.style.width = '100%'
    optionsMenuOverlay.style.height = '100%'
    optionsMenuOverlay.style.zIndex = '1010'
    optionsMenuOverlay.style.top = '0'
    optionsMenuOverlay.style.left = '0'
    optionsMenuOverlay.style.position = 'fixed'
    optionsMenuOverlay.style.display = 'none'
    optionsMenuOverlay.style.justifyContent = 'center'
    optionsMenuOverlay.style.fontFamily = 'Roboto, Helvetica, Arial, sans-serif'
    optionsMenuOverlay.style.fontSize = '16px'
    optionsMenuOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'

    const optionsMenuContainer = document.createElement('div')
    optionsMenuContainer.style.width = '450px'
    optionsMenuContainer.style.margin = '300px auto auto auto'
    optionsMenuContainer.style.padding = '20px'
    optionsMenuContainer.style.zIndex = '1020'
    optionsMenuContainer.style.backgroundColor = '#FFFFFF'
    optionsMenuContainer.style.borderRadius = '6px'
    optionsMenuContainer.style.outline = '6px solid rgba(0,0,0,0.3)'

    const optionsMenuSectionTitle = document.createElement('h2')
    optionsMenuSectionTitle.style.fontSize = '20px'
    optionsMenuSectionTitle.style.marginBottom = '10px'
    optionsMenuSectionTitle.style.fontWeight = 'bold'
    optionsMenuSectionTitle.innerHTML = 'Options'

    const optionsElements: OptionsElements[] = [
      {
        type: 'checkbox',
        name: 'animation-option',
        label: 'Animate the bar on display',
        default: true,
      },
      {
        type: 'select',
        name: 'theme-option',
        options: Object.keys(Themes),
        label: 'Color theme',
        default: 'vibrant',
      },
      {
        type: 'select',
        name: 'color-style-option',
        options: ['gradual', 'blend'],
        label: 'Color mode',
        default: 'gradual',
      },
      { type: 'number', name: 'height-option', min: 0, max: 100, label: 'Bar height', default: 20 },
      {
        type: 'number',
        name: 'border-radius-option',
        min: 0,
        label: 'Bar border radius',
        default: 6,
      },
      {
        type: 'checkbox',
        name: 'shadow-option',
        label: 'Display a shadow on the bar',
        default: true,
      },
    ]

    optionsMenuContainer.appendChild(optionsMenuSectionTitle)

    const optionsElementsWrapper = document.createElement('div')
    optionsElementsWrapper.style.display = 'flex'
    optionsElementsWrapper.style.flexDirection = 'column'
    optionsMenuContainer.appendChild(optionsElementsWrapper)

    let input: HTMLInputElement | HTMLSelectElement

    optionsElements.forEach((element) => {
      let storedValue = getStoredValue(element.name)
      if (!storedValue) {
        setStoredValue(element.name, element.default)
        storedValue = String(element.default)
      }

      if (element.type == 'checkbox') {
        const label = document.createElement('label')
        label.style.fontWeight = 'normal'
        label.style.padding = '10px 0px'
        label.htmlFor = element.name
        label.innerHTML = element.label

        input = document.createElement('input')
        input.type = 'checkbox'
        input.id = element.name
        input.checked = storedValue === 'true'
        input.style.marginRight = '10px'
        input.style.height = '14px'
        input.style.width = '14x'

        optionsElementsWrapper.appendChild(label)
        label.prepend(input)

        input.addEventListener('change', (event) => {
          const target = <HTMLInputElement>event.target
          localStorage.setItem(element.name, String(target.checked))
        })
      } else if (element.type == 'number') {
        const label = document.createElement('label')
        label.style.fontWeight = 'normal'
        label.style.padding = '10px 0px'
        label.htmlFor = element.name
        label.innerHTML = element.label

        input = document.createElement('input')
        input.type = 'number'
        input.min = String(element.min)
        input.max = String(element.max)
        input.id = element.name
        input.value = storedValue
        input.style.marginLeft = '10px'
        input.style.width = '50px'

        optionsElementsWrapper.appendChild(label)
        label.appendChild(input)

        input.addEventListener('change', (event) => {
          const target = <HTMLInputElement>event.target
          localStorage.setItem(element.name, target.value)
        })
      } else if (element.type == 'select') {
        const label = document.createElement('label')
        label.style.fontWeight = 'normal'
        label.style.padding = '10px 0px'
        label.htmlFor = element.name
        label.innerHTML = element.label

        input = document.createElement('select')
        input.id = element.name
        input.style.marginLeft = '10px'

        element.options?.forEach((option) => {
          const selectOption = document.createElement('option')
          selectOption.value = option
          selectOption.innerHTML = option
          if (option == storedValue) selectOption.defaultSelected = true
          input.appendChild(selectOption)
        })

        optionsElementsWrapper.appendChild(label)
        label.appendChild(input)

        input.addEventListener('change', (event) => {
          const target = <HTMLSelectElement>event.target
          localStorage.setItem(element.name, target.value)
        })
      }

      optionsMenuOverlay.addEventListener('click', (event) => {
        const target = <HTMLDivElement>event.target
        if (target.id === 'userscript-options-menu') this.hide()
      })

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.hide()
      })
    })

    const footerInformation = document.createElement('div')
    footerInformation.style.color = 'gray'
    footerInformation.style.fontSize = '13px'
    footerInformation.style.marginTop = '16px'
    footerInformation.innerHTML = `Your settings are automatically saved in your browser local storage.
    <br/>
    Press ESC or click out the window to close it and reload the page.`

    optionsMenuOverlay.appendChild(optionsMenuContainer)
    optionsMenuContainer.appendChild(footerInformation)

    return optionsMenuOverlay
  }
}

class VisualRatingBar {
  // Default values
  barOptions: BarOptions = {
    animation: true,
    borderRadius: 6,
    theme: 'vibrant',
    height: 20,
    shadow: true,
    style: 'gradual',
  }

  constructor() {
    // Parsing options values
    const animationValue = getStoredValue('animation-option')
    if (animationValue !== undefined) this.barOptions.animation = animationValue === 'true'

    const borderRadiusValue = getStoredValue('border-radius-option')
    if (borderRadiusValue === 'false') {
      this.barOptions.borderRadius = 0
    } else if (borderRadiusValue !== undefined) {
      this.barOptions.borderRadius = parseInt(borderRadiusValue)
    }

    const themeValue = getStoredValue('theme-option')
    if (themeValue !== undefined && Object.keys(Themes).includes(themeValue)) {
      this.barOptions.theme = themeValue as ThemeName
    }

    const styleValue = getStoredValue('color-style-option')
    if (styleValue !== undefined) this.barOptions.style = styleValue as ThemeStyleName

    const heightOption = getStoredValue('height-option')
    if (heightOption !== undefined) this.barOptions.height = parseInt(heightOption)

    const shadowValue = getStoredValue('shadow-option')
    if (shadowValue !== undefined) this.barOptions.shadow = shadowValue === 'true'
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
    const { theme, style } = this.barOptions
    const colorsCount = Themes[theme].length
    const colorCodes = Themes[theme]

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

    const { animation, height, borderRadius, shadow } = this.barOptions

    const ratingText = ratingNode?.textContent

    if (!ratingText) throw new Error("Can't retieve the rating text of element span.avg_rating")

    const rymThemeMode = this.getThemeMode()

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
    if (rymThemeMode !== 'light') barGradient.style.filter = 'saturate(50%)'
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
    const optionsMenu = new OptionsMenu()
    document.body.appendChild(optionsMenu.build())

    document.getElementById('userscript-bar-wrapper')?.addEventListener('click', () => {
      optionsMenu.show()
    })

    console.log('[USERSCRIPT] RateYourMusic Visual Rating Bar added')
  }
}

const visualRatingBar = new VisualRatingBar()
visualRatingBar.init()
