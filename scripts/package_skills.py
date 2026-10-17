#!/usr/bin/env python3
"""Check source links and build the three-Skill installation bundle."""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import unquote, urlsplit
import zipfile

from markdown_it import MarkdownIt
import yaml

ROOT = Path(__file__).resolve().parents[1]
ROLES = ('ai-agent-governance', 'agent-review', 'agent-project')
DOMAINS = ('engineering', 'changes', 'verification', 'knowledge', 'permissions', 'security')
SKIP = {'.git', 'dist', '__pycache__', '.venv', '.pytest_cache', '.DS_Store'}
MD = MarkdownIt('commonmark').enable('table')
RULE = re.compile(r'^## ((?:ENG|CHG|VER|KNOW|PERM|SEC)-\d{2})\b', re.M)
FRONT = re.compile(r'\A---\s*\n(.*?)\n---\s*\n', re.S)


class PackageError(ValueError):
    """A source resource or package reference needs correction."""


def files(root: Path):
    for path in sorted(root.rglob('*')):
        parts = path.relative_to(root).parts
        if any(p in SKIP or p.startswith('._') or p.endswith('.pyc') for p in parts):
            continue
        if parts[:2] == ('evals', 'runs'):
            continue
        if path.is_file():
            yield path


def links(text: str) -> list[str]:
    result = []
    for token in MD.parse(text):
        for child in token.children or []:
            if child.type in ('link_open', 'image'):
                value = child.attrGet('href' if child.type == 'link_open' else 'src')
                if value and value not in result:
                    result.append(value)
    return result


def target(source: Path, url: str) -> Path:
    path = unquote(urlsplit(url).path)
    if not path:
        return source.resolve()
    return Path(os.path.abspath(source.parent / path)).resolve()


def check_links(root: Path) -> None:
    for source in files(root):
        if source.suffix != '.md':
            continue
        for url in links(source.read_text(encoding='utf-8')):
            parts = urlsplit(url)
            if parts.scheme or parts.netloc:
                continue
            dest = target(source, url)
            if not dest.exists():
                raise PackageError(f'{source}: missing target {url}')
            if parts.fragment and dest.suffix == '.md' and dest.is_file():
                anchors = re.findall(r'<a id="([^"]+)"></a>', dest.read_text(encoding='utf-8'))
                if unquote(parts.fragment) not in anchors:
                    raise PackageError(f'{source}: missing anchor {url}')


def validate_entry(path: Path, name: str) -> None:
    text = path.read_text(encoding='utf-8-sig')
    front = FRONT.match(text)
    if not front:
        raise PackageError(f'{path}: YAML frontmatter required')
    try:
        data = yaml.safe_load(front[1])
    except yaml.YAMLError as error:
        raise PackageError(f'{path}: {error}') from error
    if not isinstance(data, dict) or data.get('name') != name:
        raise PackageError(f'{path}: expected skill name {name}')
    desc = data.get('description')
    if not isinstance(desc, str) or not 1 <= len(desc.strip()) <= 1024:
        raise PackageError(f'{path}: description must contain 1–1024 characters')
    if not text[front.end():].strip():
        raise PackageError(f'{path}: instructions required')


def entries(root: Path) -> dict[str, Path]:
    return {name: root / ('SKILL.md' if name == ROLES[0] else f'skills/{name}/SKILL.md')
            for name in ROLES}


def standard_ids(root: Path) -> set[str]:
    result = set()
    for domain in DOMAINS:
        p = root / 'shared/standards' / f'{domain}.md'
        body = p.read_text(encoding='utf-8')
        found = RULE.findall(body)
        if not found:
            raise PackageError(f'{p}: missing standard sections')
        for name in found:
            if name in result or f'<a id="{name.lower()}"></a>' not in body:
                raise PackageError(f'{p}: duplicate standard or missing anchor {name}')
            result.add(name)
    return result


def validate_source(root: Path) -> None:
    for name, entry in entries(root).items():
        validate_entry(entry, name)
    for path in ('LICENSE', 'VERSION', 'shared/core.md', 'shared/context.md', 'shared/tools.md'):
        if not (root / path).is_file():
            raise PackageError(f'missing source resource: {path}')
    standard_ids(root)
    check_links(root)


def mapping(root: Path, stage: Path, name: str) -> dict[Path, Path]:
    dest = stage / name
    result = {
        (root / 'LICENSE').resolve(): dest / 'LICENSE',
        entries(root)[name].resolve(): dest / 'SKILL.md',
    }
    base = root if name == ROLES[0] else root / 'skills' / name
    for folder in ('references',):
        for p in files(base / folder):
            result[p.resolve()] = dest / p.relative_to(base)
    for folder in ('shared', 'assets'):
        for p in files(root / folder):
            result[p.resolve()] = dest / p.relative_to(root)
    return result


def rewrite(text: str, source: Path, dest: Path, paths: dict[Path, Path]) -> str:
    resolved_paths = {Path(key).resolve(): value for key, value in paths.items()}
    replacements = {}
    for url in links(text):
        parts = urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path:
            continue
        old_target = target(source, url)
        if old_target not in resolved_paths:
            raise PackageError(f'{source}: package lacks {url}')
        new = Path(os.path.relpath(resolved_paths[old_target], dest.parent)).as_posix()
        new += ('?' + parts.query) if parts.query else ''
        new += ('#' + parts.fragment) if parts.fragment else ''
        replacements[url] = new
    # Use the parser's code-block ranges so examples keep their original text.
    protected = set()
    for token in MD.parse(text):
        if token.type in ('fence', 'code_block') and token.map:
            protected.update(range(*token.map))
    output = []
    for line_number, line in enumerate(text.splitlines(keepends=True)):
        if line_number not in protected:
            chunks = re.split(r'(`+[^`]*`+)', line)
            for i in range(0, len(chunks), 2):
                for old, new in replacements.items():
                    chunks[i] = chunks[i].replace(f']({old})', f']({new})')
                    chunks[i] = re.sub(r'(^\s*\[[^\]]+\]:\s*)' + re.escape(old) + r'(?=\s|$)',
                                       lambda m: m[1] + new, chunks[i])
                line = ''.join(chunks)
        output.append(line)
    return ''.join(output)


def stage_all(root: Path, stage: Path) -> None:
    entry_map = {p.resolve(): stage / name / 'SKILL.md' for name, p in entries(root).items()}
    for name in ROLES:
        current = mapping(root, stage, name)
        for source, dest in current.items():
            data = source.read_bytes()
            if source.suffix == '.md':
                data = rewrite(data.decode('utf-8'), source, dest, entry_map | current).encode('utf-8')
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
    for name in ROLES:
        validate_entry(stage / name / 'SKILL.md', name)
    check_links(stage)


def build(root: Path, output: Path) -> Path:
    root = root.resolve()
    validate_source(root)
    output.mkdir(parents=True, exist_ok=True)
    archive_path = output / 'ai-agent-governance-skills.zip'
    with tempfile.TemporaryDirectory(prefix='agent-skills-') as tmp:
        stage = Path(tmp)
        stage_all(root, stage)
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in files(stage):
                archive.write(path, path.relative_to(stage).as_posix())
    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    (output / 'SHA256SUMS').write_text(f'{digest}  {archive_path.name}\n', encoding='utf-8')
    return archive_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true', help='validate source resources and links')
    parser.add_argument('--output-dir', default='dist', help='installation ZIP output directory')
    args = parser.parse_args(argv)
    try:
        if args.check_only:
            validate_source(ROOT)
            print('Source resources and links passed.')
        else:
            output = Path(args.output_dir)
            print(build(ROOT, output if output.is_absolute() else ROOT / output))
        return 0
    except (OSError, ValueError) as error:
        parser.exit(1, f'ERROR: {error}\n')


if __name__ == '__main__':
    raise SystemExit(main())
