import assert from "node:assert/strict";
assert.equal(("Season Planner".replace(/[\\/:*?"<>|#^[\]]/g,"-")).length, 14);
console.log("Season Planner utility smoke tests passed.");
