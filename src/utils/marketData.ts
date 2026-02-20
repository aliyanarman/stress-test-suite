export interface IndustryData {
  avgGrowth: number;
  goodGrowth: number;
  excellentGrowth: number;
  avgMultiple: number;
  goodMultiple: number;
  avgMargin: number;
  context: string;
}

export interface MarketConfig {
  name: string;
  currency: string;
  avgInflation: number;
  peIRR: number;
  peMOIC: number;
  industries: Record<string, IndustryData>;
}

export const MARKETS: Record<string, MarketConfig> = {
  US: {
    name: 'United States',
    currency: 'USD',
    avgInflation: 2.8,
    peIRR: 20,
    peMOIC: 2.5,
    industries: {
      'real-estate': { avgGrowth: 4.2, goodGrowth: 6.0, excellentGrowth: 8.0, avgMultiple: 15, goodMultiple: 18, avgMargin: 25, context: 'Real estate in the US is steady but slow. Prices go up about 4% per year. Safe money, but don\'t expect to get rich quick.' },
      'tech': { avgGrowth: 12.5, goodGrowth: 18.0, excellentGrowth: 25.0, avgMultiple: 20, goodMultiple: 30, avgMargin: 35, context: 'US tech grows fast - 12% or more per year. Competitive with lots of winners and failures. High risk, high reward.' },
      'retail': { avgGrowth: 3.8, goodGrowth: 6.5, excellentGrowth: 10.0, avgMultiple: 8, goodMultiple: 12, avgMargin: 15, context: 'Retail in the US is tough. Only grows 3-4% per year. Amazon and online shopping are crushing traditional stores.' },
      'manufacturing': { avgGrowth: 5.2, goodGrowth: 8.0, excellentGrowth: 12.0, avgMultiple: 10, goodMultiple: 14, avgMargin: 20, context: 'US manufacturing is solid and predictable. About 5% growth per year. Not flashy, but reliable for long-term holds.' },
      'healthcare': { avgGrowth: 6.8, goodGrowth: 10.0, excellentGrowth: 15.0, avgMultiple: 12, goodMultiple: 16, avgMargin: 22, context: 'Healthcare keeps growing as people age. 7-10% per year is normal. Expensive to start, but stable once running.' },
      'finance': { avgGrowth: 7.5, goodGrowth: 11.0, excellentGrowth: 16.0, avgMultiple: 14, goodMultiple: 18, avgMargin: 30, context: 'Financial services grow steady at 7-8% per year. High margins if you can get customers. Heavily regulated though.' },
    },
  },
  PK: {
    name: 'Pakistan',
    currency: 'PKR',
    avgInflation: 11.2,
    peIRR: 25,
    peMOIC: 3.0,
    industries: {
      'real-estate': { avgGrowth: 8.5, goodGrowth: 12.0, excellentGrowth: 15.0, avgMultiple: 10, goodMultiple: 14, avgMargin: 30, context: 'Real estate in Pakistan goes up and down a lot. Can grow 8-15% per year, but inflation eats into it.' },
      'tech': { avgGrowth: 18.0, goodGrowth: 25.0, excellentGrowth: 35.0, avgMultiple: 12, goodMultiple: 18, avgMargin: 40, context: 'Tech in Pakistan is booming - young population, cheap labor. Can grow 20-35% per year. Power outages and politics add risk.' },
      'retail': { avgGrowth: 7.2, goodGrowth: 10.5, excellentGrowth: 15.0, avgMultiple: 6, goodMultiple: 9, avgMargin: 18, context: 'Retail is growing as the middle class expands. 7-10% per year. Currency swings and imports can kill margins fast.' },
      'manufacturing': { avgGrowth: 9.5, goodGrowth: 14.0, excellentGrowth: 20.0, avgMultiple: 8, goodMultiple: 12, avgMargin: 22, context: 'Manufacturing is strong - textiles, cement, steel. Can grow 10-15% per year. Energy costs and rupee devaluation are big risks.' },
      'healthcare': { avgGrowth: 11.0, goodGrowth: 16.0, excellentGrowth: 22.0, avgMultiple: 9, goodMultiple: 13, avgMargin: 25, context: 'Healthcare is growing fast as people get richer. 11-16% per year. Not much competition yet.' },
      'finance': { avgGrowth: 10.5, goodGrowth: 15.0, excellentGrowth: 20.0, avgMultiple: 10, goodMultiple: 14, avgMargin: 28, context: 'Banks and finance are growing with the economy. 10-15% per year. Interest rate swings can hurt. Political stability matters.' },
    },
  },
  UK: {
    name: 'United Kingdom',
    currency: 'GBP',
    avgInflation: 2.5,
    peIRR: 18,
    peMOIC: 2.3,
    industries: {
      'real-estate': { avgGrowth: 3.5, goodGrowth: 5.5, excellentGrowth: 7.5, avgMultiple: 16, goodMultiple: 20, avgMargin: 23, context: 'UK real estate grows slow - only 3-5% per year. London is expensive. Brexit made things uncertain.' },
      'tech': { avgGrowth: 10.5, goodGrowth: 16.0, excellentGrowth: 22.0, avgMultiple: 18, goodMultiple: 28, avgMargin: 33, context: 'UK tech is decent - fintech and AI are strong. Grows 10-16% per year. Talent is expensive.' },
      'retail': { avgGrowth: 2.8, goodGrowth: 5.0, excellentGrowth: 8.0, avgMultiple: 7, goodMultiple: 11, avgMargin: 14, context: 'Retail in the UK is dying. Only 3-5% growth. High street stores closing everywhere.' },
      'manufacturing': { avgGrowth: 4.2, goodGrowth: 7.0, excellentGrowth: 10.0, avgMultiple: 9, goodMultiple: 13, avgMargin: 19, context: 'UK manufacturing is stable but slow. 4-7% growth. Better for specialty products than mass production.' },
      'healthcare': { avgGrowth: 5.5, goodGrowth: 8.5, excellentGrowth: 12.0, avgMultiple: 11, goodMultiple: 15, avgMargin: 21, context: 'Healthcare grows steady at 5-8% as population ages. NHS takes most of the market.' },
      'finance': { avgGrowth: 6.8, goodGrowth: 10.0, excellentGrowth: 14.0, avgMultiple: 13, goodMultiple: 17, avgMargin: 29, context: 'Financial services in London are still strong. 7-10% growth. Post-Brexit some business moved to EU.' },
    },
  },
  AE: {
    name: 'UAE',
    currency: 'AED',
    avgInflation: 1.8,
    peIRR: 22,
    peMOIC: 2.8,
    industries: {
      'real-estate': { avgGrowth: 6.5, goodGrowth: 9.5, excellentGrowth: 13.0, avgMultiple: 12, goodMultiple: 16, avgMargin: 28, context: 'UAE real estate is hot and cold - Dubai especially. Can grow 6-13% per year. Oversupply can crash prices.' },
      'tech': { avgGrowth: 15.0, goodGrowth: 22.0, excellentGrowth: 30.0, avgMultiple: 16, goodMultiple: 24, avgMargin: 38, context: 'Tech in UAE is growing fast - government is pushing it hard. 15-30% growth. Tax-free income attracts talent.' },
      'retail': { avgGrowth: 5.5, goodGrowth: 8.5, excellentGrowth: 12.0, avgMultiple: 7, goodMultiple: 10, avgMargin: 17, context: 'Retail grows with tourism and expats. 5-8% per year. Competition is fierce and rents are crazy high.' },
      'manufacturing': { avgGrowth: 7.2, goodGrowth: 11.0, excellentGrowth: 15.0, avgMultiple: 9, goodMultiple: 13, avgMargin: 21, context: 'Manufacturing is growing - free zones make it easy. 7-11% growth. Labor costs rising though.' },
      'healthcare': { avgGrowth: 8.5, goodGrowth: 13.0, excellentGrowth: 18.0, avgMultiple: 10, goodMultiple: 14, avgMargin: 24, context: 'Healthcare is booming - medical tourism and wealthy expats. 8-13% growth.' },
      'finance': { avgGrowth: 9.0, goodGrowth: 13.5, excellentGrowth: 18.0, avgMultiple: 12, goodMultiple: 16, avgMargin: 31, context: 'Financial services growing fast in Dubai - becoming a regional hub. 9-13% per year. Islamic finance is big.' },
    },
  },
};

export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'AE', name: 'UAE' },
];

export const INDUSTRIES = [
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'tech', label: 'Technology' },
  { value: 'retail', label: 'Retail & Food' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Financial Services' },
];

export function getIndustryData(industry: string, country: string) {
  const market = MARKETS[country] || MARKETS.US;
  const data = market.industries[industry] || market.industries['real-estate'];
  return {
    ...data,
    name: INDUSTRIES.find(i => i.value === industry)?.label || industry,
    marketName: market.name,
    currency: market.currency,
    avgInflation: market.avgInflation,
    peIRR: market.peIRR,
    peMOIC: market.peMOIC,
  };
}
