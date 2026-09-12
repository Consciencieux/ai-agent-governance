#!/usr/bin/env node
// REPO-ONLY — Task→Capability resolve + Context Detector (PLAN-0039 / Phase 5b).
// Algorithm: docs/research/routing/call-topology.md
// Graph: docs/research/routing/graph.v0.json (machine projection of task-capability-map.md)
"use strict";

const fs = require("fs");
const path = require("path");

const GRAPH_PATH = path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "research",
  "routing",
  "graph.v0.json"
);

let cachedGraph = null;

function loadGraph(graphPath) {
  const p = graphPath || GRAPH_PATH;
  if (!graphPath && cachedGraph) return cachedGraph;
  const graph = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!graphPath) cachedGraph = graph;
  return graph;
}

function facetMatches(when, context) {
  context = context || {};
  const trees = context.trees || [];
  if (when.trees_includes && !trees.includes(when.trees_includes)) return false;
  if (when.trees_any && !when.trees_any.some((t) => trees.includes(t))) return false;
  if (when.write_boundary_in) {
    if (!when.write_boundary_in.includes(context.write_boundary)) return false;
  }
  if (when.write_boundary != null && context.write_boundary !== when.write_boundary) {
    return false;
  }
  if (when.artifacts_includes) {
    const arts = context.artifacts || [];
    if (!arts.includes(when.artifacts_includes)) return false;
  }
  if (when.scale != null && context.scale !== when.scale) return false;
  if (when.phase != null && context.phase !== when.phase) return false;
  return true;
}

/**
 * Deterministic Task→Capability resolve (call-topology L4).
 * @returns {{ capabilities: string[], read_set: string[], run_set: string[], defer_set: string[], unmatched: boolean }}
 */
function resolve(taskClass, context, graph) {
  graph = graph || loadGraph();
  context = context || {};
  const budget = graph.budget || 8;
  const order = [];
  const seen = new Set();
  function push(id) {
    if (!id || seen.has(id)) return;
    seen.add(id);
    order.push(id);
  }

  (graph.always_on || []).forEach(push);

  const triggers = graph.triggers || {};
  if (taskClass === "unknown" || !Object.prototype.hasOwnProperty.call(triggers, taskClass)) {
    return {
      capabilities: order.slice(),
      read_set: order.slice(),
      run_set: [],
      defer_set: (graph.unknown_defer || ["ask-user", "expand-entry"]).slice(),
      unmatched: true,
    };
  }

  (triggers[taskClass] || []).forEach(push);
  for (const rule of graph.facet_adds || []) {
    if (facetMatches(rule.when, context)) (rule.add || []).forEach(push);
  }

  let read = order.slice();
  let defer = [];
  if (read.length > budget) {
    defer = read.slice(budget);
    read = read.slice(0, budget);
  }

  const binds = graph.binds || {};
  const run = [];
  for (const cap of order) {
    for (const ctrl of binds[cap] || []) {
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

/** Normalize path separators and strip leading ./ */
function normPath(p) {
  return String(p || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

/**
 * Path → candidate task_class (narrow heuristics). Returns null if no signal.
 */
function taskClassFromPath(p) {
  const n = normPath(p);
  const base = path.posix.basename(n);

  if (base === "SKILL.md" || base === "AGENTS.md") return "edit_skill_entry";

  if (
    n.startsWith("docs/plans/") ||
    n.startsWith("docs/plans/roadmap/") ||
    /^PLAN-\d+/.test(base)
  ) {
    return "plan_write";
  }
  if (n.startsWith("docs/findings/") || /^FINDING-\d+/.test(base)) return "finding_write";
  if (
    n.startsWith("docs/design-decisions/") ||
    n.startsWith("docs/adrs/") ||
    /^ADR-\d+/.test(base)
  ) {
    return "adr_write";
  }
  if (n.startsWith("docs/research/") || /^RESEARCH-\d+/.test(base)) return "research_write";
  if (n.startsWith("docs/")) return "edit_docs";

  if (n.startsWith("references/")) return "edit_references";
  if (n.startsWith("scripts/") || n.startsWith("repo-tools/")) return "edit_scripts";
  if (n.startsWith("tests/")) return "test_change";

  return null;
}

function treesFromPaths(paths) {
  const trees = new Set();
  for (const p of paths || []) {
    const n = normPath(p);
    const top = n.split("/")[0];
    if (top) trees.add(top);
  }
  return [...trees];
}

/**
 * Context Detector — mechanical, explicit task wins; conflict → unknown.
 * @returns {{ task_class: string, context: object, source: string, unmatched_hint?: string }}
 */
function detect(input, graph) {
  graph = graph || loadGraph();
  input = input || {};
  const known = new Set(Object.keys(graph.triggers || {}));

  const context = {
    trees: input.trees ? input.trees.slice() : treesFromPaths(input.paths),
    phase: input.phase,
    artifacts: input.artifacts ? input.artifacts.slice() : [],
    write_boundary: input.write_boundary,
    scale: input.scale,
  };

  if (input.task) {
    const t = String(input.task);
    if (!known.has(t) || t === "unknown") {
      return {
        task_class: "unknown",
        context,
        source: "explicit-unknown",
        unmatched_hint: `unknown or unsupported --task=${t}`,
      };
    }
    return { task_class: t, context, source: "explicit" };
  }

  const paths = input.paths || [];
  const inferred = [];
  for (const p of paths) {
    const c = taskClassFromPath(p);
    if (c && !inferred.includes(c)) inferred.push(c);
  }

  if (inferred.length === 0) {
    if (input.write_boundary && ["commit", "tag"].includes(input.write_boundary)) {
      return { task_class: "git_write", context, source: "write-boundary" };
    }
    if (input.write_boundary === "release") {
      return { task_class: "release", context, source: "write-boundary" };
    }
    return {
      task_class: "unknown",
      context,
      source: "no-signal",
      unmatched_hint: "no --task and no classifiable paths",
    };
  }

  if (inferred.length > 1) {
    return {
      task_class: "unknown",
      context,
      source: "conflict",
      unmatched_hint: `ambiguous task classes: ${inferred.join(", ")}`,
    };
  }

  return { task_class: inferred[0], context, source: "paths" };
}

function route(input, graph) {
  graph = graph || loadGraph();
  const detection = detect(input, graph);
  const result = resolve(detection.task_class, detection.context, graph);
  return { detection, result };
}

module.exports = {
  GRAPH_PATH,
  loadGraph,
  resolve,
  detect,
  route,
  facetMatches,
  taskClassFromPath,
};
