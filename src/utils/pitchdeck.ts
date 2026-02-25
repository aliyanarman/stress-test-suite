import jsPDF from 'jspdf';

export function downloadAlightPitchdeck() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 22;
  const marginR = 22;
  const contentW = pageW - marginL - marginR;

  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 282, pageW, 15, 'F');
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(7);
      doc.text('Production Preview — Pocket Analysis by Alight', marginL, 289);
      doc.text(`© 2026 Aliyan Arman  |  Page ${i} of ${totalPages}`, pageW - marginR, 289, { align: 'right' });
    }
  };

  const drawHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('ALIGHT', pageW - marginR, 12, { align: 'right' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, marginL, 18);
    if (subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, marginL, 28);
    }
    doc.setFontSize(8);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(dateStr, pageW - marginR, 28, { align: 'right' });
  };

  const sectionTitle = (y: number, num: string, title: string): number => {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${num}  ${title}`, marginL, y);
    y += 2;
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, pageW - marginR, y);
    return y + 8;
  };

  const writeText = (y: number, text: string, fontSize = 9): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, contentW - 8);
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, marginL + 4, y);
      y += 5;
    });
    return y + 4;
  };

  const drawBar = (y: number, label: string, value: number, maxVal: number, color: [number, number, number]): number => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(label, marginL + 4, y);
    const barX = marginL + 55;
    const barW = contentW - 60;
    const barH = 5;
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(barX, y - 4, barW, barH, 1, 1, 'F');
    const fillW = Math.min(barW, (value / maxVal) * barW);
    doc.setFillColor(...color);
    doc.roundedRect(barX, y - 4, fillW, barH, 1, 1, 'F');
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`${value}%`, barX + barW + 3, y);
    return y + 10;
  };

  // ═══════════════ PAGE 1: Cover ═══════════════
  drawHeader('INVESTOR PRESENTATION', 'Alight — Your Pocket Financial Analyst');

  let y = 55;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Alight', marginL, y);
  y += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Institutional-grade financial intelligence, accessible to everyone.', marginL, y);
  y += 20;

  y = sectionTitle(y, 'I.', 'THE OPPORTUNITY');
  y = writeText(y, 'Every day, millions of investors, small business owners, and financial decision-makers make critical capital allocation choices without access to the analytical tools that Wall Street takes for granted. The gap between institutional finance and individual investors is not one of intelligence, it is one of tooling.');
  y = writeText(y, 'Alight closes that gap. We deliver real-time, AI-powered financial analysis that was previously locked behind Bloomberg terminals, $50,000/year advisory retainers, and enterprise software suites. Our users get the same quality of deal evaluation, valuation modeling, and market benchmarking that a Goldman Sachs analyst produces, delivered in seconds through an interface anyone can use.');
  y += 4;

  y = sectionTitle(y, 'II.', 'WHY NOW');
  y = writeText(y, 'Three converging forces make this the right moment:');
  const whyNow = [
    'AI cost collapse: Gemini and GPT models now deliver institutional-quality analysis at near-zero marginal cost.',
    'Democratization wave: Robinhood proved retail investors want professional tools. Alight is the analytical layer they still lack.',
    'Global capital expansion: Emerging markets (Pakistan, UAE, SE Asia) have rapidly growing investor populations with zero access to quality financial tooling.',
  ];
  whyNow.forEach(item => {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`•  ${item}`, marginL + 4, y, { maxWidth: contentW - 12 });
    const lines = doc.splitTextToSize(`•  ${item}`, contentW - 12);
    y += lines.length * 5 + 3;
  });

  // ═══════════════ PAGE 2: Product + Market ═══════════════
  doc.addPage();
  drawHeader('INVESTOR PRESENTATION', 'Product & Market Overview');
  y = 50;

  y = sectionTitle(y, 'III.', 'PRODUCT OVERVIEW');
  y = writeText(y, 'Alight provides five core financial calculators, each enhanced with AI-driven market intelligence:');

  const products = [
    ['Future Value Calculator', 'Compound growth modeling with industry benchmarking across 4 markets and 6 sectors.'],
    ['Deal ROI / LBO Analyzer', 'True IRR, MOIC, cash return analysis with scenario modeling (bull/bear/base).'],
    ['Breakeven Calculator', 'Unit economics with margin analysis and country-specific industry comparisons.'],
    ['Valuation Engine', 'EBITDA-multiple valuation with percentile ranges (25th, 50th, 75th) by sector.'],
    ['Payback Calculator', 'Inflation-adjusted payback analysis with 5-year profit projections.'],
  ];
  products.forEach(([name, desc]) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(name, marginL + 4, y);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(desc, contentW - 12);
    descLines.forEach((line: string, i: number) => {
      doc.text(line, marginL + 4, y + 5 + i * 4.5);
    });
    y += 5 + descLines.length * 4.5 + 5;
  });

  y += 4;
  y = sectionTitle(y, 'IV.', 'MARKET SIZE');

  // Draw simple bar chart for TAM/SAM/SOM
  y = drawBar(y, 'TAM (Global)', 100, 100, [40, 40, 40]);
  y = writeText(y - 2, '$340B global financial software and analytics market (2025, Grand View Research).', 8);
  y = drawBar(y, 'SAM (Retail)', 35, 100, [60, 60, 60]);
  y = writeText(y - 2, '$119B retail/SMB financial tools segment growing at 11.2% CAGR.', 8);
  y = drawBar(y, 'SOM (Year 3)', 8, 100, [80, 80, 80]);
  y = writeText(y - 2, '$27B addressable through freemium + premium in target markets (US, UK, UAE, PK).', 8);

  y += 4;
  y = sectionTitle(y, 'V.', 'COMPETITIVE ADVANTAGE');
  y = writeText(y, 'Unlike Bloomberg ($25K/yr), PitchBook ($30K/yr), or basic free calculators with no intelligence layer, Alight occupies a unique position: professional-grade analysis at consumer-grade simplicity and pricing. Our AI generates context-aware verdicts, not generic templates. Every analysis references the user\'s specific country, industry, and calculated metrics.');

  // ═══════════════ PAGE 3: Business Model + Traction ═══════════════
  doc.addPage();
  drawHeader('INVESTOR PRESENTATION', 'Business Model & Traction');
  y = 50;

  y = sectionTitle(y, 'VI.', 'BUSINESS MODEL');
  const modelItems = [
    ['Freemium Tier', 'Core calculators with limited AI analyses per day. Drives adoption and virality.'],
    ['Pro ($19/mo)', 'Unlimited AI analysis, PDF memo exports, saved deals, scenario modeling.'],
    ['Enterprise ($99/mo)', 'Team collaboration, custom industry data, API access, white-label options.'],
    ['Export Revenue', 'Premium memo PDFs with detailed market comparables and AI commentary.'],
  ];
  modelItems.forEach(([tier, desc]) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(tier, marginL + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(desc, marginL + 4, y + 5, { maxWidth: contentW - 12 });
    y += 14;
  });

  y += 4;
  y = sectionTitle(y, 'VII.', 'TRACTION & METRICS');

  // McKinsey-style metric boxes
  const metrics = [
    ['5', 'Financial\nCalculators', 'Live & AI-enhanced'],
    ['4', 'Markets\nCovered', 'US, UK, UAE, Pakistan'],
    ['6', 'Industry\nSectors', 'With benchmarks'],
    ['<2s', 'Analysis\nSpeed', 'AI verdict delivery'],
  ];
  const boxW = (contentW - 12) / 4;
  metrics.forEach(([num, label, sub], i) => {
    const bx = marginL + 4 + i * boxW;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(bx, y, boxW - 4, 35, 2, 2, 'F');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(num, bx + (boxW - 4) / 2, y + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, bx + (boxW - 4) / 2, y + 20, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(sub, bx + (boxW - 4) / 2, y + 28, { align: 'center' });
  });
  y += 45;

  y = sectionTitle(y, 'VIII.', 'GROWTH TRAJECTORY');
  y = writeText(y, 'Alight is in production preview with a fully functional product across all five calculator verticals. The AI analysis pipeline is live and generating real-time, market-aware insights. The export system produces Wall Street-standard PDF memorandums that users can present directly to stakeholders, lenders, or investment committees.');
  y = writeText(y, 'Near-term roadmap includes mobile app launch, additional emerging market coverage (India, Saudi Arabia, Nigeria), portfolio tracking, and API partnerships with financial data providers for live market data integration.');

  // ═══════════════ PAGE 4: Team + Ask ═══════════════
  doc.addPage();
  drawHeader('INVESTOR PRESENTATION', 'Team & Investment Ask');
  y = 50;

  y = sectionTitle(y, 'IX.', 'FOUNDING TEAM');
  y = writeText(y, 'Aliyan Arman — Founder & CEO. Builder at the intersection of finance and technology. Designed and built the entire Alight platform from architecture to AI integration. Deep understanding of both institutional finance workflows and consumer product design.');
  y += 4;

  y = sectionTitle(y, 'X.', 'THE ASK');
  y = writeText(y, 'We are raising a seed round to accelerate three priorities:');
  const askItems = [
    '1. Market expansion: Launch in 6 additional countries with localized financial data and currency support.',
    '2. Mobile native: iOS and Android apps to capture the 73% of our target users who are mobile-first.',
    '3. Data partnerships: Integrate live market feeds (Bloomberg, Refinitiv) for real-time benchmarking.',
  ];
  askItems.forEach(item => {
    y = writeText(y, item);
  });
  y += 4;

  y = sectionTitle(y, 'XI.', 'WHY ALIGHT WILL WIN');
  y = writeText(y, 'The financial analysis market is bifurcated: expensive enterprise tools for institutions, and simplistic calculators for everyone else. There is no middle ground. Alight is that middle ground. We combine the analytical rigor of a $200/hour financial advisor with the accessibility of a calculator app. Our AI does not just crunch numbers; it interprets them in context, compares them to real market data, and tells users exactly what to do.');
  y = writeText(y, 'The timing is right, the technology is ready, and the market need is acute. Alight is not a nice-to-have; it is the tool that every person making a financial decision wishes they had.');
  y += 8;

  // Contact
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Contact', marginL, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Aliyan Arman  |  aliyanarman@outlook.com', marginL + 4, y);
  y += 5;
  doc.text('pocketstar.lovable.app', marginL + 4, y);

  // Add footers to all pages
  addFooter();

  doc.save(`Alight_Investor_Pitchdeck_${Date.now()}.pdf`);
}
