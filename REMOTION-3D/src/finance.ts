// Single source of truth for every number on screen and every data-driven 3D size (Short 02).
import { numberToWords } from "./lib/text";

export const LOAN = 12_000_000;
export const TENOR_MONTHS = 12;
export const FLAT_RATE_MONTHLY = 0.01;

export const PRINCIPAL_PER_MONTH = LOAN / TENOR_MONTHS;
export const INTEREST_PER_MONTH = LOAN * FLAT_RATE_MONTHLY;
export const INSTALLMENT = PRINCIPAL_PER_MONTH + INTEREST_PER_MONTH;
export const TOTAL_INTEREST = INTEREST_PER_MONTH * TENOR_MONTHS;
export const FLAT_RATE_YEARLY = FLAT_RATE_MONTHLY * 12;

export const balanceAfter = (month: number) => LOAN - Math.min(month, TENOR_MONTHS) * PRINCIPAL_PER_MONTH;

// Present value of n equal payments at monthly rate r
const pv = (payment: number, r: number, n: number) => (r === 0 ? payment * n : (payment * (1 - Math.pow(1 + r, -n))) / r);

// Effective monthly rate (IRR) by bisection: PV(installments) = LOAN
export const solveEffectiveMonthly = (loan = LOAN, payment = INSTALLMENT, n = TENOR_MONTHS): number => {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (pv(payment, mid, n) > loan) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

export const EFFECTIVE_MONTHLY = solveEffectiveMonthly();
export const EFFECTIVE_YEARLY = EFFECTIVE_MONTHLY * 12; // nominal, as in the VO
export const EFFECTIVE_RATIO = EFFECTIVE_YEARLY / FLAT_RATE_YEARLY;

// Display formatting (Indonesian short form)
const juta = (n: number) => `${n / 1_000_000} juta`;
const ribu = (n: number) => `${n / 1_000} ribu`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

export const DISPLAY = {
  loan: juta(LOAN), // "12 juta"
  flatMonthly: pct(FLAT_RATE_MONTHLY), // "1%"
  flatYearly: pct(FLAT_RATE_YEARLY), // "12%"
  principalMonthly: juta(PRINCIPAL_PER_MONTH), // "1 juta"
  interestMonthly: ribu(INTEREST_PER_MONTH), // "120 ribu"
  effectiveYearlyShort: `${Math.floor(EFFECTIVE_YEARLY * 100)}%`, // "21%" (floored, VO says "sekitar")
  effectiveYearly: `sekitar ${Math.floor(EFFECTIVE_YEARLY * 100)}%`,
  ratio: `${Math.ceil(EFFECTIVE_RATIO)}x lipat`, // "2x lipat" (VO says "hampir")
  ratioFull: `hampir ${Math.ceil(EFFECTIVE_RATIO)}x lipat`,
} as const;

// How each display value is spoken in the VO
export const SPOKEN = {
  loan: `${numberToWords(LOAN / 1_000_000)} juta`,
  flatMonthly: `${numberToWords(Math.round(FLAT_RATE_MONTHLY * 100))} persen`,
  flatYearly: `${numberToWords(Math.round(FLAT_RATE_YEARLY * 100))} persen`,
  principalMonthly: `${numberToWords(PRINCIPAL_PER_MONTH / 1_000_000)} juta`,
  interestMonthly: `${numberToWords(INTEREST_PER_MONTH / 1_000)} ribu`,
  effectiveYearly: `sekitar ${numberToWords(Math.floor(EFFECTIVE_YEARLY * 100))} persen`,
  ratio: `hampir ${numberToWords(Math.ceil(EFFECTIVE_RATIO))} kali lipat`,
} as const;

// Number tokens allowed on screen
export const ALLOWED_NUMBER_TOKENS = new Set(
  [DISPLAY.loan, DISPLAY.flatMonthly, DISPLAY.flatYearly, DISPLAY.principalMonthly, DISPLAY.interestMonthly, DISPLAY.effectiveYearlyShort, DISPLAY.ratio]
    .join(" ")
    .split(" ")
    .filter((t) => /\d/.test(t)),
);

// 3D sizes driven by data (world units)
export const VIS = {
  principalBlockH: 1.0,
  interestBlockH: INTEREST_PER_MONTH / PRINCIPAL_PER_MONTH, // 0.12
  interestVisualScale: 1.6, // same exaggeration every month
  jarFill: (month: number) => balanceAfter(month) / LOAN,
  boardFlatH: 1.2, // 12% board
  boardEffectiveH: 1.2 * (EFFECTIVE_YEARLY / FLAT_RATE_YEARLY), // 21.46% board
} as const;
