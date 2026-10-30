# Break an agent's film-making session (Claude Code jsonl) into time per step
import json, re, sys, collections
from datetime import datetime

def ts(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()

def category(name, inp):
    if name == 'Bash' or name == 'PowerShell':
        c = inp.get('command', '')
        m = re.search(r'openfilm(?:\.cmd)?\s+(get|look|render|export|open|check|skills?|edit|new)\b(\s+[\w-]+)?', c)
        if m:
            sub = m.group(1)
            if sub == 'get':
                kind = (m.group(2) or '').strip()
                return f'openfilm get {kind}'
            return f'openfilm {sub}'
        if 'ffmpeg' in c or 'ffprobe' in c: return 'ffmpeg/ffprobe'
        if re.search(r'\bsleep\b|Start-Sleep|timeout /t', c): return 'sleep/wait'
        if re.search(r'npm|npx|pip|pnpm', c): return 'npm/npx other'
        if re.search(r'python|node ', c): return 'own script'
        if re.search(r'curl|Invoke-WebRequest|wget', c): return 'download'
        return 'shell other'
    if name in ('Write', 'Edit', 'MultiEdit'):
        p = inp.get('file_path', '')
        ext = p.rsplit('.', 1)[-1].lower() if '.' in p else ''
        base = p.replace('\\', '/').rsplit('/', 1)[-1]
        if base == 'film.html': return f'{name} film.html'
        if ext == 'html': return f'{name} page .html'
        return f'{name} other'
    if name.startswith('mcp__'):
        return 'mcp ' + name.split('__')[1]
    return name

def analyse(path):
    ev = []  # (t, kind, payload)
    for line in open(path, encoding='utf-8'):
        try: o = json.loads(line)
        except Exception: continue
        t = o.get('timestamp')
        if not t or o.get('isSidechain'): continue
        msg = o.get('message') or {}
        content = msg.get('content')
        if o.get('type') == 'user':
            if isinstance(content, str):
                ev.append((ts(t), 'prompt', content[:80]))
            elif isinstance(content, list):
                for b in content:
                    if b.get('type') == 'tool_result':
                        ev.append((ts(t), 'result', b.get('tool_use_id')))
                    elif b.get('type') == 'text' and not o.get('isMeta'):
                        ev.append((ts(t), 'prompt', b.get('text', '')[:80]))
        elif o.get('type') == 'assistant' and isinstance(content, list):
            for b in content:
                if b.get('type') == 'tool_use':
                    ev.append((ts(t), 'use', (b['id'], b['name'], b.get('input', {}))))
                elif b.get('type') == 'text':
                    ev.append((ts(t), 'text', b.get('text', '')[:60]))
    ev.sort(key=lambda e: e[0])
    tool_time = collections.Counter(); tool_n = collections.Counter()
    think_time = collections.Counter()  # model time spent producing each tool call
    pending = {}
    last = None  # time the model got control back
    prompts = []
    for t, kind, p in ev:
        if kind == 'prompt':
            prompts.append((t, p)); last = t
        elif kind == 'use':
            uid, name, inp = p
            cat = category(name, inp)
            if last is not None and t - last < 1800:
                think_time[cat] += t - last
            pending[uid] = (t, cat)
            last = t
        elif kind == 'result':
            if p in pending:
                t0, cat = pending.pop(p)
                d = t - t0
                if d < 3600:
                    tool_time[cat] += d; tool_n[cat] += 1
            last = t
        elif kind == 'text':
            if last is not None and t - last < 1800:
                think_time['(reply text)'] += t - last
            last = t
    span = ev[-1][0] - ev[0][0] if ev else 0
    return tool_time, tool_n, think_time, prompts, span

if __name__ == '__main__':
    TT = collections.Counter(); TN = collections.Counter(); TH = collections.Counter()
    for path in sys.argv[1:]:
        tt, tn, th, prompts, span = analyse(path)
        print(f'\n### {path[-80:]}  span {span/60:.1f} min, prompts {len(prompts)}, tools {sum(tt.values())/60:.1f} min, model {sum(th.values())/60:.1f} min')
        TT.update(tt); TN.update(tn); TH.update(th)
    print('\n== tool run time (all sessions) ==')
    for k, v in TT.most_common(25): print(f'{v/60:7.1f} min  x{TN[k]:<4} {k}')
    print('\n== model time before each kind of call ==')
    for k, v in TH.most_common(25): print(f'{v/60:7.1f} min  {k}')
