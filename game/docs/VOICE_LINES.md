# Crystal Karts — In-Game Voice Lines (ElevenLabs V3)

Recording script for the character reactions, Crystal Heart cheers and countdowns.
The game code is ready: every line stays **silent until an approved recording exists**
(no generic fallback voice). Voice IDs are in `docs/approved-character-voices.json`.

## How the game uses them

| Kind | When it plays | Throttle |
|---|---|---|
| `ouch` | Your bear is spun out by a crystal | 6 s between any lines, 12 s per bear |
| `whoops` | Your bear bumps a rock | same |
| `laugh` | You overtake / land a crystal hit, or a rival answers your "ouch" (45 %) | a reply may follow within 1.2 s |
| `cheer` | Crystal Heart bounce-back (the bear's affirmation) | same |
| countdown | Start of every race, one clip per bear | GO should land in the last ~0.4 s of the clip |

Because these repeat every race, keep them **short, warm and restrained** — a light
reaction, never a shout. Laughs are delighted, never mocking.

## Where the files go

```
game/public/assets/voices/reactions/<bear>-<kind>-<take>.mp3   e.g. luna-ouch-1.mp3
game/public/assets/voices/countdown/<bear>.mp3                 e.g. luna.mp3
```

Then list approved reaction clips in `game/public/assets/voices/reactions/manifest.json`:

```json
{
  "luna": {
    "ouch":   ["assets/voices/reactions/luna-ouch-1.mp3", "assets/voices/reactions/luna-ouch-2.mp3"],
    "whoops": ["assets/voices/reactions/luna-whoops-1.mp3", "assets/voices/reactions/luna-whoops-2.mp3"],
    "laugh":  ["assets/voices/reactions/luna-laugh-1.mp3", "assets/voices/reactions/luna-laugh-2.mp3"],
    "cheer":  ["assets/voices/reactions/luna-cheer-1.mp3"]
  }
}
```

Only list clips you have approved. Missing bears or kinds simply stay silent. Countdown
clips need no manifest: the game plays `countdown/<bear>.mp3` if it exists.

Export tip: trim silence at both ends, master around −14 LUFS, mono is fine.

---

```
═══════════════════════════════════════════════
KEEN — The Brave Voice (Aquamarine)
Voice: TCRj5m2u9xhZHJ8h9pMv
Stability: 35 | Similarity: 75 | Staggeration: 30
═══════════════════════════════════════════════
Line 1 (ouch-1):   [surprised] Ow! [short pause] [giggles] That was FAST.
Line 2 (ouch-2):   [breathes] Oof — [cheerful] still ROLLING!
Line 3 (whoops-1): [surprised] Whoa — [giggles] ROCK!
Line 4 (whoops-2): [curious] Oops... [cheerful] where'd THAT come from?
Line 5 (laugh-1):  [excited] Whee! [giggles]
Line 6 (laugh-2):  [giggles] Did you SEE that?
Line 7 (cheer):    [breathes] [excited] New way — let's GO!
Line 8 (countdown):[excited] Three... two... one... [giggles] GO!
```

```
═══════════════════════════════════════════════
AIDA — The Sparkle Maker (Rose Quartz)
Voice: SHuZ9GyczU4QEDzU4QU4
Stability: 50 | Similarity: 75 | Staggeration: 10
═══════════════════════════════════════════════
Line 1 (ouch-1):   [exhales] Ooh. [short pause] [calm] I'm OKAY.
Line 2 (ouch-2):   [breathes] Ow. [determined] Keep GOING.
Line 3 (whoops-1): [surprised] Oops. [warm] Steady now.
Line 4 (whoops-2): [exhales] Whoops — [calm] back on TRACK.
Line 5 (laugh-1):  [warm] [laughs] Lovely.
Line 6 (laugh-2):  [happy] Here I COME. [laughs]
Line 7 (cheer):    [breathes] [calm][determined] I believe in ME!
Line 8 (countdown):[calm][determined] Three. Two. One. [warm] GO!
```

```
═══════════════════════════════════════════════
SUNNY — The Happy Helper (Citrine)
Voice: BJG9bw7cUqGsIzkR556J
Stability: 30 | Similarity: 75 | Staggeration: 35
═══════════════════════════════════════════════
Line 1 (ouch-1):   [surprised] Ow-ow — [excited] I'm FINE!
Line 2 (ouch-2):   [exhales] Oof! [giggles] Bouncy!
Line 3 (whoops-1): [excited] Whoops-a-DAISY!
Line 4 (whoops-2): [surprised] Rock! [giggles] Hello, ROCK!
Line 5 (laugh-1):  [excited] Yay! [laughs]
Line 6 (laugh-2):  [giggles] Zoom ZOOM!
Line 7 (cheer):    [excited] Still SUNNY!
Line 8 (countdown):[excited][fast-paced] Three — two — one — GO GO GO!
```

```
═══════════════════════════════════════════════
MISTY — The Heart Listener (Moonstone)
Voice: Yj7sxjH2wQmzIjjKXnDy
Stability: 40 | Similarity: 75 | Staggeration: 20
═══════════════════════════════════════════════
Line 1 (ouch-1):   [surprised] Oh! [short pause] [warm] That STUNG a little.
Line 2 (ouch-2):   [breathes] Ow — [hopeful] I'm alright.
Line 3 (whoops-1): [surprised] Oopsie — [warm] sorry, ROCK.
Line 4 (whoops-2): [exhales] Whoops. [playful] Gently NOW.
Line 5 (laugh-1):  [happy] [giggles] Ooh, NICE.
Line 6 (laugh-2):  [playful] Hello, FRIEND! [giggles]
Line 7 (cheer):    [breathes] [warm] I felt it, and I'm OKAY!
Line 8 (countdown):[warm] Three... two... one... [excited] GO!
```

```
═══════════════════════════════════════════════
AMIE — The Feeling Finder (Amethyst)
Voice: 6lbKISvTuKILAwhNIepr
Stability: 35 | Similarity: 75 | Staggeration: 25
═══════════════════════════════════════════════
Line 1 (ouch-1):   [surprised] Ow! [giggles] That TICKLED.
Line 2 (ouch-2):   [exhales] Oof — [hopeful] still SHINING.
Line 3 (whoops-1): [giggles] Whoopsie!
Line 4 (whoops-2): [surprised] Oops — [playful] silly ROCK.
Line 5 (laugh-1):  [happy] [giggles] Sparkly!
Line 6 (laugh-2):  [playful] Wheee — [laughs] so PRETTY!
Line 7 (cheer):    [breathes] [happy] Let's shine the LIGHT!
Line 8 (countdown):[playful] Three... two... one... [excited] SHINE!
```
*Amie's countdown ends on "SHINE!" — it plays exactly where "GO" would.*

```
═══════════════════════════════════════════════
HOWEY — The Gentle Reminder (Howlite)
Voice: rXUAKUHFzRwd8mYd3oLz
Stability: 35 | Similarity: 75 | Staggeration: 30
═══════════════════════════════════════════════
Line 1 (ouch-1):   [exhales] Ow. [determined] I'm fine.
Line 2 (ouch-2):   [breathes] Oof. [short pause] Steady.
Line 3 (whoops-1): [surprised] Whoops — [calm] easy does it.
Line 4 (whoops-2): [exhales] Oops. [determined] Turn AWAY.
Line 5 (laugh-1):  [warm] [laughs] Good one.
Line 6 (laugh-2):  [proud] [laughs] Coming THROUGH.
Line 7 (cheer):    [breathes] [determined] Steady and BRAVE!
Line 8 (countdown):[determined] Three. Two. One. [proud] GO.
```
*Howey avoids [giggles] per his profile — his laugh is a short warm [laughs].*

```
═══════════════════════════════════════════════
LUNA — The Calm Keeper (Lepidolite)
Voice: gqDyJgCTCxcTOzggXvmS
Stability: 55 | Similarity: 80 | Staggeration: 10
═══════════════════════════════════════════════
Line 1 (ouch-1):   [exhales] Oh. [calm] That's okay.
Line 2 (ouch-2):   [breathes] Ow... [calm] breathe.
Line 3 (whoops-1): [surprised] Oops. [calm] Slowly.
Line 4 (whoops-2): [exhales] Whoops. [warm] All good.
Line 5 (laugh-1):  [warm] [laughs] Lovely.
Line 6 (laugh-2):  [happy] Softly past. [laughs]
Line 7 (cheer):    [breathes] [calm] Calm... and READY.
Line 8 (countdown):[calm] Three. [short pause] Two. [short pause] One. [warm] Go.
```
*Luna's "Ow... breathe." is the one earned ellipsis — it IS the breath.*

```
═══════════════════════════════════════════════
ZENNY — The Calm Keeper (bee)
Voice: XEiPrIitaegdirIGkODX
Stability: 35 | Similarity: 78 | Staggeration: 25
═══════════════════════════════════════════════
Line 1 (ouch-1):   [sighs] Ow. [deadpan] Rude.
Line 2 (ouch-2):   [deadpan] Ouch. [short pause] Noted.
Line 3 (whoops-1): [sighs] Rock. Of COURSE.
Line 4 (whoops-2): [deadpan] Whoops. [short pause] Didn't happen.
Line 5 (laugh-1):  [deadpan] Hm. [laughs] Nice.
Line 6 (laugh-2):  [playful] Buzz by. [giggles]
Line 7 (cheer):    [breathes] [calm] Buzz — back on TRACK.
Line 8 (countdown):[deadpan] Three. Two. One. [sighs] Go, I suppose.
```

```
═══════════════════════════════════════════════
FUZZBY — The Laughter Maker (bee)
Voice: DNK8oCkkHjIyEjzlCeQq
Stability: 25 | Similarity: 70 | Staggeration: 40
═══════════════════════════════════════════════
Line 1 (ouch-1):   [surprised] Oof! [stammers] I m-MEANT that!
Line 2 (ouch-2):   [childlike tone] Ow-ow-OW — [giggles] ticklish!
Line 3 (whoops-1): [surprised] Whoopsie-BUZZ!
Line 4 (whoops-2): [deliberate] That rock... [giggles] was NOT there.
Line 5 (laugh-1):  [excited] Bzzz-HA! [laughs]
Line 6 (laugh-2):  [mischievously] Buzzing PAST! [giggles]
Line 7 (cheer):    [excited] Boing! [giggles] Back AGAIN!
Line 8 (countdown):[excited][fast-paced] Three! Two! One! [giggles] BUZZ-GO!
```

---

## Takes and review

- **Multi-take priorities (3–5 generations each):** every `cheer` line (they're the
  Crystal Heart payoff) and every countdown (heard at the start of every race).
- Reactions: generate each line **alone**, 2–3 generations, keep the gentlest one.
  Anything over ~2 seconds (countdowns aside) should be trimmed or regenerated.
- **Repeat test:** play each bear's `ouch` five times in a row. If it grates, it's too big.
- Short lines are hard for V3. If a take comes out flat, add a throwaway lead-in sentence
  before it in the same prompt and trim it off in the edit.

## Open question for Julian

The two Crystal Bears reference skills disagree on some traits. The voice profiles (and
the game) say Keen = courage, Amie = understanding, Howey = kindness; the daily pipeline
rota says Keen = adaptability, Amie = joy, Howey = courage. The Crystal Heart tools were
written from the pipeline rota (Keen "Try a new way", Amie "Find the silver lining").
Tell me which is canon and I'll align the in-game tools and these lines.
