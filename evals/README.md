# Evals

How this skill was tried. Nothing here goes to the agent: only `skills/` is installed.

On request 1, which asks for a rough cut, the arm without the skill also made a rough cut on the timeline, in about the same
time and for about the same cost, so the skill was not clearly better there. On request 2, which does not ask for one, the arm
with the skill stopped at a preview on the timeline after 1.4 minutes and $0.21. The arm without it never opened OpenFilm and
delivered a finished MP4 after 23.3 minutes and $0.77. No person saw either result, so which they would prefer is not known.

## What was run

| | |
| --- | --- |
| Skill | preview-first 0.2.1 |
| Agent and model | Claude Code 2.1.310, headless, model `claude-sonnet-5-5` (the `sonnet` alias), 70 turns at most |
| OpenFilm | 0.3.0, exact version, in both arms |
| Date and system | 6 to 7 November 2026, Windows 11 |
| Arms | one isolated project and OpenFilm home each; the skill folder is the only difference. A voice service on the same computer was listed for both arms. No paid service was connected in either. |
| Runs | each request once in each arm. Four more short runs tried the description (below). Eight runs, $1.78 in all. |

Material, for request 1: seven NASA and U.S. Navy photos of Apollo 11 from Wikimedia Commons, all public domain, and a
`captions.txt` written from their descriptions. Request 2: nine short clips of Iceland from Wikimedia Commons (CC BY 3.0,
CC BY-SA 3.0 and 4.0, authors Solitary Backpacker, Matti Ernuson, Arctic Adventures Iceland, Alexander Grebenkov and Jacklee),
and a `notes.txt` saying what each clip shows. Three clips were Theora and were converted to H.264. The material is not in
this repository. No clip has speech (Whisper large-v3 found none), so there are no transcripts.

## Request 1

```text
I'm giving a talk to my history class on the Apollo 11 landing. The photos are in this folder, and captions.txt has what NASA says about each one. I'd like a 3-minute film for the talk, landscape, with a voice-over and some quiet music underneath. Before you spend time on the voice and the music, give me a rough cut I can look at so I can change the order.
```

| | with | without |
| --- | --- | --- |
| Read the skill | yes, its first call | no |
| Run: minutes, turns, cost | 0.8, 11, $0.14 | 1.6, 10, $0.13 |
| First whole film on the timeline | 0.6 min, about $0.11 | 1.1 min, about $0.09 |
| The film | 9 placeholder cards on one track, 165.2 s of the 180 s asked | 7 photos on a picture track over a blurred copy of each, 179.9 s |
| The 7 photos | 7 of 7 named on cards | 7 of 7 shown |
| Planned words for each section | 9 of 9 cards; 2.5 words a second, every card between 1.8 and 3.3 | none; each photo 25.7 s |
| Voice, music, render, export | none | none |
| Ended with | a question: change the order or the text first? | a statement: once the order is right, it writes the narration |
| What it told the person | what voice (about 400 words) and music (about 3 minutes) would ask; one figure not in the captions | the order it used, and that the last two photos may swap |
| Preview time it reported | "about a minute"; measured 0.6 min to the last write | none |

Seen, read from contact sheets and frames: the cards are light type on a dark ground, each with its title, the photo's file
name, the planned words and the word count and length at the foot; the text is legible at sheet size. The arm without the
skill shows the seven photos, full height with blurred sides, in the order of the captions. Its film.html gives every photo a
slow 4% push, which a sheet does not show. Neither film was played.

The arm without the skill gave the better picture of the order. The arm with it gave words for every section and a count of
what the later stages would ask.

## Request 2

```text
我去冰岛拍了这些视频，都在这个文件夹里，notes.txt 里写了每段拍的是什么。帮我剪成一条 4 分钟左右的竖屏短片，发小红书，要中文配音和背景音乐。
```

| | with | without |
| --- | --- | --- |
| Read the skill | yes, its first call | no |
| Run: minutes, turns, cost | 1.4, 13, $0.21 | 23.3, 34, $0.77 |
| First whole film | on the timeline at 1.1 min, about $0.17 | none on the timeline; the finished MP4 came at 23.3 min |
| OpenFilm used | yes, 10 cards in `film.html`, 241 s of about 240 s, 1080x1920 | no: no `openfilm` call and no `film.html` |
| The clips | 9 of 9 named on cards | used, in a 228.1 s MP4 made with ffmpeg and Python, 1080x1920 |
| Planned words for each section | 10 of 10 cards; 4.2 characters a second, every card between 3.2 and 6.2 | voice-over read from a script the agent wrote |
| Voice and music | none | voice from an online text-to-speech service (its own message says the sentences were sent to it); music written in code; subtitles burned in |
| Stopped for a decision | yes: questions about clip lengths, cropping, music, and which details were invented | no; it listed six things to check after the film was done |
| Preview time it reported | "about a minute"; measured 1.1 min | none |

Seen, read from contact sheets and frames: ten portrait cards, each with its place in the ten, its length, its title, a box
naming the clip and a box with the planned voice-over and its character count; the text is legible at sheet size. The arm
without the skill made a sheet of 12 frames with ffmpeg because `look` needs a project and this arm made none: landscape
clips sit in a middle band over blurred copies, a clip label is top left, Chinese subtitles are in the lower part, and the
glacier clip's brand mark shows lower right in several frames. The agent says in its message that it left the mark in.

The arm with the skill flagged that two clips are 11 s long and sit in cards of 19 s and 22 s, and that its narration invented
details ("waited three times", "the guide said thousands of years") for the person to correct. The arm without it flagged the
brand mark and that the glacier clip does not look like the person's own.

## The description

The old description said to use the skill for every new film. Four short runs (8 turns at most) checked what the new one
does. The prompts were written before the first run.

| id | request | description | read the skill | what happened |
| --- | --- | --- | --- | --- |
| p1-old | `I need a 30-second launch film for my note-taking app, Jotbook. Landscape, with a voice-over and some music.` | 0.2.0 | yes, first call | a six-section placeholder preview in 0.9 min, $0.14 |
| p1-new | the same | 0.2.1 | no | took music from OpenFilm's library and started on the film; stopped at the turn cap, 1.3 min, $0.16 |
| p2-new | `Can you do a rough cut of a 2-minute film about how bread rises? I'll tell you what to change before you do the voice-over.` | 0.2.1 | yes, first call | 8 cards, 118.8 s, 1.1 min, $0.18; its table of lengths disagreed with `film.html` in two rows |
| p3-new | `Make me a storyboard for a 3-minute film about the history of the bicycle.` | 0.2.1 | no | a table in the chat, no tool call: it did not open OpenFilm or its canvas; $0.06 |

p1-new, p2-new and p3-new ran on the text of 0.2.1 before one clause was added to the last section of the brief ("read from
film.html as saved"), made after p2-new's table disagreed with its film. Both request runs above had the clause and their
tables matched `film.html`. Two runs do not show the clause was the cause.

## How it was measured

`node evals/measure.mjs <run folder> --want <seconds> --frame landscape|portrait --material <folder> --snap <folder>` reads
one finished run, the same way for either arm: the model from the log; minutes and cost from the run's summary; whether the
skill was read; the `film.html` (tracks, clips, length, gaps, orientation, audio clips, sound or video made outside the project);
how many of the person's files it names; the pace of the longest block of text on each card; whether the last message ends
with a question. The first whole film is the first copy of `film.html` that covers 90% of the planned length with gaps under
5%. `node evals/snap.mjs <runs folder> <snapshot folder>` copies `film.html` every two seconds while arms run. The cost at a
moment splits the run's cost over its messages by tokens, with the output tokens, which the log gives only in part, spread by
how much each message wrote; read it as an estimate. For request 2 with the skill, the snapshots began after the run, so its
first whole film is the last write of `film.html`, which is also its only film.

`npm test` checks the script on planted faults: a missing card, a sound clip, a short film, a tall frame and a closing message
with no question.

## Not tried

- The pictures and sound stages, the counted ask before paid services (no service was connected), and "go straight through".
- A person in Studio reordering or rewriting the cards.
- The canvas. The storyboard prompt shows only that the skill is left alone; nobody tried the canvas next to the skill.
- More than one run per arm, other models, or a computer other than Windows.
- A native speaker reading the Chinese narration. It was not checked and is not claimed to be good.
