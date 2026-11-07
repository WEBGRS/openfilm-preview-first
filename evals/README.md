# Evals

How this skill was tried. Nothing here goes to the agent: only `skills/` is installed.

On request 1, which asks for a rough cut, the arm without the skill also made a rough cut on the timeline, in about the same
time and for about the same cost, so the skill was not clearly better there. On request 2, which does not ask for one, the arm
with the skill stopped at a preview on the timeline after 1.4 minutes (0.2.1) and 1.9 minutes (0.2.2). The arm without it never
opened OpenFilm and delivered a finished MP4 after 23.3 minutes and $0.77. In 0.2.1 the preview was text cards that named the
person's files. In 0.2.2 it shows their own photos and clips with the planned words beside them, and that took 0.3 to 0.5
minutes longer and $0.05 to $0.09 more, one run each. No person saw any result, so which they would prefer is not known.

## What was run

| | |
| --- | --- |
| Skill | preview-first 0.2.1 and 0.2.2 (0.2.2 is the same brief with the person's own photos and clips placed in the preview) |
| Agent and model | Claude Code 2.1.310, headless, model `claude-sonnet-5-5` (the `sonnet` alias), 70 turns at most |
| OpenFilm | 0.3.0, exact version, in all arms |
| Date and system | 6 to 7 November 2026, Windows 11 |
| Arms | one isolated project and OpenFilm home each; the skill folder is the only difference. A voice service on the same computer was listed for every arm. No paid service was connected in any. |
| Runs | each request once with 0.2.1, once with 0.2.2 and once without the skill. Four more short runs tried the description (below). Ten runs, $2.28 in all. |

Material, for request 1: seven NASA and U.S. Navy photos of Apollo 11 from Wikimedia Commons, all public domain, and a
`captions.txt` written from their descriptions. Request 2: nine short clips of Iceland from Wikimedia Commons (CC BY 3.0,
CC BY-SA 3.0 and 4.0, authors Solitary Backpacker, Matti Ernuson, Arctic Adventures Iceland, Alexander Grebenkov and Jacklee),
and a `notes.txt` saying what each clip shows. Three clips were Theora and were converted to H.264. The material is not in
this repository. No clip has speech (Whisper large-v3 found none), so there are no transcripts.

## Request 1

```text
I'm giving a talk to my history class on the Apollo 11 landing. The photos are in this folder, and captions.txt has what NASA says about each one. I'd like a 3-minute film for the talk, landscape, with a voice-over and some quiet music underneath. Before you spend time on the voice and the music, give me a rough cut I can look at so I can change the order.
```

| | with 0.2.1 | with 0.2.2 | without |
| --- | --- | --- | --- |
| Read the skill | yes, its first call | yes, its first call | no |
| Run: minutes, turns, cost | 0.8, 11, $0.14 | 1.1, 15, $0.19 | 1.6, 10, $0.13 |
| First whole film on the timeline | 0.6 min, about $0.11 | 0.8 min, about $0.15 | 1.1 min, about $0.09 |
| The film | 9 cards on one track, 165.2 s of the 180 s asked | 7 sections, 177.2 s: each photo a clip, its words a page on a second track | 7 photos over a blurred copy of each, 179.9 s |
| The 7 photos | named on 7 cards, placed as clips 0 | placed as clips 7 | placed as clips 7 |
| Planned words for each section | 9 of 9 cards; 2.5 words a second, every card between 1.8 and 3.3 | 7 of 7; 2.5 words a second, all between 1.8 and 3.3 | none; each photo 25.7 s |
| Voice, music, render, export | none | none | none |
| Ended with | a question: change the order or the text first? | an invitation, no question mark: tell me the order or wording changes, or say go ahead | a statement: once the order is right, it writes the narration |
| What it told the person | what voice (about 400 words) and music (about 3 minutes) would ask; one figure not in the captions | what voice (about 440 words) and music would ask; that its connecting sentences are its own | the order it used, and that the last two photos may swap |
| Preview time it reported | "about a minute"; measured 0.6 min to the last write | "about 3 minutes"; measured 0.8 min to the last write, 1.1 for the run | none |

Seen, read from contact sheets and frames. 0.2.1: light type on a dark ground, each card with its title, the photo's file name,
the planned words and the word count and length at the foot; legible at sheet size. 0.2.2: each photo in a square box on the
left, the section number, title and planned words on the right on the same dark ground; I read the 30 s frame at full size and
the words were legible there (about 30 px type in a 1920 frame). Without the skill: the seven photos, full height with
blurred sides, in the order of the captions; its film.html gives every photo a slow 4% push, which a sheet does not show.
Neither film was played.

## Request 2

```text
我去冰岛拍了这些视频，都在这个文件夹里，notes.txt 里写了每段拍的是什么。帮我剪成一条 4 分钟左右的竖屏短片，发小红书，要中文配音和背景音乐。
```

| | with 0.2.1 | with 0.2.2 | without |
| --- | --- | --- | --- |
| Read the skill | yes, its first call | yes, its first call | no |
| Run: minutes, turns, cost | 1.4, 13, $0.21 | 1.9, 20, $0.30 | 23.3, 34, $0.77 |
| First whole film | on the timeline at 1.1 min, about $0.17 | on the timeline at 1.2 min, about $0.19 | none on the timeline; the finished MP4 came at 23.3 min |
| OpenFilm used | yes: 10 cards, 241 s, 1080x1920 | yes: 12 sections, 231 s of about 240, 1080x1920 | no: no `openfilm` call and no `film.html` |
| The 9 clips | named on 9 cards, placed as clips 0 | placed as clips 9 (11 clips, three cut from the long glacier clip), muted, trimmed with `#t=` | used in a 228.1 s MP4 made with ffmpeg and Python |
| Planned words for each section | 10 of 10 cards; 4.2 characters a second, all between 3.2 and 6.2 | 12 of 12; median 3.5, all between 3.2 and 6.2 | voice-over read from a script the agent wrote |
| Voice and music | none | none | voice from an online text-to-speech service (its own message says the sentences were sent to it); music written in code; subtitles burned in |
| Stopped for a decision | yes: questions about clip lengths, cropping, music, invented details | yes: three questions about structure, the picture step and going on to voice and music | no; it listed six things to check after the film was done |
| Preview time it reported | "about a minute"; measured 1.1 min | "about 1.5 minutes"; measured 1.5 min to the last write, 1.9 for the run | none |

Seen, read from contact sheets and frames. 0.2.1: ten portrait cards, each with its place in the ten, its length, its title, a
box naming the clip and a box with the planned voice-over and its character count; legible at sheet size. 0.2.2: the clip fills
the top 1380 px of the 1080x1920 frame and the section number, title and planned words sit in a dark panel under it; I read the
15 s frame at full size and the white type on the dark panel was legible. Landscape clips are cropped to fill the portrait box,
and the 640x480 Gullfoss clip looks soft cropped that way.
Without the skill: I made a sheet of 12 frames with ffmpeg because `look` needs a project and this arm made none. Landscape clips
sit in a middle band over blurred copies, a clip label is top left, Chinese subtitles are in the lower part, and the glacier
clip's brand mark shows lower right in several frames, which the agent says in its message it left in.

Both arms with the skill flagged that its narration invented details for the person to correct. The 0.2.1 arm flagged two
clips of 11 s sitting in cards of 19 s and 22 s. The 0.2.2 arm flagged that it chose the start points of three glacier
sections without having seen the footage, and that one narration is longer than its clip. The arm without the skill flagged
the brand mark and that the glacier clip does not look like the person's own.

## Did the words stay legible

Both 0.2.2 runs put the words on a dark panel next to the picture: right of the photo in request 1, under the footage in
request 2. Neither put words over a photo or over footage, so legibility over a picture was not shown. Beside and under it,
the words were legible at full size and in the sheets, for the landscape photos and the portrait frame.

## The description

The old description said to use the skill for every new film. Four short runs (8 turns at most) checked what the 0.2.1
description does. The prompts were written before the first run. The 0.2.2 description has a new first sentence and the same
conditions; it was not probed again, and both 0.2.2 request runs read the skill as their first call.

| id | request | description | read the skill | what happened |
| --- | --- | --- | --- | --- |
| p1-old | `I need a 30-second launch film for my note-taking app, Jotbook. Landscape, with a voice-over and some music.` | 0.2.0 | yes, first call | a six-section placeholder preview in 0.9 min, $0.14 |
| p1-new | the same | 0.2.1 | no | took music from OpenFilm's library and started on the film; stopped at the turn cap, 1.3 min, $0.16 |
| p2-new | `Can you do a rough cut of a 2-minute film about how bread rises? I'll tell you what to change before you do the voice-over.` | 0.2.1 | yes, first call | 8 cards, 118.8 s, 1.1 min, $0.18; its table of lengths disagreed with `film.html` in two rows |
| p3-new | `Make me a storyboard for a 3-minute film about the history of the bicycle.` | 0.2.1 | no | a table in the chat, no tool call: it did not open OpenFilm or its canvas; $0.06 |

p1-new, p2-new and p3-new ran on the text of 0.2.1 before one clause was added to the last section of the brief ("read from
film.html as saved"), made after p2-new's table disagreed with its film. All the request runs have the clause and their tables
matched `film.html`. Two runs do not show the clause was the cause.

## Defects

- The preview time was read from the clock once, at the start, in both request 1 runs, and reported without a second reading.
  The 0.2.1 figure ("about a minute") was close; the 0.2.2 figure ("about 3 minutes") was about three times the
  measured 0.8 to 1.1 minutes. The brief says to read the clock at the start and at the stop. Request 2 runs read it more than
  once and reported the right figure. Not fixed in 0.2.2.
- 0.2.2 previews take longer and cost more than 0.2.1 previews, by the amounts above.

## How it was measured

`node evals/measure.mjs <run folder> --want <seconds> --frame landscape|portrait --material <folder> --snap <folder>` reads
one finished run, the same way for either arm: the model from the log; minutes and cost from the run's summary; whether the
skill was read; the `film.html` (tracks, clips, length, gaps, orientation, audio clips, sound or video made outside the project);
how many of the person's files are placed as clips of `film.html`, loaded by a card's own markup, or only named in the words
on a card; the pace of the longest block of text on each card; whether the last message ends with a question. The first
whole film is the first copy of `film.html` that covers 90% of the planned length with gaps under 5%.
`node evals/snap.mjs <runs folder> <snapshot folder>` copies `film.html` every two seconds while arms run. The cost at a
moment splits the run's cost over its messages by tokens, with the output tokens, which the log gives only in part, spread by
how much each message wrote; read it as an estimate. For the 0.2.1 request 2 run, the snapshots began after the run, so its
first whole film is the last write of `film.html`, which is also its only film.

The 0.2.1 runs were first measured with a count that took a file name in a card's words as use of the file. That count showed
7 of 7 and 9 of 9 files "named" for the 0.2.1 arms, which hid that no photo or clip was on the timeline. The count above
separates the three, and `npm test` plants the fault: cards that only name the photos.

`npm test` checks the script on planted faults: a missing card, a sound clip, a short film, a tall frame, a closing message
with no question, and the three ways a file can be counted.

## Not tried

- The pictures and sound stages, the counted ask before paid services (no service was connected), and "go straight through".
- A person in Studio reordering or rewriting the cards or the placed photos.
- The canvas. The storyboard prompt shows only that the skill is left alone; nobody tried the canvas next to the skill.
- Words placed over a photo or over footage.
- More than one run per arm and version, other models, or a computer other than Windows.
- A native speaker reading the Chinese narration. It was not checked and is not claimed to be good.
