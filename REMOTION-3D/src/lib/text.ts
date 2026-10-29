// Text helpers shared by scripts (Node) and compositions (browser).

const ONES = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

// Indonesian number words, 0 to 999.999.999
export const numberToWords = (n: number): string => {
  if (!Number.isFinite(n) || n < 0) return String(n);
  n = Math.floor(n);
  if (n < 10) return ONES[n];
  if (n === 10) return "sepuluh";
  if (n === 11) return "sebelas";
  if (n < 20) return `${ONES[n - 10]} belas`;
  if (n < 100) {
    const r = n % 10;
    return `${ONES[Math.floor(n / 10)]} puluh${r ? " " + ONES[r] : ""}`;
  }
  if (n < 200) return `seratus${n % 100 ? " " + numberToWords(n % 100) : ""}`;
  if (n < 1000) {
    const r = n % 100;
    return `${ONES[Math.floor(n / 100)]} ratus${r ? " " + numberToWords(r) : ""}`;
  }
  if (n < 2000) return `seribu${n % 1000 ? " " + numberToWords(n % 1000) : ""}`;
  if (n < 1_000_000) {
    const r = n % 1000;
    return `${numberToWords(Math.floor(n / 1000))} ribu${r ? " " + numberToWords(r) : ""}`;
  }
  const r = n % 1_000_000;
  return `${numberToWords(Math.floor(n / 1_000_000))} juta${r ? " " + numberToWords(r) : ""}`;
};

// Expand digits and symbols the way they are spoken ("12%" -> "dua belas persen").
export const spokenForm = (token: string): string => {
  let t = token.toLowerCase();
  t = t.replace(/(\d+)\s*x\b/g, (_, d) => `${numberToWords(Number(d))} kali`);
  t = t.replace(/(\d+)[.,](\d+)/g, (_, a, b) => `${numberToWords(Number(a))} koma ${b.split("").map((c: string) => ONES[Number(c)]).join(" ")}`);
  t = t.replace(/\d+/g, (d) => ` ${numberToWords(Number(d))} `);
  t = t.replace(/%/g, " persen ");
  return t;
};

// Lowercase letters only, used for fuzzy matching.
export const normWord = (w: string): string =>
  spokenForm(w)
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const tokenize = (text: string): string[] =>
  text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

// Normalized token list of a phrase, with numbers expanded into spoken words.
export const normTokens = (text: string): string[] => normWord(text).split(" ").filter(Boolean);

// Strip trailing punctuation for on-screen caption words.
export const captionWord = (w: string): string => w.replace(/^[("'“]+/, "").replace(/[,.;:!)"'”]+$/, "");

export const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
};

// Loose word equality: exact, containment for longer words, or small edit distance.
export const fuzzyEq = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a))) return true;
  const d = levenshtein(a, b);
  return Math.max(a.length, b.length) >= 5 ? d <= 1 : false;
};
