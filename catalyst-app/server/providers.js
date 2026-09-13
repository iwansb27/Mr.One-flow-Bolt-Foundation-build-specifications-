import { config } from './config.js';

export function detectMarketplace(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('shopee')) return 'SHOPEE';
    if (host.includes('tokopedia')) return 'TOKOPEDIA';
    if (host.includes('lazada')) return 'LAZADA';
    return 'UNKNOWN';
  } catch {
    return 'INVALID';
  }
}

export function providerStatus() {
  return {
    defaults: {
      ai: config.aiProvider,
      database: config.databaseProvider,
      storage: config.storageProvider,
      publish: config.publishProvider
    },
    byok: {
      openRouter: Boolean(config.openRouter.key),
      buffer: Boolean(config.buffer.token),
      marketplaceIds: {
        shopee: Boolean(config.marketplace.shopeeId),
        tokopedia: Boolean(config.marketplace.tokopediaId),
        lazada: Boolean(config.marketplace.lazadaId)
      }
    }
  };
}

export function localMetadataFallback({ contentType, marketplace }) {
  const labels = {
    INSPIRATION: 'Inspirasi',
    MOTIVATION: 'Motivasi',
    'VIRAL NEWS INDONESIA': 'Viral News Indonesia',
    CUSTOM: 'Custom Content'
  };
  const category = labels[contentType] || 'Custom Content';
  const suffix = marketplace && marketplace !== 'UNKNOWN' ? ` • ${marketplace}` : '';
  return {
    title: `${category}${suffix}`,
    category,
    description: 'Metadata awal dibuat dari tipe konten. Lengkapi atau regenerasi setelah analisis video tersedia.',
    facts: [],
    source: 'zoho-default-fallback'
  };
}
