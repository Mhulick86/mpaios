import { quickActionHandler } from "../../src/orchestrator/api.js";

export const config = { runtime: "nodejs" };

export default quickActionHandler("competitor-scan");
