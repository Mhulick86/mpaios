export * from "./types.js";
export { loadSkill, listSkills, loadAllSkills, parseSkill } from "./loadSkill.js";
export {
  buildColdSequence,
  renderColdMessage,
  shouldSendColdFollowup,
  COLD_OPENER_MAX_CHARS,
  MAX_FOLLOWUPS,
} from "./templates/coldWhatsapp.js";
export {
  advanceSequence,
  detectKeywordPause,
  makeWelcomeSequence,
} from "./templates/whatsappSequence.js";
export {
  evaluateChurnRisk,
  nextWinbackMessage,
} from "./templates/churnWinback.js";
export {
  makePostSupportSurvey,
  stepSurvey,
} from "./templates/inboundSurvey.js";
export { route } from "./router.js";
export type { InboundContext, RouterDecision } from "./router.js";
export {
  handleInbound,
  renderViaOpenclaw,
} from "./openclawBridge.js";
export type {
  HandleInboundArgs,
  RenderedReply,
} from "./openclawBridge.js";
