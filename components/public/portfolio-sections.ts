export const PORTFOLIO_SECTIONS = ['About me', 'Projects', 'Experience', 'Contact'] as const;

export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number];
