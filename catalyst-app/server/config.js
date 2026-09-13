export const config = {
  mode: process.env.MR_ONE_MODE || 'zoho-first',
  aiProvider: process.env.AI_PROVIDER || 'zoho',
  publishProvider: process.env.PUBLISH_PROVIDER || 'zoho',
  storageProvider: process.env.STORAGE_PROVIDER || 'zoho',
  databaseProvider: process.env.DATABASE_PROVIDER || 'zoho',
  openRouter: {
    key: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || ''
  },
  buffer: {
    token: process.env.BUFFER_ACCESS_TOKEN || '',
    organizationId: process.env.BUFFER_ORGANIZATION_ID || '',
    profileId: process.env.BUFFER_PROFILE_ID || ''
  },
  marketplace: {
    shopeeId: process.env.SHOPEE_AFFILIATE_ID || '',
    tokopediaId: process.env.TOKOPEDIA_AFFILIATE_ID || '',
    lazadaId: process.env.LAZADA_AFFILIATE_ID || ''
  }
};

export function hasByok(name) {
  return Boolean(process.env[name]);
}
