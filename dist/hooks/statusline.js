#!/usr/bin/env node
import "../chunk-VESSVJCD.js";
import {
  CONTEXT_MODES,
  getProjectId,
  openHookDb,
  readHookStdin,
  writeStateFile
} from "../chunk-ILV37I4F.js";

// src/v2/hooks/statusline.ts
function run(input) {
  const usedPct = input.context_window?.used_percentage ?? 0;
  const compactThreshold = parseInt(
    process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE ?? "95",
    10
  );
  const freeUntilCompact = Math.max(0, compactThreshold - usedPct);
  const mode = freeUntilCompact > CONTEXT_MODES.NORMAL_THRESHOLD ? "normal" : freeUntilCompact > CONTEXT_MODES.COMPACT_THRESHOLD ? "compact" : freeUntilCompact > CONTEXT_MODES.MINIMAL_THRESHOLD ? "minimal" : "critical";
  const state = {
    mode,
    freeUntilCompact,
    usedPct,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeStateFile(state);
  let display = `Engram: ${mode}`;
  if (input.cwd) {
    try {
      const project = getProjectId(input.cwd);
      const db = openHookDb();
      try {
        const memCount = db.prepare(
          "SELECT COUNT(*) as c FROM memories WHERE (project = ? OR project IS NULL) AND invalidated = 0"
        ).get(project);
        const plan = db.prepare(
          "SELECT id FROM plans WHERE project = ? AND status = 'active' LIMIT 1"
        ).get(project);
        if (plan) {
          const steps = db.prepare(
            "SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'done' THEN 1 END) as done FROM plan_steps WHERE plan_id = ?"
          ).get(plan.id);
          display += ` | step ${steps.done}/${steps.total}`;
        }
        const remCount = db.prepare(
          "SELECT COUNT(*) as c FROM reminders WHERE active = 1 AND (project = ? OR project IS NULL)"
        ).get(project);
        display += ` | ${memCount.c} mem`;
        if (remCount.c > 0) display += ` ${remCount.c} rem`;
      } finally {
        db.close();
      }
    } catch {
    }
  }
  if (mode === "critical") {
    display = "Engram: CRITICAL \u2014 silent";
  }
  return display;
}
if (process.argv[1] && !process.argv[1].includes("vitest")) {
  try {
    const raw = readHookStdin();
    const input = JSON.parse(raw);
    const output = run(input);
    process.stdout.write(output);
  } catch {
    process.stdout.write("Engram: --");
  }
}
export {
  run
};
//# sourceMappingURL=statusline.js.map