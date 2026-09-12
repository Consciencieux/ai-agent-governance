#!/usr/bin/env node
// Phase 5a characterization: deterministic Task→Capability resolve (call-topology.md).
// Repo-only; not a Dispatcher. Graph mirrors docs/research/routing/task-capability-map.md v0.
"use strict";

module.exports = function register(test) {
  const BUDGET = 8;

  const ALWAYS = ["thin-entry", "context-economy"];

  // triggers: task_class → capability ids (beyond always)
  const TRIGGERS = {
    edit_docs: ["doc-knowledge", "change-hygiene", "discovery-ledger"],
    edit_references: ["change-hygiene", "reference-closure", "security-baseline", "rule-capture"],
    edit_scripts: [
      "change-hygiene",
      "reference-closure",
      "secret-protection",
      "testing-evidence",
      "security-baseline",
    ],
    edit_skill_entry: ["change-hygiene", "reference-closure", "rule-capture"],
    git_write: ["change-hygiene", "git-write", "secret-protection", "security-baseline"],
    release: [
      "change-hygiene",
      "git-write",
      "secret-protection",
      "testing-evidence",
      "release-governance",
      "security-baseline",
    ],
    audit: ["doc-knowledge", "review-implementation"],
    research_write: ["doc-knowledge", "change-hygiene", "discovery-ledger"],
    finding_write: ["doc-knowledge", "change-hygiene", "discovery-ledger"],
    adr_write: ["doc-knowledge", "change-hygiene", "discovery-ledger"],
    plan_write: ["doc-knowledge", "change-hygiene", "discovery-ledger", "plan-delivery"],
    repair: [
      "change-hygiene",
      "reference-closure",
      "testing-evidence",
      "root-cause-repair",
      "discovery-ledger",
      "review-implementation",
      "security-baseline",
      "rule-capture",
    ],
    test_change: ["change-hygiene", "testing-evidence"],
    unknown: [],
  };

  const BINDS = {
    "secret-protection": ["CTRL-0001"],
  };

  const FACET_ADDS = [
    { when: (c) => (c.trees || []).includes("references"), add: ["reference-closure"] },
    {
      when: (c) => (c.trees || []).some((t) => t === "scripts" || t === "repo-tools"),
      add: ["testing-evidence", "secret-protection"],
    },
    {
      when: (c) => ["commit", "tag", "release"].includes(c.write_boundary),
      add: ["git-write", "secret-protection"],
    },
    { when: (c) => c.write_boundary === "release", add: ["release-governance"] },
    {
      when: (c) => (c.artifacts || []).includes("plan") && c.scale === "large",
      add: ["discovery-ledger", "plan-delivery"],
    },
    { when: (c) => c.phase === "validate", add: ["testing-evidence"] },
  ];

  function resolve(taskClass, context) {
    context = context || {};
    const order = [];
    const seen = new Set();
    function push(id) {
      if (!id || seen.has(id)) return;
      seen.add(id);
      order.push(id);
    }

    ALWAYS.forEach(push);

    if (taskClass === "unknown" || !TRIGGERS.hasOwnProperty(taskClass)) {
      return {
        capabilities: order.slice(),
        read_set: order.slice(),
        run_set: [],
        defer_set: ["ask-user", "expand-entry"],
        unmatched: true,
      };
    }

    (TRIGGERS[taskClass] || []).forEach(push);
    for (const rule of FACET_ADDS) {
      if (rule.when(context)) rule.add.forEach(push);
    }

    let read = order.slice();
    let defer = [];
    if (read.length > BUDGET) {
      defer = read.slice(BUDGET);
      read = read.slice(0, BUDGET);
    }

    const run = [];
    for (const cap of order) {
      for (const ctrl of BINDS[cap] || []) {
        if (!run.includes(ctrl)) run.push(ctrl);
      }
    }

    return {
      capabilities: order,
      read_set: read,
      run_set: run,
      defer_set: defer,
      unmatched: false,
    };
  }

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
    const got = resolve("edit_docs", { trees: ["docs"], artifacts: ["research"] });
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
    const got = resolve("edit_scripts", { trees: ["scripts"] });
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
    const got = resolve("git_write", { write_boundary: "commit" });
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
    const got = resolve("repair", { phase: "implement" });
    // order: always(2) + repair triggers(8) = 10 → read 8, defer 2
    // repair triggers: change-hygiene, reference-closure, testing-evidence,
    //   root-cause-repair, discovery-ledger, review-implementation, security-baseline, rule-capture
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
    const got = resolve("plan_write", { artifacts: ["plan"], phase: "plan" });
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
    const got = resolve("unknown", {});
    return assertResult("F6", got, {
      unmatched: true,
      read_set: ["thin-entry", "context-economy"],
      run_set: [],
      defer_set: ["ask-user", "expand-entry"],
    });
  });

  test("routing budget never drops bound controls", () => {
    // Force many caps that include secret-protection; run_set must keep CTRL-0001
    const got = resolve("release", { write_boundary: "release" });
    if (!got.run_set.includes("CTRL-0001")) {
      console.error("  expected CTRL-0001 in run_set", got);
      return false;
    }
    if (got.read_set.length > BUDGET) {
      console.error("  read_set over budget", got.read_set);
      return false;
    }
    return true;
  });
};
