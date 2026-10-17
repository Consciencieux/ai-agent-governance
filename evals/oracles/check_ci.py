"""Check P02's declared unittest-only GitHub Actions workflow."""
from __future__ import annotations

import argparse
from pathlib import Path
import shlex

import yaml


def read_only_permissions(value) -> bool:
    return value == 'read-all' or (
        isinstance(value, dict) and value.get('contents') == 'read'
        and all(v in ('read', 'none') for v in value.values())
    )


def unconditional(value) -> bool:
    if value is None:
        return True
    condition = str(value).strip()
    if condition.startswith('${{') and condition.endswith('}}'):
        condition = condition[3:-2].strip()
    return condition in ('true', 'always()', 'success()')


def check(root: Path) -> list[str]:
    workflow = root / '.github/workflows/test.yml'
    if not workflow.is_file():
        return ['missing .github/workflows/test.yml']
    try:
        data = yaml.load(workflow.read_text(encoding='utf-8'), Loader=yaml.BaseLoader)
    except (OSError, UnicodeError, yaml.YAMLError) as error:
        return [f'cannot read workflow: {error}']
    if not isinstance(data, dict):
        return ['workflow must be a mapping']
    failures = []
    events = data.get('on', {})
    if isinstance(events, str):
        events = [events]
    if not isinstance(events, (list, dict)) or not {'push', 'pull_request'} <= set(events):
        failures.append('P02 requires both push and pull_request')
    elif isinstance(events, dict):
        for name in ('push', 'pull_request'):
            if events.get(name):
                failures.append(f'P02 requests every {name}, without event filters')
    permissions = data.get('permissions')
    if not read_only_permissions(permissions):
        failures.append('declare read-only workflow permissions')
    jobs = data.get('jobs')
    if not isinstance(jobs, dict) or not jobs:
        return failures + ['missing test job']
    found_test = False
    for name, job in jobs.items():
        if not isinstance(job, dict):
            failures.append(f'invalid job: {name}')
            continue
        if 'permissions' in job and not read_only_permissions(job['permissions']):
            failures.append(f'job {name} overrides read-only permissions')
        steps = job.get('steps', [])
        if not isinstance(steps, list):
            failures.append(f'invalid steps: {name}')
            continue
        for step in steps:
            if not isinstance(step, dict):
                failures.append(f'invalid step: {name}')
                continue
            uses = str(step.get('uses', '')).lower()
            if uses.startswith('actions/upload-artifact@'):
                failures.append('P02 has no artifact upload requirement')
            run = str(step.get('run', ''))
            for line in run.splitlines():
                try:
                    args = shlex.split(line.strip(), comments=True)
                except ValueError:
                    failures.append('invalid run command quoting')
                    continue
                if not args:
                    continue
                if args[0] in ('npm', 'npx', 'cargo', 'mvn') or args[:2] == ['python', '-m'] and len(args) > 2 and args[2] in ('build', 'ruff', 'mypy'):
                    failures.append(f'undeclared P02 command: {args[0]}')
                if args in (
                    ['python', '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
                    ['python3', '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
                ):
                    found_test = True
                    for scope in (job, step):
                        if not unconditional(scope.get('if')) or scope.get('continue-on-error') not in (None, 'false'):
                            failures.append('test execution must run and propagate failure')
    if not found_test:
        failures.append('missing the directly invoked project unittest command')
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    args = parser.parse_args()
    issues = check(args.root)
    print('\n'.join(issues) if issues else 'P02 workflow contract passed.')
    return int(bool(issues))


if __name__ == '__main__':
    raise SystemExit(main())
