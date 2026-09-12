#!/usr/bin/env node
// Phase 5b characterization: shared resolve + Context Detector (PLAN-0039).
// Graph: docs/research/working/routing/graph.v0.json — must stay in sync with task-capability-map.md
"use strict";

const fs = require("fs");
const path = require("path");
const { resolve, detect, loadGraph, route, authoritiesFor } = require(path.join(
  __dirname,
  "..",
  "..",
  "repo-tools",
  "lib",
  "routing"
));
const REPO_ROOT = path.join(__dirname, "..", "..");

module.exports = function register(test) {
  const graph = loadGraph();

  function sameList(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function assertResult(label, got, want) {
    if (got.unmatched !== want.unmatched) {
      console.error(`  ${label}: unmatched ${got.unmatched} !== ${want.unmatched}`);
      return false;
    }
    if (!sameList(got.read_set, want.read_set)) {
      console.error(`  ${label}: read_set`, got.read_set, "!==", want.read_set);
      return false;
    }
    if (want.run_set && !sameList(got.run_set, want.run_set)) {
      console.error(`  ${label}: run_set`, got.run_set, "!==", want.run_set);
      return false;
    }
    if (want.defer_set && !sameList(got.defer_set, want.defer_set)) {
      console.error(`  ${label}: defer_set`, got.defer_set, "!==", want.defer_set);
      return false;
    }
    return true;
  }

  test("routing F1 edit_docs", () => {
    const got = resolve("edit_docs", { trees: ["docs"], artifacts: ["research"] }, graph);
    return assertResult("F1", got, {
      unmatched: false,
      read_set: [
        "thin-entry",
        "context-economy",
        "doc-knowledge",
        "change-hygiene",
        "discovery-ledger",
      ],
      run_set: [],
      defer_set: [],
    });
  });

  test("routing F2 edit_scripts", () => {
    const got = resolve("edit_scripts", { trees: ["scripts"] }, graph);
    return assertResult("F2", got, {
      unmatched: false,
      read_set: [
        "thin-entry",
        "context-economy",
        "change-hygiene",
        "reference-closure",
        "secret-protection",
        "testing-evidence",
        "security-baseline",
      ],
      run_set: ["CTRL-0001"],
      defer_set: [],
    });
  });

  test("routing F3 git_write", () => {
    const got = resolve("git_write", { write_boundary: "commit" }, graph);
    return assertResult("F3", got, {
      unmatched: false,
      read_set: [
        "thin-entry",
        "context-economy",
        "change-hygiene",
        "git-write",
        "secret-protection",
        "security-baseline",
      ],
      run_set: ["CTRL-0001"],
      defer_set: [],
    });
  });

  test("routing F4 repair budget defer", () => {
    const got = resolve("repair", { phase: "implement" }, graph);
    return assertResult("F4", got, {
      unmatched: false,
      read_set: [
        "thin-entry",
        "context-economy",
        "change-hygiene",
        "reference-closure",
        "testing-evidence",
        "root-cause-repair",
        "discovery-ledger",
        "review-implementation",
      ],
      run_set: [],
      defer_set: ["security-baseline", "rule-capture"],
    });
  });

  test("routing F5 plan_write", () => {
    const got = resolve("plan_write", { artifacts: ["plan"], phase: "plan" }, graph);
    return assertResult("F5", got, {
      unmatched: false,
      read_set: [
        "thin-entry",
        "context-economy",
        "doc-knowledge",
        "change-hygiene",
        "discovery-ledger",
        "plan-delivery",
      ],
      run_set: [],
      defer_set: [],
    });
  });

  test("routing F6 unknown unmatched", () => {
    const got = resolve("unknown", {}, graph);
    return assertResult("F6", got, {
      unmatched: true,
      read_set: ["thin-entry", "context-economy"],
      run_set: [],
      defer_set: ["ask-user", "expand-entry"],
    });
  });

  test("routing budget never drops bound controls", () => {
    const got = resolve("release", { write_boundary: "release" }, graph);
    if (!got.run_set.includes("CTRL-0001")) {
      console.error("  expected CTRL-0001 in run_set", got);
      return false;
    }
    if (got.read_set.length > graph.budget) {
      console.error("  read_set over budget", got.read_set);
      return false;
    }
    return true;
  });

  test("detector D1 path edit_scripts", () => {
    const d = detect({ paths: ["scripts/check-doc-consistency.js"] }, graph);
    if (d.task_class !== "edit_scripts") {
      console.error("  D1 expected edit_scripts", d);
      return false;
    }
    if (!d.context.trees.includes("scripts")) {
      console.error("  D1 trees", d.context.trees);
      return false;
    }
    return true;
  });

  test("detector D2 explicit task wins", () => {
    const d = detect(
      { task: "repair", paths: ["docs/research/RESEARCH-0012-task-capability-routing.md"] },
      graph
    );
    if (d.task_class !== "repair" || d.source !== "explicit") {
      console.error("  D2", d);
      return false;
    }
    return true;
  });

  test("detector D3 conflict → unknown", () => {
    const d = detect(
      {
        paths: [
          "docs/research/RESEARCH-0012-task-capability-routing.md",
          "scripts/check-doc-consistency.js",
        ],
      },
      graph
    );
    if (d.task_class !== "unknown" || d.source !== "conflict") {
      console.error("  D3", d);
      return false;
    }
    const r = resolve(d.task_class, d.context, graph);
    if (!r.unmatched) {
      console.error("  D3 resolve should be unmatched", r);
      return false;
    }
    return true;
  });

  test("route CLI shape F2 equivalent", () => {
    const { detection, result } = route(
      { task: "edit_scripts", trees: ["scripts"] },
      graph
    );
    if (detection.task_class !== "edit_scripts") return false;
    return assertResult("route-F2", result, {
      unmatched: false,
      read_set: [
        "thin-entry",
        "context-economy",
        "change-hygiene",
        "reference-closure",
        "secret-protection",
        "testing-evidence",
        "security-baseline",
      ],
      run_set: ["CTRL-0001"],
      defer_set: [],
    });
  });

  test("authorities: every keep capability path exists (Phase 5c)", () => {
    const table = graph.authorities || {};
    const ids = Object.keys(table);
    if (ids.length < 15) {
      console.error("  expected ≥15 keep authorities, got", ids.length);
      return false;
    }
    for (const id of ids) {
      const a = table[id];
      if (!a || !a.path) {
        console.error("  missing path for", id);
        return false;
      }
      const abs = path.join(REPO_ROOT, a.path);
      if (!fs.existsSync(abs)) {
        console.error("  authority path missing:", a.path);
        return false;
      }
    }
    return true;
  });

  test("authoritiesFor read_set enrichment", () => {
    const got = resolve("edit_docs", { trees: ["docs"] }, graph);
    const auth = authoritiesFor(got.read_set, graph);
    if (auth.length !== got.read_set.length) {
      console.error("  authorities length", auth.length, "!==", got.read_set.length);
      return false;
    }
    const { authorities } = route({ task: "edit_docs", trees: ["docs"] }, graph);
    if (!authorities || authorities.length !== auth.length) {
      console.error("  route.authorities mismatch", authorities);
      return false;
    }
    return true;
  });
};
