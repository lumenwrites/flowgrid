#!/usr/bin/env node
/**
 * generate-syllable-lists.js
 *
 * Uses the CMU Pronouncing Dictionary to generate word lists grouped by
 * rhyme families, filtered to common words only (by frequency rank).
 *
 * Generates:
 *   word-lists/_1-syllable-words.md
 *   word-lists/_2-syllable-words.md
 *   word-lists/_3-syllable-words.md
 *   word-lists/_all-rhymes.md (1 + 2 + 3 combined)
 *
 * Usage:
 *   node generate-syllable-lists.js [--max-rank 15000] [--min-family 3] [--max-family 12]
 */

const fs = require("fs");
const path = require("path");

// --- Config (overridable via CLI flags) ---

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf("--" + name);
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : def;
}

const MAX_RANK = flag("max-rank", 15000); // only include words with rank <= this
const MIN_FAMILY = flag("min-family", 3); // minimum words per rhyme family
const MAX_FAMILY = flag("max-family", 12); // cap words per family

// --- Paths ---

const CMU_DICT = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "rhyme-finder",
  "data",
  "cmu-dict.json"
);
const OUT_DIR = path.join(__dirname, "word-lists");

// --- ARPAbet vowels ---

const VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY",
  "EH", "ER", "EY", "IH", "IY", "OW",
  "OY", "UH", "UW",
]);

function stripStress(phoneme) {
  return phoneme.replace(/[0-2]$/, "");
}

function isVowel(phoneme) {
  return VOWELS.has(stripStress(phoneme));
}

function syllableCount(phonemes) {
  return phonemes.filter(isVowel).length;
}

function getLastStressedVowelIndex(phonemes) {
  for (let i = phonemes.length - 1; i >= 0; i--) {
    if ((phonemes[i].endsWith("1") || phonemes[i].endsWith("2")) && isVowel(phonemes[i])) {
      return i;
    }
  }
  for (let i = phonemes.length - 1; i >= 0; i--) {
    if (isVowel(phonemes[i])) return i;
  }
  return -1;
}

function getStrictRhymeEnding(phonemes) {
  const idx = getLastStressedVowelIndex(phonemes);
  if (idx === -1) return null;
  return phonemes.slice(idx).join("|");
}

// --- Filter: skip words that aren't good for freestyle ---

// Common proper nouns/names/places/abbreviations that sneak through frequency filters.
// These aren't useful as freestyle prompt words.
const BLOCKLIST = new Set([
  // First names
  "adam", "alan", "alex", "alice", "allen", "amy", "andrea", "andrew", "andy",
  "angela", "ann", "anna", "anne", "anthony", "arthur", "austin",
  "barry", "ben", "betty", "bill", "billy", "bob", "bobby", "brad", "brandon",
  "brian", "bruce", "carl", "carol", "chad", "charles", "charlie", "charlotte",
  "chris", "christian", "christina", "christine", "chuck", "cindy", "claire",
  "clark", "claude", "colin", "craig", "curtis",
  "dale", "dan", "daniel", "danny", "darren", "dave", "david", "dawn", "dean",
  "debbie", "deborah", "dennis", "derek", "diane", "dick", "don", "donald",
  "donna", "doug", "douglas", "drew", "duke", "dustin", "dylan",
  "earl", "ed", "eddie", "edgar", "edward", "elena", "eli", "elizabeth",
  "ellen", "emily", "emma", "eric", "erik", "ernest", "eugene", "evan",
  "floyd", "frances", "francis", "frank", "fred", "frederick",
  "gary", "gene", "george", "gerald", "glen", "glenn", "gordon", "grace",
  "grant", "greg", "gregory", "gus", "guy",
  "hal", "hank", "hans", "harold", "harriet", "harry", "harvey", "heath",
  "heather", "helen", "henry", "herb", "herman", "holly", "homer", "howard",
  "hunter", "ian", "irene", "iris",
  "jack", "jackson", "jacob", "jake", "james", "jamie", "jan", "jane", "janet",
  "jason", "jean", "jeff", "jeffrey", "jen", "jennifer", "jenny", "jeremy",
  "jerry", "jesse", "jessica", "jill", "jim", "jimmy", "joan", "joe", "joel",
  "john", "johnny", "jon", "jonathan", "jordan", "jose", "joseph", "josh",
  "joshua", "joyce", "juan", "judy", "julia", "julian", "julie", "justin",
  "karen", "karl", "kate", "kathleen", "kathy", "katie", "keith", "kelly",
  "ken", "kenneth", "kent", "kerry", "kevin", "kim", "kirk", "kurt", "kyle",
  "lance", "larry", "laura", "lauren", "lee", "leon", "leonard", "leslie",
  "linda", "lisa", "lloyd", "logan", "louis", "louise", "lucas", "luis", "luke",
  "lynn",
  "mae", "marcus", "margaret", "maria", "marie", "marilyn", "mario", "mark",
  "marshall", "martha", "martin", "marvin", "mary", "matt", "matthew", "max",
  "meg", "melissa", "michael", "michelle", "mickey", "miguel", "mike", "miles",
  "mitchell", "monica", "morgan", "morris", "murray",
  "nancy", "nathan", "ned", "neil", "nelson", "nick", "nicole", "nina", "noah",
  "noel", "norman",
  "oliver", "oscar", "otto", "owen",
  "pam", "pat", "patricia", "patrick", "paul", "pearl", "pedro", "penny",
  "perry", "pete", "peter", "phil", "philip", "phillip", "pierce", "porter",
  "rachel", "rafael", "ralph", "randy", "ray", "raymond", "reed", "rex",
  "richard", "rick", "rita", "rob", "robert", "robin", "rod", "roger", "ron",
  "ronald", "rosa", "ross", "roy", "ruby", "russ", "russell", "ruth", "ryan",
  "sally", "sam", "samuel", "sandra", "sandy", "sara", "sarah", "scott",
  "sean", "seth", "shane", "shannon", "sharon", "shawn", "sheila", "shelley",
  "sid", "simon", "sophia", "spencer", "stan", "stanley", "stella", "stephanie",
  "stephen", "steve", "steven", "stewart", "stuart", "sue", "susan",
  "ted", "terry", "thomas", "tim", "timothy", "tina", "todd", "tom", "tommy",
  "tony", "tracy", "travis", "troy", "tyler",
  "van", "vince", "vincent", "virginia", "wade", "walker", "walt", "walter",
  "warren", "wayne", "wendy", "wesley", "wes", "whitney", "william", "willie",
  "wilson", "woody",
  // Surnames
  "adams", "allen", "anderson", "baker", "barnes", "bennett", "brooks",
  "brown", "burke", "burns", "campbell", "carr", "carter", "clark", "clarke",
  "cohen", "cole", "coleman", "collins", "cook", "cooper", "cox", "crawford",
  "cruz", "cunningham", "curtis", "daniels", "davis", "dunn", "edwards",
  "ellis", "evans", "fisher", "fletcher", "ford", "foster", "fox", "freeman",
  "garcia", "gardner", "gibson", "gilbert", "gonzalez", "gordon", "graham",
  "griffin", "hamilton", "hansen", "harper", "harris", "harrison", "hart",
  "hayes", "henderson", "henry", "hill", "hoffman", "holland", "holmes",
  "howard", "hudson", "hughes", "hunt", "hunter", "jackson", "jenkins",
  "jensen", "johnson", "jones", "jordan", "kelly", "kennedy", "king", "knight",
  "lane", "lee", "lewis", "marshall", "martinez", "mason", "meyer", "miller",
  "mills", "mitchell", "moore", "morgan", "morris", "murphy", "murray",
  "nelson", "newman", "oliver", "palmer", "parker", "patterson", "perry",
  "peters", "peterson", "phillips", "porter", "powell", "price", "reynolds",
  "richards", "richardson", "riley", "roberts", "robinson", "rogers", "ross",
  "russell", "sanders", "schmidt", "simpson", "smith", "spencer", "stewart",
  "stone", "sullivan", "taylor", "thompson", "tucker", "turner", "walker",
  "wallace", "ward", "warner", "warren", "watson", "webb", "wells", "west",
  "white", "williams", "wilson", "wright", "young",
  // Places
  "africa", "alabama", "alaska", "amsterdam", "arizona", "arkansas",
  "atlanta", "austin", "australia", "baltimore", "berlin", "boston",
  "brazil", "brooklyn", "buffalo", "california", "cambridge", "canada",
  "carolina", "charlotte", "chicago", "china", "cincinnati", "cleveland",
  "colorado", "columbia", "connecticut", "cornell", "dallas", "delaware",
  "delhi", "denver", "detroit", "dublin", "durham", "edinburgh", "egypt",
  "england", "florida", "georgia", "germany", "greece", "greenwich",
  "hampshire", "hartford", "harvard", "hawaii", "hollywood", "houston",
  "idaho", "illinois", "india", "indiana", "indonesia", "iowa", "ireland",
  "israel", "istanbul", "italy", "jackson", "jacksonville", "jamaica",
  "japan", "jersey", "jerusalem", "kansas", "kentucky", "korea",
  "london", "louisiana", "madrid", "maine", "malaysia", "manhattan",
  "maryland", "memphis", "mexico", "miami", "michigan", "milwaukee",
  "minnesota", "mississippi", "missouri", "montana", "montreal", "moscow",
  "mumbai", "nashville", "nebraska", "nevada", "norfolk", "norway",
  "oakland", "ohio", "oklahoma", "ontario", "oregon", "orlando", "oxford",
  "pakistan", "paris", "pennsylvania", "peru", "phoenix", "pittsburgh",
  "portland", "princeton", "purdue", "quebec", "richmond",
  "sacramento", "salem", "seattle", "singapore", "spain", "stanford",
  "sydney", "tampa", "tennessee", "texas", "tokyo", "toronto", "trinidad",
  "tucson", "tulsa", "turkey", "utah", "vancouver", "venice", "vermont",
  "vienna", "vietnam", "virginia", "wales", "warsaw",
  "washington", "westminster", "wisconsin", "wyoming", "yale",
  // Tech/abbreviations that slip through
  "aaa", "abc", "acc", "amd", "aol", "bbc", "cnn", "dna", "dvd", "epa",
  "espn", "fbi", "fda", "ftp", "gps", "hbo", "hiv", "ibm", "llc", "mba",
  "mit", "mlb", "nba", "nbc", "nfl", "nhl", "npr", "php", "rna", "sql",
  "usb", "usda", "xml", "url", "rca", "pga", "ama", "aba", "cia", "usa",
  // Junk/abbreviations/not real freestyle words
  "wal", "mol", "lan", "sar", "bis", "tue", "jun", "lol", "vis", "dis",
  "mis", "sci", "ave", "ich", "lil", "kris", "starr", "san", "tis", "liz",
  "biz", "vals", "fao", "lao", "sao", "dow", "tao", "ciao",
  "bauer", "dover", "rome", "timor", "dior", "novell", "michel",
  "michele", "manuel", "carey", "valerie", "romeo", "monaco", "djibouti",
  "cherokee", "mcafee", "somerset", "monterey", "aberdeen", "augustine",
  "philippine", "evergreen", "ebay", "todo", "penn", "chen", "sri",
  "carmel", "chanel", "corel", "nobel", "kosovo", "egyptian",
]);

function isGoodWord(word) {
  // Skip words with punctuation (abbreviations, possessives, contractions)
  if (/[^a-z]/.test(word)) return false;
  // Skip very short words (1-2 chars tend to be articles/prepositions)
  if (word.length < 3) return false;
  // Skip blocklisted words
  if (BLOCKLIST.has(word)) return false;
  return true;
}

// --- Main ---

console.log("Loading CMU dictionary...");
const dict = JSON.parse(fs.readFileSync(CMU_DICT, "utf-8"));

// Build rhyme groups per syllable count
// Key: `${syllables}:${strictEnding}` → sorted word list
const groups = { 1: {}, 2: {}, 3: {} };

for (const [word, entry] of Object.entries(dict)) {
  if (!entry.p || !entry.r) continue; // need phonemes and a frequency rank
  if (entry.r > MAX_RANK) continue; // skip rare words
  if (!isGoodWord(word)) continue;

  const syl = syllableCount(entry.p);
  if (syl < 1 || syl > 3) continue;

  const ending = getStrictRhymeEnding(entry.p);
  if (!ending) continue;

  if (!groups[syl][ending]) groups[syl][ending] = [];
  groups[syl][ending].push({ word, rank: entry.r });
}

// For each syllable count, sort families and words within families
function buildFamilies(rhymeGroups) {
  const families = [];

  for (const [ending, words] of Object.entries(rhymeGroups)) {
    if (words.length < MIN_FAMILY) continue;

    // Sort by rank (most common first), cap at MAX_FAMILY
    words.sort((a, b) => a.rank - b.rank);
    const topWords = words.slice(0, MAX_FAMILY).map((w) => w.word);

    // Use the best (lowest) rank as the family sort key
    families.push({ ending, words: topWords, bestRank: words[0].rank });
  }

  // Sort families by their best word's rank (most common families first)
  families.sort((a, b) => a.bestRank - b.bestRank);

  return families;
}

function writeMd(filename, meta, families) {
  const lines = [
    "---",
    ...Object.entries(meta).map(([k, v]) => {
      if (typeof v === "object") return `${k}: ${JSON.stringify(v)}`;
      return `${k}: ${v}`;
    }),
    "---",
  ];

  for (const fam of families) {
    lines.push(fam.words.join(", "));
  }

  lines.push(""); // trailing newline
  const out = path.join(OUT_DIR, filename);
  fs.writeFileSync(out, lines.join("\n"));
  return { file: out, familyCount: families.length, wordCount: families.reduce((s, f) => s + f.words.length, 0) };
}

// Build and write each syllable list
const allFamilies = [];
const results = [];

for (const syl of [1, 2, 3]) {
  const families = buildFamilies(groups[syl]);
  allFamilies.push(...families);

  const difficulty = syl - 1;
  const free = syl <= 2 ? "FREE" : "PAID";
  const tags =
    syl === 1
      ? '["beginner","easy","simple"]'
      : syl === 2
        ? '["intermediate"]'
        : '["advanced","difficult"]';

  const meta = {
    id: `${syl}-syllable-words`,
    name: `${syl}-Syllable Words`,
    description:
      syl === 1
        ? "A massive list containing all 1-syllable rhyme sounds in the English language."
        : syl === 2
          ? "Level up with 2-syllable rhymes. More flow, more options!"
          : "Advanced 3-syllable rhymes for complex bars and multisyllabic flows.",
    difficulty,
    freepaid: free,
    publicList: true,
    tags,
  };

  const r = writeMd(`_${syl}-syllable-words.md`, meta, families);
  results.push({ syl, ...r });
  console.log(
    `  _${syl}-syllable-words.md: ${r.familyCount} families, ${r.wordCount} words`
  );
}

// Write combined all-rhymes list
allFamilies.sort((a, b) => a.bestRank - b.bestRank);
const allMeta = {
  id: "all-rhymes",
  name: "All Rhymes",
  description:
    "Contains all the words from the 1, 2, and 3-syllable word lists.",
  difficulty: 3,
  freepaid: "PAID",
  publicList: true,
  tags: '["difficult"]',
};
const allResult = writeMd("_all-rhymes.md", allMeta, allFamilies);
console.log(
  `  _all-rhymes.md: ${allResult.familyCount} families, ${allResult.wordCount} words`
);

console.log("\nDone!");
console.log(`  MAX_RANK=${MAX_RANK}, MIN_FAMILY=${MIN_FAMILY}, MAX_FAMILY=${MAX_FAMILY}`);
