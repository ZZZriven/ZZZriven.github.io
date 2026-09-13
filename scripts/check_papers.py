#!/usr/bin/env python3
"""Reject incomplete notes, dangling citations and invalid reviewed classifications."""
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]

def check():
    papers = json.loads((ROOT / 'content/papers.json').read_text())
    notes = json.loads((ROOT / 'content/deep-notes.json').read_text())
    taxonomy = json.loads((ROOT / 'content/taxonomy.json').read_text())
    ts = (ROOT / 'lib/papers.ts').read_text()
    sections = re.findall(r"\{id:'([^']+)'", (ROOT / 'lib/notes.ts').read_text())
    errors = []
    def require(condition, message):
        if not condition:
            errors.append(message)
    def enum(name):
        match = re.search(r'export const ' + name + r' = \[([^\]]+)\]', ts)
        return set(re.findall(r"'([^']+)'", match[1])[1:])
    targets, types, roles, persistence, evidence = map(enum, ['categories', 'paperTypes', 'loopRoles', 'retentionTypes', 'evidenceTypes'])
    ids = [p['id'] for p in papers]
    require(len(ids) == len(set(ids)), 'Duplicate curated paper IDs')
    require(set(ids) == set(notes) == set(taxonomy), 'The three curated files must contain identical ID sets')
    count = 0
    for paper in papers:
        pid = paper['id']
        if pid not in notes or pid not in taxonomy:
            continue
        note, tax = notes[pid], taxonomy[pid]
        require(bool(paper.get('en')) and bool(paper.get('version')), f'{pid}: missing original title or version')
        for obj in [note, tax]:
            try:
                require(date.fromisoformat(obj['reviewedAt']) <= date.today(), f'{pid}: future review date')
            except (KeyError, ValueError):
                errors.append(f'{pid}: invalid review date')
        require(bool(note.get('coverage')), f'{pid}: missing verification scope')
        require(set(note['sections']) == set(sections), f'{pid}: all twelve sections are required')
        refs = {r['id']: r for r in note['references']}
        require(len(refs) == len(note['references']), f'{pid}: duplicate reference IDs')
        require('paper' in refs and pid + paper['version'] in refs['paper']['url'], f'{pid}: primary reference must pin the reviewed version')
        for rid, ref in refs.items():
            url = urlparse(ref['url'])
            require(url.scheme == 'https' and bool(url.netloc), f'{pid}/{rid}: invalid source URL')
            require(bool(ref.get('title')) and bool(ref.get('scope')), f'{pid}/{rid}: incomplete source')
        for sid, blocks in note['sections'].items():
            require(bool(blocks), f'{pid}/{sid}: empty section')
            for block in blocks:
                require(block['kind'] in {'paper', 'prior', 'inference', 'hypothesis'}, f'{pid}/{sid}: invalid information kind')
                require(bool(block.get('text', '').strip()), f'{pid}/{sid}: empty explanation')
                require(not re.search(r'TODO|TBD|待补充|解析即将', block['text'], re.I), f'{pid}/{sid}: unfinished placeholder')
                require(block['kind'] == 'hypothesis' or bool(block.get('refs')), f'{pid}/{sid}: missing supporting source')
                require(set(block.get('refs', [])) <= set(refs), f'{pid}/{sid}: dangling citation')
                if sid == 'idea-reconstruction':
                    require(block['kind'] == 'inference', f'{pid}: reconstruction must be marked Inference')
                if sid in {'reproduction', 'counterexample'}:
                    require(block['kind'] in {'hypothesis', 'prior'}, f'{pid}/{sid}: proposed experiment cannot be reported as completed')
        require(tax['paperType'] in types, f'{pid}: invalid Paper Type')
        require(set(tax['topics']) <= targets, f'{pid}: invalid topics')
        require(bool(tax['variants']), f'{pid}: no classified variants')
        names = [v['name'] for v in tax['variants']]
        require(len(names) == len(set(names)), f'{pid}: duplicate variant names')
        for v in tax['variants']:
            count += 1
            label = f'{pid}/{v["name"]}'
            require(set(v['targets']) <= targets and set(v['targets']) <= set(tax['topics']), label + ': invalid targets')
            require(set(v['roles']) <= roles, label + ': invalid roles')
            require(v['persistence'] in persistence, label + ': invalid persistence')
            require(set(v['evidence']) <= evidence and bool(v['evidence']), label + ': invalid evidence')
            require(v['recursiveReuse'] in {'Demonstrated', 'Not Demonstrated', 'Unclear', 'Not Applicable'}, label + ': invalid reuse status')
            require(v['recursiveReuse'] != 'Demonstrated' or 'Recursive Reuse' in v['evidence'], label + ': demonstrated reuse needs explicit evidence')
            require(v['persistence'] != 'Ephemeral' or not v['targets'], label + ': ephemeral task artifacts cannot become persistent system targets')
            for field in ['boundary', 'rationale', 'feedback', 'scope', 'source']:
                require(bool(v.get(field)), label + ': missing ' + field)
            require(pid + paper['version'] in v['source'], label + ': unpinned variant source')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Validated {len(ids)} papers, {len(ids) * len(sections)} analysis sections and {count} experiment variants; all citations resolve.')

if __name__ == '__main__':
    check()
