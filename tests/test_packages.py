import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import zipfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import package_skills as package


class PackagingTests(unittest.TestCase):
    def test_current_source(self):
        package.validate_source(ROOT)

    def test_frontmatter_accepts_quoted_and_multiline_yaml(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'SKILL.md'
            p.write_text('---\nname: "sample"\ndescription: >-\n  First line\n  second line.\nlicense: MIT\n---\nWrite the result.\n', encoding='utf-8')
            package.validate_entry(p, 'sample')

    def test_wrong_entry_name(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'SKILL.md'
            p.write_text('---\nname: other\ndescription: Test\n---\nBody\n', encoding='utf-8')
            with self.assertRaisesRegex(package.PackageError, 'expected skill name'):
                package.validate_entry(p, 'sample')

    def test_empty_description(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'SKILL.md'
            p.write_text('---\nname: sample\ndescription: ""\n---\nBody\n', encoding='utf-8')
            with self.assertRaisesRegex(package.PackageError, 'description'):
                package.validate_entry(p, 'sample')

    def test_missing_target(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'a.md'
            p.write_text('[Read](missing.md)\n', encoding='utf-8')
            with self.assertRaisesRegex(package.PackageError, 'missing target'):
                package.check_links(Path(tmp))

    def test_missing_anchor(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'a.md').write_text('[Read](b.md#nope)\n', encoding='utf-8')
            (root / 'b.md').write_text('# B\n', encoding='utf-8')
            with self.assertRaisesRegex(package.PackageError, 'missing anchor'):
                package.check_links(root)

    def test_table_links_are_checked(self):
        urls = package.links('| Task | Read |\n| --- | --- |\n| Fix | [Rule](rule.md) |\n')
        self.assertEqual(urls, ['rule.md'])

    def test_code_links_are_not_resources(self):
        text = '`[sample](missing.md)`\n\n```md\n[other](also-missing.md)\n```\n'
        self.assertEqual(package.links(text), [])

    def test_rewrite_keeps_examples_and_resolves_actual_links(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source, dest = root / 'source/a.md', root / 'stage/role/SKILL.md'
            paths = {root / 'source/b.md': root / 'stage/role/shared/b.md'}
            text = '[read](b.md) and `[read](b.md)`\n\n```md\n[read](b.md)\n```\n'
            out = package.rewrite(text, source, dest, paths)
            self.assertIn('[read](shared/b.md)', out)
            self.assertIn('`[read](b.md)`', out)
            self.assertIn('```md\n[read](b.md)\n```', out)

    def test_reference_style_links(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            text = '[read][rule]\n\n[rule]: b.md\n'
            out = package.rewrite(text, root / 'a.md', root / 'stage/SKILL.md',
                                  {root / 'b.md': root / 'stage/shared/b.md'})
            self.assertEqual(package.links(out), ['shared/b.md'])

    def test_actual_bundle_and_cross_role_links(self):
        with tempfile.TemporaryDirectory(prefix='包 test ') as tmp:
            temp = Path(tmp)
            archive = package.build(ROOT, temp / 'out')
            target = temp / 'installed'
            with zipfile.ZipFile(archive) as z:
                self.assertEqual({n.split('/')[0] for n in z.namelist()}, set(package.ROLES))
                self.assertTrue(all(not n.endswith('.py') for n in z.namelist()))
                z.extractall(target)
            package.check_links(target)
            for name in package.ROLES:
                package.validate_entry(target / name / 'SKILL.md', name)
                self.assertEqual((target / name / 'LICENSE').read_bytes(), (ROOT / 'LICENSE').read_bytes())
                self.assertEqual((target / name / 'shared/core.md').read_bytes(), (ROOT / 'shared/core.md').read_bytes())
                for domain in package.DOMAINS:
                    self.assertEqual((target / name / f'shared/standards/{domain}.md').read_bytes(),
                                     (ROOT / f'shared/standards/{domain}.md').read_bytes())
            entry = (target / package.ROLES[0] / 'SKILL.md').read_text(encoding='utf-8')
            self.assertIn('../agent-review/SKILL.md', entry)
            self.assertIn('../agent-project/SKILL.md', entry)
            self.assertEqual((temp / 'out/SHA256SUMS').read_text().split()[0],
                             hashlib.sha256(archive.read_bytes()).hexdigest())

    def test_broken_installed_dependency_is_caught(self):
        with tempfile.TemporaryDirectory() as tmp:
            temp = Path(tmp)
            package.stage_all(ROOT, temp)
            (temp / 'agent-project/shared/core.md').unlink()
            with self.assertRaisesRegex(package.PackageError, 'missing target'):
                package.check_links(temp)

    def test_missing_method_blocks_source_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            temp = Path(tmp)
            for p in package.files(ROOT):
                out = temp / p.relative_to(ROOT)
                out.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(p, out)
            (temp / 'references/diagnose.md').unlink()
            with self.assertRaisesRegex(package.PackageError, 'missing target'):
                package.validate_source(temp)

    def test_eval_resources_are_present_and_reachable(self):
        cases = json.loads((ROOT / 'evals/cases.json').read_text(encoding='utf-8'))
        self.assertEqual(len(cases), len({c['id'] for c in cases}))
        for c in cases:
            with self.subTest(case=c['id']):
                self.assertIn(c['skill'], package.ROLES)
                self.assertTrue(c['task'] and c['expected'] and c['avoid'])
                for f in c['fixtures']:
                    self.assertTrue((ROOT / 'evals' / f).exists(), f)
                if 'oracle' in c:
                    self.assertTrue((ROOT / 'evals' / c['oracle']).is_file())
                entry = package.entries(ROOT)[c['skill']]
                reachable = {package.target(entry, u) for u in package.links(entry.read_text(encoding='utf-8'))
                             if not u.startswith('https://')}
                for resource in c['required_resources']:
                    parts = urlsplit(resource)
                    path = (ROOT / unquote(parts.path)).resolve()
                    self.assertIn(path, reachable, resource)
                    if parts.fragment:
                        self.assertIn(f'<a id="{unquote(parts.fragment)}"></a>',
                                      path.read_text(encoding='utf-8'), resource)


if __name__ == '__main__':
    unittest.main()
