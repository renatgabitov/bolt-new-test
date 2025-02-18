interface GTMDataLayer {
  event: string;
  [key: string]: any;
}

declare global {
  interface Window {
    dataLayer: GTMDataLayer[];
  }
}

export const initGTM = () => {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
};

export const pushToDataLayer = (data: GTMDataLayer) => {
  if (window.dataLayer) {
    window.dataLayer.push(data);
    logger.debug('GTM Event pushed', data);
  } else {
    logger.warn('GTM dataLayer not initialized');
  }
};