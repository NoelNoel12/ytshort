// Assert every number in Short 02 against src/finance.ts and against the script.
// Usage: tsx scripts/checkFinance.ts short-02
import fs from "node:fs";
import * as F from "../src/finance";
import { normTokens } from "../src/lib/text";
import type { ScriptData } from "../src/types";
import { arg, dataFile, readJson } from "./paths";
import { getVideo } from "../data/videos";

const id = arg(0, "short-02")!;
let fails = 0;
// Videos without numbers on screen: every chip and every 3D label string must be digit-free
if (getVideo(id).numbers === "none") {
  const script = readJson<ScriptData>(dataFile(id, "script"));
  const bad = script.scenes.flatMap((s) => s.screenText.filter((c) => /\d/.test(c.plain)).map((c) => `${s.id}: ${c.plain}`));
  console.log(`${bad.length ? "FAIL" : "PASS"}  no numbers in screen text           ${bad.length ? bad.join(", ") : script.scenes.reduce((a, s) => a + s.screenText.length, 0) + " chips checked"}`);
  process.exit(bad.length ? 1 : 0);
}
const check = (name: string, ok: boolean, detail: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(34)} ${detail}`);
  if (!ok) fails++;
};
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
const idr = (n: number) => n.toLocaleString("id-ID");

check("principal per month", F.PRINCIPAL_PER_MONTH === 1_000_000, idr(F.PRINCIPAL_PER_MONTH));
check("interest per month", F.INTEREST_PER_MONTH === 120_000, idr(F.INTEREST_PER_MONTH));
check("installment (fixed)", F.INSTALLMENT === 1_120_000, idr(F.INSTALLMENT));
check("total interest", F.TOTAL_INTEREST === 1_440_000, idr(F.TOTAL_INTEREST));
check("balance after month 6", F.balanceAfter(6) === 6_000_000 && F.balanceAfter(6) === F.LOAN / 2, idr(F.balanceAfter(6)) + " (half of loan)");
check("interest in month 6", F.INTEREST_PER_MONTH === 120_000, "flat, still " + idr(F.INTEREST_PER_MONTH));
check("effective monthly ~1.79%", near(F.EFFECTIVE_MONTHLY * 100, 1.79, 0.01), (F.EFFECTIVE_MONTHLY * 100).toFixed(4) + "%");
check("effective yearly ~21.46%", near(F.EFFECTIVE_YEARLY * 100, 21.46, 0.05), (F.EFFECTIVE_YEARLY * 100).toFixed(3) + "% (r x 12)");
check("ratio vs 12% ~1.79, below 2", near(F.EFFECTIVE_RATIO, 1.79, 0.02) && F.EFFECTIVE_RATIO < 2, F.EFFECTIVE_RATIO.toFixed(3) + " -> " + F.DISPLAY.ratioFull);
const pvCheck = Array.from({ length: F.TENOR_MONTHS }, (_, k) => F.INSTALLMENT / Math.pow(1 + F.EFFECTIVE_MONTHLY, k + 1)).reduce((a, b) => a + b, 0);
check("PV of installments = loan", near(pvCheck, F.LOAN, 1), idr(Math.round(pvCheck)));
check("display strings", F.DISPLAY.loan === "12 juta" && F.DISPLAY.flatMonthly === "1%" && F.DISPLAY.flatYearly === "12%" && F.DISPLAY.principalMonthly === "1 juta" && F.DISPLAY.interestMonthly === "120 ribu" && F.DISPLAY.effectiveYearly === "sekitar 21%" && F.DISPLAY.ratioFull === "hampir 2x lipat", Object.values(F.DISPLAY).join(" | "));
check("3D: interest block = 0.12 of principal", near(F.VIS.interestBlockH, 0.12, 1e-9), F.VIS.interestBlockH.toFixed(3));
check("3D: jar fill month 6 = 0.5", F.VIS.jarFill(6) === 0.5, String(F.VIS.jarFill(6)));
check("3D: boards scale 12 : 21.46", near(F.VIS.boardEffectiveH / F.VIS.boardFlatH, 21.46 / 12, 0.005), (F.VIS.boardEffectiveH / F.VIS.boardFlatH).toFixed(3));
check("3D: two 12% boards almost 21%", 2 * F.VIS.boardFlatH > F.VIS.boardEffectiveH, `2 x ${F.VIS.boardFlatH} vs ${F.VIS.boardEffectiveH.toFixed(3)}`);

// VO must speak the same numbers
const scriptFile = dataFile(id, "script");
if (fs.existsSync(scriptFile)) {
  const script = readJson<ScriptData>(scriptFile);
  const vo = normTokens(script.voText).join(" ");
  for (const [k, spoken] of Object.entries(F.SPOKEN)) {
    check(`VO says ${k}`, vo.includes(normTokens(spoken).join(" ")), `"${spoken}"`);
  }
  // Every number token on screen must come from finance.ts
  const chips = script.scenes.flatMap((s) => s.screenText.map((c) => ({ s: s.id, t: c.plain })));
  const bad: string[] = [];
  for (const c of chips) for (const tok of c.t.split(/\s+/)) if (/\d/.test(tok) && !F.ALLOWED_NUMBER_TOKENS.has(tok.replace(/[^\dx%]/g, ""))) bad.push(`${c.s}: ${tok}`);
  check("screen numbers come from finance", bad.length === 0, bad.length ? bad.join(", ") : [...F.ALLOWED_NUMBER_TOKENS].join(" "));
} else {
  console.log(`SKIP  VO checks (run parseScript first)`);
}

console.log(fails ? `checkFinance: ${fails} FAILED` : "checkFinance: all passed");
process.exit(fails ? 1 : 0);
