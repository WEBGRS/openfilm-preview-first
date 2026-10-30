# preview-first

An [OpenFilm](https://github.com/openfilm/openfilm) skill: see the whole film before anything slow is made. Within a
few minutes the agent puts every section on the timeline as a placeholder card, at its planned length, with the words
planned for it, and stops. You reorder, retime and rewrite it in Studio. Pictures come only after you say yes, and
voice-over, music and export last.

| | | |
| --- | --- | --- |
| <img src="skills/preview-first/cover.jpg" width="200" alt=""> | [Preview first](skills/preview-first) | The whole film as a quick placeholder preview, then pictures, then sound, each stage after you approve the last. |

It is for the film you left running overnight and found wrong in the morning, and for the hour-long run that
still isn't the film you asked for. Nothing that costs time or money happens on a structure you haven't seen.

## What the agent does

1. **Preview.** One card per section: its title, what will be on screen, the words planned for it. No voice-over,
   music, generated pictures, recordings or animated pages yet. It tells you how long the preview took.
2. **Pictures**, once you approve the preview. Whatever you changed in Studio is the new plan.
3. **Sound**, once you approve the pictures. Before the first paid `npx openfilm get`, it counts what the film will
   ask of each service you pay for (lines and characters of voice-over, minutes of music, pictures, video clips) and
   waits for your yes. OpenFilm never shows the agent prices, so you weigh the counts against your own plan. A service
   running on your own computer needs no ask.
4. **Export**, only when you ask.

Say "go straight through" and it does not stop.

## Use it

- **In OpenFilm**: open Skills, add one from a link, and paste `https://github.com/WEBGRS/openfilm-preview-first`.
- **In your own agent** (Claude Code, Codex and others): `npx skills add WEBGRS/openfilm-preview-first`.

The brief is all there is: no scripts, nothing installed.

## Where the time goes

`tools/film-timing.py` reads a Claude Code session log and adds up the time per step: each tool's run time, and the
model's time before each kind of call. Use it to see which stage of your own films is slow.

```sh
python tools/film-timing.py ~/.claude/projects/<project folder>/<session>.jsonl
```

## Check

```sh
node scripts/check.mjs
```

It checks the skill the way OpenFilm's official skills are checked: name, description, brief length, `openfilm.json`
in five languages, and no stray files.

## 中文说明

OpenFilm 技能：先看到整条片子，再做慢的部分。几分钟内，智能体把每一段做成一张占位卡片放上时间线：标题、这段画面放什么、这段要说的话，时长按念完这些话算，然后停下。你在 Studio 里调顺序、改时长、改文字。你点头后才做画面；配音、音乐和导出放在最后。

适合这两种情况：晚上让它自己剪，早上起来发现方向就错了；或者剪了一个小时还不是你要的片子。你没看过结构之前，它不做费时或花钱的事。

**三次停顿**：预览之后、画面之后、声音之后，每次都停下等你确认。你在 Studio 里改过的地方就是新的方案。说「一口气做完」就不停。

**花钱前先报用量**：第一次调用付费的 `npx openfilm get` 之前，智能体列出每个付费服务要用多少（几句配音、多少字，几分钟音乐，几张图，几段视频），等你同意。OpenFilm 不把价格告诉智能体，所以由你对照自己的套餐判断。跑在你自己电脑上的服务不用问。

**安装**：在 OpenFilm 的技能页点「添加 skill」，粘贴链接 `https://github.com/WEBGRS/openfilm-preview-first`；用自己的智能体（Claude Code、Codex 等）就运行 `npx skills add WEBGRS/openfilm-preview-first`。只有一份需求书，没有脚本，不装任何东西。
