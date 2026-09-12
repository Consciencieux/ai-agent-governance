#!/usr/bin/env node
// REPO-ONLY — Phase 5b Dispatcher CLI (PLAN-0039).
// Usage:
//   node repo-tools/route-task.js --task edit_docs --trees docs
//   node repo-tools/route-task.js --path docs/research/RESEARCH-0012-task-capability-routing.md
//   node repo-tools/route-task.js --task repair --json
// Exit 0 always on successful resolve; exit 2 on usage error.
"use strict";

const { route, loadGraph } = require("./lib/routing");

function printHelp() {
  console.log(`Usage:
  node repo-tools/route-task.js --task <task_class> [options]
  node repo-tools/route-task.js --path <file> [--path <file> ...] [options]

Options:
  --task <id>              Explicit task_class (wins over path inference)
  --path <file>            Path hint(s) for Context Detector
  --trees <a,b>            Context trees facet
  --phase <id>             Context phase facet
  --artifacts <a,b>        Context artifacts facet
  --write-boundary <id>    none|worktree|commit|tag|release
  --scale <id>             e.g. large (plan facet)
  --json                   Print full JSON (detection + RoutingResult)
  --help                   This help

RoutingResult fields: read_set · run_set · defer_set · unmatched
Graph: docs/research/routing/graph.v0.json (human map = task-capability-map.md)`);
}

function csv(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const out = {
    task: null,
    paths: [],
    trees: null,
    phase: null,
    artifacts: null,
    write_boundary: null,
    scale: null,
    json: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--json") out.json = true;
    else if (a === "--task") out.task = next();
    else if (a === "--path") out.paths.push(next());
    else if (a === "--trees") out.trees = csv(next());
    else if (a === "--phase") out.phase = next();
    else if (a === "--artifacts") out.artifacts = csv(next());
    else if (a === "--write-boundary") out.write_boundary = next();
    else if (a === "--scale") out.scale = next();
    else if (a.startsWith("-")) {
      throw new Error(`unknown option: ${a}`);
    } else {
      out.paths.push(a);
    }
  }
  return out;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    printHelp();
    process.exit(2);
  }

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.task && args.paths.length === 0 && !args.write_boundary) {
    console.error("need --task and/or --path (or --write-boundary)");
    printHelp();
    process.exit(2);
  }

  const input = {
    task: args.task || undefined,
    paths: args.paths,
    trees: args.trees || undefined,
    phase: args.phase || undefined,
    artifacts: args.artifacts || undefined,
    write_boundary: args.write_boundary || undefined,
    scale: args.scale || undefined,
  };

  const graph = loadGraph();
  const { detection, result, authorities } = route(input, graph);

  if (args.json) {
    console.log(
      JSON.stringify({ detection, result, authorities, budget: graph.budget }, null, 2)
    );
    process.exit(0);
  }

  console.log(`task_class: ${detection.task_class}  (source=${detection.source})`);
  if (detection.unmatched_hint) console.log(`hint: ${detection.unmatched_hint}`);
  console.log(`unmatched: ${result.unmatched}`);
  console.log(`read_set (${result.read_set.length}): ${result.read_set.join(", ") || "—"}`);
  console.log(`run_set  (${result.run_set.length}): ${result.run_set.join(", ") || "—"}`);
  console.log(`defer_set (${result.defer_set.length}): ${result.defer_set.join(", ") || "—"}`);
  if (authorities && authorities.length) {
    console.log(
      `authorities (${authorities.length}): ${authorities.map((a) => a.path).join(", ")}`
    );
  }
  process.exit(0);
}

main();
