import type { SceneDef } from "../types";
import { S1 } from "./S1Hook";
import { S2 } from "./S2Loan";
import { S3 } from "./S3Installment";
import { S4 } from "./S4Balance";
import { S5 } from "./S5Overpay";
import { S6 } from "./S6Effective";
import { S7 } from "./S7Nuance";
import { S8 } from "./S8Tips";
import { S9 } from "./S9Cta";

// Order matches the script (S1 to S9)
export const SCENES_02: SceneDef[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9];
