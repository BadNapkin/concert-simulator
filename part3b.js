
const RIVALS = [
  { name:'Derek', venue:'The Monarch', texts:[
    "Heard that was a quiet one last night. Don't worry — not everyone can fill a room. 🤌",
    "We just confirmed [act] for next weekend. Such a shame you couldn't land them.",
    "Interesting review in The Static this week. I'm sure they meant it constructively.",
    "Another week, another empty Tuesday for someone downtown. Chin up.",
  ]},
  { name:'Zoe', venue:'The Bunker', texts:[
    "Noticed you booked [act]. Didn't have you down as a sellout venue tbh",
    "Our show was rammed last night. Real fans know where to go 🖤",
    "Congrats on the sell-out. Very… mainstream of you.",
    "Still booking heritage acts I see. Some of us are looking forward.",
  ]},
  { name:'Marcus', venue:'The Pavilion', texts:[
    "We just signed a 6-gig deal with [act]. Early bird gets the worm 🐛",
    "Numbers don't lie mate. 800 in last Friday. How was your weekend?",
    "Our production budget is triple yours FYI. Just so you know what you're competing with.",
  ]},
  { name:'Ange', venue:'The Taproom', texts:[
    "You dropped [act]?? Booked them for next Thurs. Can't believe my luck lol",
    "People keep coming in saying they heard about us from [act]. Cheers for that 😂",
    "Sorry for texting late. Had the most mental night. Tell you about it sometime.",
  ]},
];

// SFX EQUIPMENT — id, name, icon, cost (to buy), nightly (per show), desc, synergies, penalties
const SFX_GEAR = {
  basic:  { id:'basic',  name:'Basic Lighting',   icon:'💡', cost:0,   nightly:0,  owned:true,
            desc:'Default house rig. Gets the job done. Barely.',
            synergies:[], penalties:['Pyro Enthusiasts','Drama Queens'],
            colorHue:50 },
  spots:  { id:'spots',  name:'Coloured Spots',   icon:'🎨', cost:150, nightly:20, owned:false,
            desc:'Warm washes and colour gels. Works beautifully with folk and acoustic sets.',
            synergies:['Acoustic Purists','Industry Darlings'],  penalties:[],
            colorHue:40 },
  uv:     { id:'uv',     name:'UV Flood',          icon:'🌈', cost:200, nightly:25, owned:false,
            desc:'Ultraviolet rigs that make face paint glow and crowds lose their minds.',
            synergies:['Face Paint','Chameleons','Party Animals'], penalties:[],
            colorHue:280 },
  smoke:  { id:'smoke',  name:'Smoke Machine',     icon:'💨', cost:300, nightly:35, owned:false,
            desc:'Atmospheric haze that transforms the room. Essential for shoegaze and post-rock.',
            synergies:['Method Actors','Underground Cred','Smoke Lovers'], penalties:[],
            colorHue:200 },
  laser:  { id:'laser',  name:'Laser Array',       icon:'💫', cost:500, nightly:60, owned:false,
            desc:'Precision beam show. Pairs with electronic and synthwave acts for a full arena feel.',
            synergies:['Face Paint','Party Animals','Merch Machine'], penalties:['Acoustic Purists'],
            colorHue:120 },
  pyro:   { id:'pyro',   name:'Pyrotechnics Rig',  icon:'🔥', cost:800, nightly:90, owned:false,
            desc:'The big one. Fireworks, flash pots, and CO2 cannons. Banned at three other venues.',
            synergies:['Pyro Enthusiasts','Drama Queens','Crowd Surfers'], penalties:['Acoustic Purists','Method Actors'],
            colorHue:20 },
};

// VENUE TIERS
const VENUE_TIERS = [
  { name:'The Dive Bar',     capacity:100,  upgradeCost:0,     upgradeLabel:null },
  { name:'The Loft',         capacity:250,  upgradeCost:1200,  upgradeLabel:'Knock through the back wall. £1,200.' },
  { name:'The Ballroom',     capacity:500,  upgradeCost:3000,  upgradeLabel:'Strip it back. New sound desk. £3,000.' },
  { name:'The Warehouse',    capacity:1000, upgradeCost:7500,  upgradeLabel:'Industrial conversion. The works. £7,500.' },
  { name:'The Arena',        capacity:3000, upgradeCost:20000, upgradeLabel:'You\'d need a miracle. And £20,000.' },
];

// ACHIEVEMENTS — id, name, icon, desc, reward, condition (checked in JS)
const ACHIEVEMENTS = [
  { id:'first_show',    name:'First Night',         icon:'🎤', desc:'Run your first show.',                                          reward:'+£50 from a generous punter',        unlocked:false, week:null },
  { id:'sold_out',      name:'House Full',           icon:'🏟️', desc:'Sell out a show.',                                             reward:'+15 to next show score',             unlocked:false, week:null },
  { id:'broke_act',     name:'Talent Scout',         icon:'🌟', desc:'Break an act to Regional Act fame or above.',                  reward:'Unlocks higher-fame bookings',        unlocked:false, week:null },
  { id:'pyro_punk',     name:'Fire & Fury',          icon:'🔥', desc:'Use Pyrotechnics with a Punk or Metal act.',                   reward:'+20 score on pyro+punk combos',      unlocked:false, week:null },
  { id:'smoke_gaze',    name:'Wall of Haze',         icon:'💨', desc:'Use Smoke with a Shoegaze or Post-Rock act.',                  reward:'Unlocks "Shoegaze Sanctuary" rep',   unlocked:false, week:null },
  { id:'uv_paint',      name:'Black Light Ritual',  icon:'🌈', desc:'Use UV Flood with a Face Paint band.',                         reward:'+25 bar revenue on UV nights',       unlocked:false, week:null },
  { id:'laser_rave',    name:'Club Night Royalty',  icon:'💫', desc:'Use Laser Array with an Electronic or Synthwave act.',          reward:'Electronic acts offer lower fees',   unlocked:false, week:null },
  { id:'acoustic_pure', name:'Less Is More',         icon:'🎸', desc:'Run a show with Basic Lighting and an Acoustic Purists band.', reward:'+10 relationship tier speed',        unlocked:false, week:null },
  { id:'legendary',     name:'Legendary Partnership',icon:'🤝', desc:'Reach Legendary Partners tier with any band.',                 reward:'+30% ticket revenue with that act',  unlocked:false, week:null },
  { id:'five_shows',    name:'Grind',                icon:'📅', desc:'Run 5 shows.',                                                 reward:'Staff loyalty bonus: -£10 staff cost',unlocked:false, week:null },
  { id:'upgrade1',      name:'Moving Up',            icon:'🏗️', desc:'Upgrade to The Loft or beyond.',                              reward:'Access to bigger-name acts',         unlocked:false, week:null },
  { id:'combo_smoke_shoegaze', name:'Shoegaze Sanctuary', icon:'🌫️', desc:'Smoke + Shoegaze: the definitive combo.',                reward:'Shoegaze acts seek you out',         unlocked:false, week:null },
  { id:'combo_pyro_metal',     name:'The Inferno',   icon:'🤘', desc:'Pyro + Metal: maximum carnage.',                              reward:'Metal acts waive 10% fee',           unlocked:false, week:null },
  { id:'combo_uv_electronic',  name:'Neon Church',   icon:'🎧', desc:'UV + Electronic: transcendent.',                              reward:'Electronic fans spend 40% more at bar', unlocked:false, week:null },
  { id:'combo_laser_synthwave',name:'Cyberpunk Night',icon:'🌆', desc:'Lasers + Synthwave: the future is here.',                    reward:'Synthwave acts boost their own promo', unlocked:false, week:null },
];

// COMBO DEFINITIONS — sfx + genreKey/trait combos that trigger special reviews
const COMBOS = [
  { id:'combo_smoke_shoegaze',  sfx:'smoke',  match: b => b.genre==='Shoegaze' || b.traits.includes('Smoke Lovers'),
    reviewLine: "The smoke filled the room before the first note hit. By the end, no one could tell where the music stopped and the haze began. Singular.",
    scoreMod: 18 },
  { id:'combo_pyro_metal',      sfx:'pyro',   match: b => b.genreKey==='metal' || b.traits.includes('Pyro Enthusiasts'),
    reviewLine: "Flash pots on the beat drop. The crowd surged. Someone lost a shoe. No one cared. This is why we go to shows.",
    scoreMod: 20 },
  { id:'combo_uv_electronic',   sfx:'uv',     match: b => b.genreKey==='electronic' || b.traits.includes('Face Paint'),
    reviewLine: "Under the ultraviolet, the set became something else entirely. Part concert, part ceremony.",
    scoreMod: 15 },
  { id:'combo_laser_synthwave', sfx:'laser',  match: b => b.genre==='Synthwave' || b.traits.includes('Party Animals'),
    reviewLine: "Laser grids sliced through the synth fog. The crowd became a single organism. Three encores.",
    scoreMod: 17 },
  { id:'pyro_punk',             sfx:'pyro',   match: b => b.genreKey==='punk',
    reviewLine: "Pyrotechnics and punk. Someone could have died. Everyone left feeling more alive.",
    scoreMod: 12 },
  { id:'acoustic_pure',         sfx:'spots',  match: b => b.traits.includes('Acoustic Purists'),
    reviewLine: "Warm gel lighting. Nothing else. The songs did the rest. Some nights you just get out of the way.",
    scoreMod: 10 },
  { id:'uv_paint',              sfx:'uv',     match: b => b.traits.includes('Face Paint'),
    reviewLine: "Black light turned the band into something from a fever dream. The face paint glowed. The crowd lost it.",
    scoreMod: 14 },
];

const REVIEWS_GOOD = [
  "Whatever {venue} is doing with their {genre} bookings, other rooms should pay attention.",
  "The {band} set was exactly what this city needed. Packed room. Earned sweat.",
  "Word is spreading. {venue} keeps picking them before anyone else does.",
  "{band} were exceptional. The production matched the room perfectly.",
  "First time I've seen {band} and I've already told everyone I know.",
  "There was a moment, about forty minutes in, when the whole room locked in. You know the feeling.",
];
const REVIEWS_MID = [
  "{band} delivered a solid set. Nothing revelatory, but the crowd left happy.",
  "A competent night at {venue}. {band} know their audience.",
  "Good energy, if not transcendent. {venue} continues to book dependably.",
  "{band} on a Saturday — niche crowd but loyal. Respectable numbers.",
];
const REVIEWS_BAD = [
  "A difficult night. {band} seemed off. The room felt it.",
  "{venue} misjudged the crowd this week. Better luck next time.",
  "The production felt mismatched for {band}'s sound. A wasted opportunity.",
  "Thin crowd, thin energy. {band} deserved a better night.",
];
