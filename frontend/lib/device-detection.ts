/**
 * AIDA Platform - Device Detection and Compatibility Utils
 * Utilitários para detectar dispositivos, navegadores e recursos suportados
 */

// Tipos para detecção de dispositivos
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  browser: BrowserInfo;
  screen: ScreenInfo;
  features: FeatureSupport;
}

export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isIE: boolean;
  isOpera: boolean;
}

export interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  isRetina: boolean;
  colorDepth: number;
}

export interface FeatureSupport {
  touchSupport: boolean;
  webGL: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  webAssembly: boolean;
  css: {
    grid: boolean;
    flexbox: boolean;
    customProperties: boolean;
    containerQueries: boolean;
  };
  js: {
    es6: boolean;
    modules: boolean;
    asyncAwait: boolean;
  };
}

/**
 * Detecta informações do dispositivo atual
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return getServerSideDefaults();
  }

  const userAgent = navigator.userAgent;
  const screen = window.screen;
  
  return {
    isMobile: detectMobile(),
    isTablet: detectTablet(),
    isDesktop: detectDesktop(),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isWindows: /Windows/.test(userAgent),
    isMac: /Mac/.test(userAgent),
    isLinux: /Linux/.test(userAgent) && !/Android/.test(userAgent),
    browser: getBrowserInfo(),
    screen: getScreenInfo(),
    features: getFeatureSupport(),
  };
}

/**
 * Detecta se é um dispositivo móvel
 */
function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return (
    mobileRegex.test(userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window)
  );
}

/**
 * Detecta se é um tablet
 */
function detectTablet(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
  const isTabletSize = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  return isTabletUA || (isTabletSize && 'ontouchstart' in window);
}

/**
 * Detecta se é um desktop
 */
function detectDesktop(): boolean {
  if (typeof window === 'undefined') return true;
  
  return !detectMobile() && !detectTablet();
}

/**
 * Obtém informações do navegador
 */
function getBrowserInfo(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'Unknown',
      version: '0',
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
      isIE: false,
      isOpera: false,
    };
  }

  const userAgent = navigator.userAgent;
  
  // Detecta navegador e versão
  let name = 'Unknown';
  let version = '0';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '0';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '0';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || '0';
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
    version = userAgent.match(/Edg\/(\d+)/)?.[1] || '0';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    name = 'Internet Explorer';
    version = userAgent.match(/(?:MSIE |rv:)(\d+)/)?.[1] || '0';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    name = 'Opera';
    version = userAgent.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || '0';
  }
  
  return {
    name,
    version,
    isChrome: name === 'Chrome',
    isFirefox: name === 'Firefox',
    isSafari: name === 'Safari',
    isEdge: name === 'Edge',
    isIE: name === 'Internet Explorer',
    isOpera: name === 'Opera',
  };
}

/**
 * Obtém informações da tela
 */
function getScreenInfo(): ScreenInfo {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      pixelRatio: 1,
      orientation: 'landscape',
      isRetina: false,
      colorDepth: 24,
    };
  }

  const screen = window.screen;
  const pixelRatio = window.devicePixelRatio || 1;
  
  return {
    width: screen.width,
    height: screen.height,
    pixelRatio,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isRetina: pixelRatio >= 2,
    colorDepth: screen.colorDepth || 24,
  };
}

/**
 * Verifica suporte a recursos
 */
function getFeatureSupport(): FeatureSupport {
  if (typeof window === 'undefined') {
    return getServerSideFeatureDefaults();
  }

  return {
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    webGL: !!window.WebGLRenderingContext,
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,
    serviceWorker: 'serviceWorker' in navigator,
    webAssembly: typeof WebAssembly === 'object',
    css: {
      grid: CSS.supports('display', 'grid'),
      flexbox: CSS.supports('display', 'flex'),
      customProperties: CSS.supports('--custom', 'property'),
      containerQueries: CSS.supports('container-type', 'inline-size'),
    },
    js: {
      es6: typeof Symbol !== 'undefined',
      modules: 'noModule' in document.createElement('script'),
      asyncAwait: (function() {
        try {
          return (async () => {})().constructor === (async function(){}).constructor;
        } catch {
          return false;
        }
      })(),
    },
  };
}

/**
 * Defaults para server-side rendering
 */
function getServerSideDefaults(): DeviceInfo {
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isWindows: false,
    isMac: false,
    isLinux: false,
    browser: {
      name: 'Unknown',
      version: '0',
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
      isIE: false,
      isOpera: false,
    },
    screen: {
      width: 1920,
      height: 1080,
      pixelRatio: 1,
      orientation: 'landscape',
      isRetina: false,
      colorDepth: 24,
    },
    features: getServerSideFeatureDefaults(),
  };
}

function getServerSideFeatureDefaults(): FeatureSupport {
  return {
    touchSupport: false,
    webGL: true,
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    serviceWorker: true,
    webAssembly: true,
    css: {
      grid: true,
      flexbox: true,
      customProperties: true,
      containerQueries: true,
    },
    js: {
      es6: true,
      modules: true,
      asyncAwait: true,
    },
  };
}

/**
 * Hook para usar informações do dispositivo em componentes React
 */
export function useDeviceInfo() {
  if (typeof window === 'undefined') {
    return getServerSideDefaults();
  }

  return getDeviceInfo();
}

/**
 * Verifica se o navegador suporta uma feature específica
 */
export function supportsFeature(feature: keyof FeatureSupport | string): boolean {
  const features = getFeatureSupport();
  
  if (feature in features) {
    return features[feature as keyof FeatureSupport] as boolean;
  }
  
  // Para features CSS customizadas
  if (typeof window !== 'undefined' && feature.includes(':')) {
    const [property, value] = feature.split(':');
    return CSS.supports(property, value);
  }
  
  return false;
}

/**
 * Adiciona classes CSS baseadas no dispositivo ao elemento HTML
 */
export function addDeviceClasses() {
  if (typeof window === 'undefined') return;
  
  const deviceInfo = getDeviceInfo();
  const html = document.documentElement;
  
  // Remove classes existentes
  html.classList.remove(
    'mobile', 'tablet', 'desktop',
    'ios', 'android', 'windows', 'mac', 'linux',
    'chrome', 'firefox', 'safari', 'edge', 'ie', 'opera',
    'retina', 'touch', 'no-touch'
  );
  
  // Adiciona classes baseadas no dispositivo
  if (deviceInfo.isMobile) html.classList.add('mobile');
  if (deviceInfo.isTablet) html.classList.add('tablet');
  if (deviceInfo.isDesktop) html.classList.add('desktop');
  
  if (deviceInfo.isIOS) html.classList.add('ios');
  if (deviceInfo.isAndroid) html.classList.add('android');
  if (deviceInfo.isWindows) html.classList.add('windows');
  if (deviceInfo.isMac) html.classList.add('mac');
  if (deviceInfo.isLinux) html.classList.add('linux');
  
  if (deviceInfo.browser.isChrome) html.classList.add('chrome');
  if (deviceInfo.browser.isFirefox) html.classList.add('firefox');
  if (deviceInfo.browser.isSafari) html.classList.add('safari');
  if (deviceInfo.browser.isEdge) html.classList.add('edge');
  if (deviceInfo.browser.isIE) html.classList.add('ie');
  if (deviceInfo.browser.isOpera) html.classList.add('opera');
  
  if (deviceInfo.screen.isRetina) html.classList.add('retina');
  if (deviceInfo.features.touchSupport) {
    html.classList.add('touch');
  } else {
    html.classList.add('no-touch');
  }
}