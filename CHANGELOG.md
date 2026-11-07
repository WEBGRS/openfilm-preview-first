# Changes

Newest first. Each version is the one in `skills/<name>/openfilm.json`, and is tagged `v<version>`.

## 0.2.2

- When the person gave photos or footage, the preview shows them: a section's picture is their own photo or clip, trimmed with `#t=` and not re-encoded, with the planned words on it or beside it, readable. A section with nothing of theirs stays a plain card. In 0.2.1 every section was a card that named the file, so the person could not judge the order of their own photos. Placing their material costs nothing and takes no time, and the brief says so.
- A section is a picture, one after another on one track, so the old "one clip" no longer contradicts a picture with words over it on a second track.
- `evals/measure.mjs` counts the person's files placed as clips, loaded by a card, and only named in a card's words, separately, in both arms. The earlier count took a name in the words for use. `npm test` plants that fault.
- The listing text and README say what a section holds.
- Tried again on OpenFilm 0.3.0: the previews took 1.1 and 1.9 minutes for $0.19 and $0.30, against 0.8 and 1.4 minutes for $0.14 and $0.21 in 0.2.1. The words were legible beside and under the pictures; none were put over one. See `evals/README.md`.

## 0.2.1

- The description says when to use it: an outline, draft, rough cut or preview asked for, or a long new film (over about two minutes) or one that will spend heavily on paid services, with its structure still open. It no longer says "every new film", which put the skill on requests that other skills own. Short films, recordings to clean up or dub, screen demos and cuts to music are left out unless the person asks for the preview.
- The brief says how it differs from OpenFilm 0.3's canvas storyboard: the canvas holds nodes that are made and paid for when the person presses Make; the preview is the timeline itself, made for nothing. "Storyboard" is no longer one of its trigger words, the canvas skill has it.
- The preview's time is read from the clock, not guessed, and the sections and total length reported are read from `film.html` as saved. A natural pace for the planned words is given, so a card lasts as long as its words.
- OpenFilm's own library is free: no ask before using it.
- `needs` in five languages; `details` says who it is for now.
- `evals/` added: the requests it was tried on, with and without it, and the scripts that measured them. `npm test` tests the measuring script. `scripts/check.mjs` checks `needs` and `platforms`.

## 0.2.0

The version before these changes: the whole film as placeholder cards first, three stops, sound last, and paid use counted before it is spent.
