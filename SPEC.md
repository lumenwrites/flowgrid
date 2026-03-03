# Spec
My goal is to build a practice app for freestyle rap and improvising musicals.
It shows a grid of bars (1 bar on each row, 4 beats per bar), with a playhead running through them row by row.
The playhead goes through row after row of bars. When the playhead reaches the end of the row, grid smoothly scrolls up to keep the current bar at the upper quarter of the screen.
The rhyming words are places in the rightmost cells (last beats) at the end of the bars.
Like:
[        ] [        ] [        ] [time]
[        ] [        ] [        ] [lime]
[        ] [        ] [        ] [money]
[        ] [        ] [        ] [honey]

App comes with the loops of beats. Each loop you can run forever.
The user opens the app, selects the beat/loop, and the rhyme dictionary (1-syllable, 2-syllable, elementary, etc), presses play, and sees the grid with playhead running through it, with each beat lighting up as the playhead gets to it, helping the user to practice rapping.
Ideally, i'd be able to change BPM, to slow down or speed up the beats, according to their skill level (but that's an optional future feature, if it's really hard to do, I can always just pre-export loops at different bpms from logic).
As the feature set grows, I expect it to approach some combination of a game and a very simplified DAW.

Needs to be responsive and work equally well on desktop, tabled, phone.

Desired features:
- Select BPM. First, by simply selecting the track from the beats folder (each one has a bpm associated with it), later - manually adjusting the BPMs up and down and making the app modify tempo automatically.
- Select the word list for rhymes (from ./rhyme-finder).
- Choose whether there's 1 bar or 2 bars per line (1 bar better suited for rap, 2 bars better suited for improv musicals).
- Rhyme pattern - fill in the last beats of the bars with rhymes according to a rhyme pattern. AABB, ABAB. Rhyme pairs (rhyming words) are highlighted in the same color.
- Fill Modes: 
All Rhymes filled:
[        ] [        ] [        ] [rhyme]
[        ] [        ] [        ] [rhyme]
Setup Punchline:
[        ] [        ] [        ] [????]
[        ] [        ] [        ] [word]
Off the cliff:
[        ] [        ] [        ] [word]
[        ] [        ] [        ] [????]
- Record audio while playing.
- PWA - support for all platforms. Web, iOS, Android.
- Enable/disable metronome (we have separate loops for it in the beats folder).

./beats contains the loops we'll need to be able to select from, and metronome loops.

## UI
UI is minimalistic
Toolbar at the top enabling you to toggle settings (mostly just dropdowns you select from).
Most of the screen is the grid. Above the grid is a timeline showing numbered beats, linke in any DAW.
Playhead is running through the timeline and the current row of the grid. The cells highlight when playehad reaches them.
At the bottom of the screen - play/pause button.