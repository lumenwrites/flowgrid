TASK: Generate rhyming word groups for a freestyle rap / improv song practice app.

FORMAT:
- Each group is 4 words that all rhyme with each other. If you really struggle, 2-3 words is fine, but ideally aim for 4 words per group.
- One group per line, words separated by commas.
- Output as a markdown code block.
- 100 groups per topic.

The files should also have a frontmatter at the top containing name and other metadata. Example:

---
id: pirates
name: Pirates
difficulty: 1
freepaid: PAID
publicList: true
tags: []
---
sea, free, flee, spree
ship, whip, grip, tip
gold, bold, hold, told
sail, tale, gale, trail
crew, brew, true, new
...


WHAT MAKES A GOOD GROUP:
- All words in a group must rhyme cleanly. No near-rhymes or dialect-dependent rhymes.
- Words should be common, everyday vocabulary. No rare, archaic, or obscure words.
- Every word should have at least a loose association with the topic. It doesn't need to be literal — metaphorical or creative connections are fine, the kind a songwriter or rapper would make. But there should be a connection.
- Prefer short words (1 syllable ideal, 2 is fine, 3 is okay if needed).
- Words should be such that it makes sense to end the line of the lyrics on any of these  words.

WHAT TO AVOID:
- Words that don't actually rhyme with the rest of their group. This is the most important rule.
- Rare or unusual words most people wouldn't know.
- Groups where most words have no plausible connection to the topic.

DUPLICATES:
- Try to minimize duplicate words across groups, but don't stress about it. Some overlap is fine and expected, especially with common rhyme families like -ight, -ast, etc.

PROCESS:
- Create a new file in ./word-lists/
- Work in batches of 20 groups at a time. Add new words to the file.
- After each batch, do a quick review: check that all rhymes are clean, no rare words, topic associations make sense, etc.
- If you spot a problem, fix it before moving on to the next batch.
- After all batches are done, read through the file, and do a final review pass. Note what can be improved, what needs to be removed, what can be added, etc.

