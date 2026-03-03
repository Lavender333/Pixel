declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

const analyticsReady = (): boolean => typeof window !== 'undefined' && typeof window.gtag === 'function';

export const initAnalytics = (): boolean => {
  if (initialized) return true;
  if (!analyticsReady()) return false;

  initialized = true;
  return true;
};

export const trackPageView = (path?: string) => {
  if (!analyticsReady()) return;
  window.gtag?.('event', 'page_view', {
    page_path: path ?? `${window.location.pathname}${window.location.search}${window.location.hash}`,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const trackEvent = (eventName: string, params: Record<string, string | number | boolean> = {}) => {
  if (!analyticsReady()) return;
  window.gtag?.('event', eventName, params);
};

export {};