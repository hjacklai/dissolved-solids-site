/*
 * Drink builder - reusable JS.
 * Mounts on every `.builder-mount` element on the page.
 *
 * Modes:
 *  - Standalone (/builder/): has a hero with a "Start building" button.
 *    Flow starts hidden, opens on click.
 *  - Embedded (bar pages): no hero, no start button.
 *    Flow is visible immediately, first question shown.
 *
 * Multi-select: mood and profile accept up to 2 values. A Continue button
 * advances. Spirit, strength and occasion remain single-select with auto-advance.
 *
 * Shareable URLs: result state is encoded in location.hash, e.g.
 *   #refreshed.gin.citrusy+herbal.medium.aperitif.r2
 * Multi-select values are alphabetically sorted in the URL. The optional
 * trailing .rN is a re-roll counter that seeds a deterministic variant.
 */
(function () {
  'use strict';

  const QUESTIONS = ['mood', 'spirit', 'profile', 'strength', 'occasion'];
  const MULTI_KEYS = new Set(['mood', 'profile']);
  const TOTAL_STEPS = QUESTIONS.length;

  const SPIRITS = {
    gin: 'Gin',
    whiskey: 'Whisk(e)y',
    vodka: 'Vodka',
    rum: 'Rum',
    tequila: 'Tequila',
    mezcal: 'Mezcal',
    brandy: 'Brandy',
  };

  const ALL_VALUES = {
    mood: ['refreshed','adventurous','comforting','celebratory','mellow','awake'],
    spirit: ['gin','whiskey','vodka','rum','tequila','mezcal','brandy','surprise'],
    profile: ['citrusy','sweet','bitter','herbal','smoky','floral','spicy','tropical'],
    strength: ['light','medium','strong'],
    occasion: ['aperitif','with-food','nightcap','celebration','session','anytime'],
  };

  /* ----- Helpers ----- */

  function asArray(v) {
    if (Array.isArray(v)) return v;
    return v ? [v] : [];
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function resolveBase(spirit) {
    if (spirit === 'surprise' || !SPIRITS[spirit]) {
      return SPIRITS[pick(Object.keys(SPIRITS))];
    }
    return SPIRITS[spirit];
  }
  function fmtAnswer(v) {
    return asArray(v).join(', ');
  }

  // Deterministic 53-bit string hash. Used to derive a stable seed from the
  // encoded answer string so the same URL renders the same drink.
  function cyrb53(str, seed) {
    seed = seed || 0;
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  // Seeded PRNG. Swap into Math.random temporarily for deterministic recipes.
  function mulberry32(a) {
    return function() {
      a = (a + 0x6D2B79F5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ----- Templates ----- */

  const templates = {
    espresso_awake: (ans) => {
      const base = ['whiskey','brandy'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Vodka';
      return {
        ingredients: [base, 'Coffee liqueur', 'Fresh espresso (chilled)', cap(pick(['simple syrup','vanilla syrup','demerara syrup']))],
        method: 'Shake hard with ice so the crema lands clean on top. Double-strain.',
        garnish: pick(['Three coffee beans, lined up','Cocoa nibs','Grated dark chocolate']),
        signature: 'coffee'
      };
    },
    sour: (ans) => {
      const profile = asArray(ans.profile)[0];
      const base = resolveBase(ans.spirit);
      const citrus = profile === 'citrusy' ? 'Fresh lime juice' : 'Fresh lemon juice';
      const sweet = profile === 'sweet' ? cap(pick(['honey syrup','vanilla syrup','demerara syrup'])) : cap(pick(['simple syrup','rich syrup']));
      const haveEggWhite = pick([true,false,false]);
      return {
        ingredients: [
          base, citrus, sweet, 'Angostura bitters',
          ...(haveEggWhite ? ['Egg white (or aquafaba for vegan)'] : []),
          ...(ans.strength === 'light' ? ['Top with a touch of soda'] : []),
        ],
        method: haveEggWhite
          ? 'Dry shake first, then shake hard with ice. Double-strain into a chilled glass.'
          : 'Shake hard with ice. Double-strain into a chilled glass.',
        garnish: profile === 'citrusy' ? pick(['Lime wheel','Dehydrated lime']) : pick(['Expressed lemon twist','Sugared lemon peel']),
        signature: 'citrus'
      };
    },
    bitter_stirred: (ans) => {
      const base = resolveBase(ans.spirit);
      const bitter = pick(['Campari','Aperol','Cynar (artichoke amaro)','Amaro Nonino']);
      const vermouth = cap(pick(['sweet vermouth','vermouth bianco']));
      return {
        ingredients: [base, bitter, vermouth],
        method: 'Stir long and cold over ice. Strain.',
        garnish: pick(['Orange peel, expressed','Grapefruit peel','Orange wheel and an olive']),
        signature: 'bitter'
      };
    },
    highball_spice: (ans) => {
      const base = resolveBase(ans.spirit);
      return {
        ingredients: [
          base, 'Fresh lime juice',
          cap(pick(['ginger syrup (or muddled fresh ginger)','chilli-honey syrup','black pepper syrup'])),
          'Top with chilled ' + pick(['ginger beer','tonic water','soda water']),
        ],
        method: 'Build over crushed ice. Stir gently.',
        garnish: pick(['Lime wheel and candied ginger','Slap of mint and a chilli','Cucumber ribbon and a pink peppercorn']),
        signature: 'ginger'
      };
    },
    garden_stirred: (ans) => {
      const base = resolveBase(ans.spirit);
      const herbSyrup = cap(pick(['basil oleo-saccharum','rosemary syrup','thyme honey syrup','sage syrup','dill simple']));
      const herbGarnish = pick(['rosemary sprig','basil leaf clap','thyme sprig','sage leaf','dill frond']);
      return {
        ingredients: [base, 'Dry vermouth', herbSyrup, cap(pick(['orange bitters','celery bitters','aromatic bitters']))],
        method: 'Stir with ice until crystal. Strain.',
        garnish: 'Fresh ' + herbGarnish,
        signature: 'herb'
      };
    },
    smoke_sour: () => ({
      ingredients: [
        'Mezcal (or a smoky scotch)', 'Fresh lime juice',
        cap(pick(['agave syrup','smoked honey syrup'])),
        cap(pick(['mole bitters (angostura works too)','smoked salt tincture','chocolate bitters'])),
      ],
      method: 'Shake hard with ice. Double-strain.',
      garnish: pick(['Dehydrated grapefruit','Smoked rosemary sprig','Pasilla chilli dust on the rim']),
      signature: 'smoke'
    }),
    flora_fizz: (ans) => {
      const base = resolveBase(ans.spirit);
      const floralSyrup = cap(pick(['lavender syrup','rose syrup','jasmine tea syrup','osmanthus syrup','elderflower cordial','hibiscus syrup']));
      const topper = ans.occasion === 'celebration' ? 'Top with chilled prosecco' : 'Top with chilled ' + pick(['soda water','tonic water']);
      return {
        ingredients: [base, 'Elderflower liqueur', 'Fresh lemon juice', floralSyrup, topper],
        method: 'Shake the base, citrus, and syrups with ice. Strain, then top with the sparkling.',
        garnish: pick(['An edible flower and an expressed lemon twist','Three rose petals','Sprig of fresh thyme and a lemon coin']),
        signature: 'flower'
      };
    },
    tropical_shake: (ans) => {
      const preferTropical = ['rum','tequila','mezcal'];
      const base = preferTropical.includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Rum';
      const accent = cap(pick(['orgeat (almond syrup)','falernum','honey syrup','passionfruit puree','coconut cream']));
      const fruit = cap(pick(['fresh pineapple juice','fresh mango puree','guava nectar']));
      return {
        ingredients: [base, fruit, 'Fresh lime juice', accent, cap(pick(['angostura bitters','tiki bitters','peychaud’s']))],
        method: 'Shake hard with crushed ice. Open-pour, unstrained.',
        garnish: pick(['Pineapple frond and dehydrated lime','Mint sprig and pineapple wedge','Toasted coconut and an orchid','Speared cherry and pineapple']),
        signature: 'tropical'
      };
    },
    champagne_fizz: (ans) => {
      const base = resolveBase(ans.spirit);
      const citrus = pick(['Fresh lemon juice','Fresh grapefruit juice']);
      const sweet = cap(pick(['simple syrup','elderflower cordial','rose syrup']));
      return {
        ingredients: [base, citrus, sweet, 'Top with chilled prosecco (or champagne)'],
        method: 'Shake the base, citrus, and sweetener with ice. Strain, then top with sparkling.',
        garnish: pick(['Expressed lemon peel and an edible flower','Single raspberry on a pick','Sugar-coated rim and a lemon twist']),
        signature: 'sparkle'
      };
    },
    old_fashioned: (ans) => {
      const preferred = ['whiskey','rum','brandy'];
      const base = preferred.includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Whisk(e)y';
      const syrup = cap(pick(['demerara syrup','maple syrup','honey syrup','pandan syrup']));
      return {
        ingredients: [base, syrup, 'Angostura bitters', cap(pick(['orange bitters','chocolate bitters','black walnut bitters']))],
        method: 'Stir over a large ice cube until cold and softened.',
        garnish: pick(['Expressed orange peel (Luxardo cherry if we have one)','Smoked orange peel','Lemon twist and a brandied cherry']),
        signature: 'spirit-forward'
      };
    },
    low_abv_spritz: (ans) => {
      const base = resolveBase(ans.spirit);
      const modifier = pick(['Aperol','Campari','Sweet vermouth','Vermouth bianco','Amaro Nonino','Cocchi Americano']);
      const topper = ans.occasion === 'celebration'
        ? 'Top with chilled prosecco'
        : 'Top with chilled ' + pick(['prosecco','soda','half prosecco / half soda']);
      return {
        ingredients: [modifier, base, topper],
        method: 'Build over ice. Stir gently.',
        garnish: pick(['Orange slice','Olive and an orange wheel','Lemon wheel and a rosemary sprig','Grapefruit peel and a basil leaf']),
        signature: 'spritz'
      };
    },
    milk_punch: (ans) => {
      const base = ['whiskey','rum','brandy'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Rum';
      return {
        ingredients: [
          base,
          cap(pick(['cold brew coffee','dark cacao liqueur','spiced syrup'])),
          cap(pick(['fresh oat milk','coconut cream','full-cream milk'])),
          cap(pick(['maple syrup','vanilla syrup','demerara syrup'])),
          'Fresh nutmeg',
        ],
        method: 'Shake very hard with ice so the texture lands silky. Double-strain.',
        garnish: pick(['Grated nutmeg','Cinnamon stick','Light dusting of cocoa']),
        signature: 'creamy'
      };
    },

    /* ----- New solo templates ----- */

    gimlet_classic: (ans) => {
      const base = ['gin','vodka'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Gin';
      return {
        ingredients: [
          base, 'Fresh lime juice',
          cap(pick(['lime cordial','rich lime cordial','cucumber-lime cordial'])),
          ...(ans.strength === 'light' ? ['Top with a splash of soda'] : []),
        ],
        method: 'Shake hard with ice. Double-strain into a chilled coupe.',
        garnish: pick(['Lime wheel on the rim','Cucumber ribbon','Expressed lime peel']),
        signature: 'citrus'
      };
    },
    paloma: () => ({
      ingredients: [
        'Tequila blanco', 'Fresh pink grapefruit juice', 'Fresh lime juice',
        cap(pick(['agave syrup','pink grapefruit cordial'])),
        'A pinch of salt',
        'Top with chilled grapefruit soda (or soda water)',
      ],
      method: 'Shake the base and citrus with ice. Strain over fresh ice and top.',
      garnish: pick(['Grapefruit wedge and a salted rim','Lime wheel','Pink peppercorns on a smoked salt rim']),
      signature: 'citrus'
    }),
    whiskey_smash: () => ({
      ingredients: [
        'Whisk(e)y (bourbon-leaning)',
        'Fresh lemon juice', 'Six to eight fresh mint leaves',
        cap(pick(['demerara syrup','honey syrup','maple syrup'])),
      ],
      method: 'Muddle mint gently with syrup. Add the rest. Shake hard with ice. Strain over crushed ice.',
      garnish: pick(['Slap of mint and a lemon wheel','Mint sprig and three lemon coins','Sugared mint top']),
      signature: 'herb'
    }),
    mai_tai: () => ({
      ingredients: [
        'Aged rum (with a float of overproof on top)', 'Fresh lime juice',
        'Orange curaçao', 'Orgeat (almond syrup)',
        cap(pick(['rich demerara','vanilla syrup'])),
      ],
      method: 'Shake with crushed ice. Pour, unstrained, into a tiki vessel.',
      garnish: pick(['Pineapple frond and a lime shell','Mint and a speared cherry','Toasted coconut and an orchid']),
      signature: 'tropical'
    }),
    martini_dry: (ans) => {
      const base = ans.spirit === 'vodka' ? 'Vodka' : 'Gin';
      return {
        ingredients: [
          base, cap(pick(['dry vermouth','dry vermouth with a dash of bianco'])),
          pick(['Orange bitters (one dash)','A drop of saline solution','A spoon of olive brine for a dirty serve']),
        ],
        method: 'Stir very long and very cold. Strain into a frozen coupe.',
        garnish: pick(['Expressed lemon peel','Two olives on a pick','Pickled onion (for a Gibson)']),
        signature: 'spirit-forward'
      };
    },
    negroni_sbagliato: () => ({
      ingredients: [
        'Campari',
        cap(pick(['sweet vermouth','rosso vermouth','vermouth con vaniglia'])),
        'Top with chilled prosecco (or other dry sparkling)',
      ],
      method: 'Build the Campari and vermouth over a big rock, then top with the sparkling. Stir once, gently.',
      garnish: pick(['Half orange wheel','Grapefruit peel','Orange peel and an olive']),
      signature: 'sparkle'
    }),
    pandan_collins: () => ({
      ingredients: [
        'Gin (or vodka for a softer pour)',
        'Pandan syrup (fresh leaves, steeped warm)',
        'Fresh lime juice',
        'Top with chilled soda',
      ],
      method: 'Shake the base, syrup, and citrus with ice. Strain over fresh ice in a tall glass. Top with soda.',
      garnish: pick(['A pandan leaf tied into a knot','Lime wheel and a pandan ribbon','A short pandan blade']),
      signature: 'malaysian-local'
    }),
    gula_melaka_old_fashioned: (ans) => {
      const base = ['whiskey','rum','brandy'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Whisk(e)y';
      return {
        ingredients: [
          base,
          'Gula melaka syrup (palm sugar, dissolved warm with a touch of water)',
          'Angostura bitters',
          cap(pick(['orange bitters','aromatic bitters','chocolate bitters'])),
        ],
        method: 'Stir over a single large ice cube until cold and softened.',
        garnish: pick(['Expressed orange peel and a coconut shaving','Lime peel and a clove','Toasted coconut chip on the rim']),
        signature: 'malaysian-local'
      };
    },
    calamansi_highball: (ans) => {
      const base = resolveBase(ans.spirit);
      return {
        ingredients: [
          base,
          'Fresh calamansi juice (about six fruit)',
          cap(pick(['palm sugar syrup','honey syrup','simple syrup'])),
          'Top with chilled soda (or tonic for a longer finish)',
        ],
        method: 'Shake the base, calamansi, and syrup with ice. Strain over fresh ice. Top.',
        garnish: pick(['Whole calamansi floated on top','Calamansi wheel and a lime leaf','Mint sprig and a calamansi cheek']),
        signature: 'malaysian-local'
      };
    },
    kopi_sour: (ans) => {
      const base = resolveBase(ans.spirit);
      const haveEggWhite = pick([true, true, false]);
      return {
        ingredients: [
          base, 'Kopi-O concentrate (cold)', 'Fresh lemon juice',
          cap(pick(['palm sugar syrup','gula melaka syrup','demerara syrup'])),
          ...(haveEggWhite ? ['Egg white (or aquafaba)'] : []),
        ],
        method: haveEggWhite
          ? 'Dry shake first, then shake hard with ice. Double-strain into a chilled coupe.'
          : 'Shake hard with ice. Double-strain into a chilled coupe.',
        garnish: pick(['Coffee beans on a coin of palm sugar','A lemon coin and three coffee beans','Cocoa nibs and a cinnamon dust']),
        signature: 'malaysian-local'
      };
    },

    /* ----- Duo templates ----- */

    garden_sour: () => ({
      ingredients: [
        'Gin', 'Basil-infused syrup (or fresh basil and simple)',
        'Fresh lemon juice', 'Egg white (or aquafaba)',
        pick(['A dash of orange bitters','A dash of celery bitters']),
      ],
      method: 'Dry shake first, then shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Basil leaf clap and a lemon coin','Three small basil tops','Lemon peel and a sprig of thyme']),
      signature: 'herb+citrus'
    }),
    jungle_bird: () => ({
      ingredients: [
        'Aged rum (dark or blackstrap)',
        'Campari',
        'Fresh pineapple juice',
        'Fresh lime juice',
        cap(pick(['rich demerara syrup','spiced syrup'])),
      ],
      method: 'Shake hard with ice. Strain over fresh ice in a rocks glass.',
      garnish: pick(['Pineapple frond and a pineapple wedge','Lime wheel and a brandied cherry','Toasted pineapple top']),
      signature: 'bitter+tropical'
    }),
    flora_fizz_xl: (ans) => ({
      ingredients: [
        resolveBase(ans.spirit),
        'Elderflower liqueur',
        'Fresh lemon juice (extra-generous)',
        cap(pick(['rose syrup','jasmine tea syrup','osmanthus syrup'])),
        ans.occasion === 'celebration' ? 'Top with chilled prosecco' : 'Top with chilled soda',
      ],
      method: 'Shake the base, citrus, and syrups with ice. Strain over fresh ice. Top.',
      garnish: pick(['Expressed lemon twist and three rose petals','Edible flower and a long lemon coin','Lemon zest curl and a sprig of thyme']),
      signature: 'flower+citrus'
    }),
    smoky_margarita: () => ({
      ingredients: [
        'Mezcal (with a teaspoon of tequila blanco for balance)',
        'Fresh lime juice',
        'Agave syrup',
        'Orange liqueur (or a dash of curaçao)',
        'Smoked salt for the rim',
      ],
      method: 'Shake hard with ice. Strain into a chilled coupe or rocks glass with a smoked-salt half-rim.',
      garnish: pick(['Dehydrated lime wheel and a pinch of chilli salt','Lime cheek and a pasilla chilli dust','Charred grapefruit twist']),
      signature: 'smoke+sweet'
    }),
  };

  // Multi-select profile pairs (keys alphabetically sorted).
  const DUO_TEMPLATES = {
    'citrusy+herbal': 'garden_sour',
    'bitter+citrusy': 'jungle_bird',
    'citrusy+floral': 'flora_fizz_xl',
    'smoky+sweet': 'smoky_margarita',
  };

  /* ----- Routing ----- */

  function pickTemplate(ans) {
    const moods = asArray(ans.mood);
    const profiles = asArray(ans.profile).slice().sort();
    const mood = moods.includes('awake') ? 'awake' : moods[0];
    const profile = profiles[0];
    const strength = ans.strength;
    const occasion = ans.occasion;
    const spirit = ans.spirit;

    // Duo lookup first
    if (profiles.length === 2) {
      const duoKey = profiles.join('+');
      if (DUO_TEMPLATES[duoKey]) return DUO_TEMPLATES[duoKey];
    }

    // Malaysia-local routes
    if (mood === 'awake' && profile === 'citrusy') return 'kopi_sour';
    if (mood === 'awake') return 'espresso_awake';
    if (profile === 'herbal' && strength === 'light') return 'pandan_collins';
    if (occasion === 'nightcap' && profile === 'sweet') return 'gula_melaka_old_fashioned';
    if (profile === 'citrusy' && (occasion === 'session' || occasion === 'with-food')) return 'calamansi_highball';

    // Tropical short-circuit
    if (profile === 'tropical') return 'tropical_shake';
    if (mood === 'adventurous' && ['sweet','citrusy','spicy'].includes(profile)) return 'tropical_shake';

    // Occasion routes
    if (occasion === 'celebration') {
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'bitter') return 'negroni_sbagliato';
      if (profile === 'herbal') return 'garden_stirred';
      return 'champagne_fizz';
    }
    if (occasion === 'nightcap') {
      if (profile === 'sweet') return 'milk_punch';
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'herbal') return 'garden_stirred';
      return 'old_fashioned';
    }
    if (occasion === 'aperitif') {
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'citrusy' && spirit === 'tequila') return 'paloma';
      return 'low_abv_spritz';
    }
    if (occasion === 'with-food') {
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'floral') return 'flora_fizz';
      return 'low_abv_spritz';
    }
    if (occasion === 'session') {
      if (profile === 'spicy') return 'highball_spice';
      if (profile === 'floral') return 'flora_fizz';
      if (profile === 'smoky') return 'smoke_sour';
      return 'low_abv_spritz';
    }

    // Anytime / fallthrough mood-spirit-profile combos
    if (profile === 'herbal' && (mood === 'mellow' || mood === 'comforting')) return 'whiskey_smash';
    if (profile === 'citrusy' && (spirit === 'gin' || spirit === 'vodka')) return 'gimlet_classic';
    if (profile === 'tropical' && spirit === 'rum') return 'mai_tai';
    if (spirit === 'tequila' && profile === 'citrusy') return 'paloma';
    if (spirit === 'gin' && strength === 'strong' && (profile === 'bitter' || profile === 'herbal')) return 'martini_dry';

    const byProfile = {
      citrusy: 'sour', sweet: 'sour', bitter: 'bitter_stirred',
      herbal: 'garden_stirred', smoky: 'smoke_sour', floral: 'flora_fizz',
      spicy: 'highball_spice', tropical: 'tropical_shake',
    };
    return byProfile[profile] || 'sour';
  }

  /* ----- Name generator ----- */

  const MOOD_WORDS = {
    refreshed: ['Bright','Clear','First','Bluebell','Daybreak','Crystal','Morning','Fresh-Cut','Lifted','Pivot','Mineral','Linen','Plein-Air','Vesper','Reset'],
    adventurous: ['Wild','Untamed','Roaming','Lost','Trespass','Outlaw','Drift','Compass','Frontier','Wayward','Vagrant','Driftwood','Ramble','Switchback','Northbound'],
    comforting: ['Slow','Hearth','Lantern','Late','Velvet','Quilt','Tender','Warm','Settle','Easy','Cardigan','Library','Fireside','Kindred','Domestic'],
    celebratory: ['Gilded','High','Festival','Crystal','Confetti','Toast','Encore','Spotlight','Champagne','Holiday','Marquee','Garland','Threshold','Standing-Ovation','Carousel'],
    mellow: ['Soft','Idle','Hush','Dusk','Lullaby','Drowse','Slow','Coast','Linger','Glide','Tide','Whisper','Sunday','Easy','Slope'],
    awake: ['Awake','Espresso','Daybreak','Sharp','Caffeinated','Sunrise','Alert','Bright-Eyed','Reset','Pulse','First-Train','Newsroom','Wide-Open','Sharp-Eyed','Filament'],
  };

  const PROFILE_NOUNS = {
    citrusy: ['Citrus','Lemon Tide','Yellow Hour','Daydream','Reset','Sunburst','Zest','Acid Test','Daylight','Sour Note','Tangerine','Lima','Verbena','Quarrel','Hour'],
    sweet: ['Honey','Sugar Coast','Sweet Talk','Caramel','Easy','Confection','Patisserie','Vanilla','Praline','Drift','Treacle','Marzipan','Custard','Sweetbrier','Plush'],
    bitter: ['Counsel','Aperitivo','Red Quarter','Negroni','Stitch','Argument','Verdict','Carmine','Bitter Half','Crimson','Apothecary','Cinder','Stricture','Italics','Rouge'],
    herbal: ['Garden','Field','Greenhouse','Thicket','Botanic','Hedgerow','Apothecary','Underbrush','Meadow','Cordial','Herbarium','Allotment','Forager','Sprig','Tincture'],
    smoky: ['Ember','Smoke Walker','Wildfire','Cinder','Forge','Ash Hour','Foundry','Bonfire','Brushfire','Furnace','Soot','Iron','Pit','Phoenix','Charcoal'],
    floral: ['Bloom','Petal','Rosebed','Garland','Greenhouse','Orchid','Bouquet','Hothouse','Florist','Festival','Peony','Camellia','Veranda','Sonnet','Posy'],
    spicy: ['Pepper','Storm','Mule','Ginger Walk','Heatwave','Spark','Friction','Brushfire','Chase','Wick','Cayenne','Catapult','Tide','Match','Coal'],
    tropical: ['Coconut','Trade Wind','Equator','Lagoon','Hibiscus','Calypso','Mango','Vacation','Atoll','Reef','Banyan','Verandah','Pineapple','Monsoon','Frangipani'],
  };

  const OCCASION_FLAVOUR = {
    aperitif: ['Aperture','Prelude','First Round','Opening','Prologue'],
    'with-food': ['Pairing','Course','Side Note','Companion','Plate-Mate'],
    nightcap: ['Nightcap','Last Round','Closing','Lullaby','Lights Down'],
    celebration: ['Toast','Confetti','Spotlight','Encore','Standing'],
    session: ['Long Pour','Saturday','Open Tab','Marathon','Slow Lane'],
    anytime: [],
  };

  function formatName(name) {
    const parts = name.split(' ');
    if (parts.length === 1) return name;
    return `${parts[0]} <i>${parts.slice(1).join(' ')}</i>`;
  }

  function generateName(ans) {
    const moods = asArray(ans.mood);
    const profiles = asArray(ans.profile);
    const adj = pick(MOOD_WORDS[moods[0]] || ['Custom']);

    let noun;
    const roll = Math.random();
    if (profiles.length === 2 && roll < 0.25) {
      noun = pick(PROFILE_NOUNS[profiles[1]] || PROFILE_NOUNS[profiles[0]] || ['Drink']);
    } else if (roll > 0.85 && OCCASION_FLAVOUR[ans.occasion] && OCCASION_FLAVOUR[ans.occasion].length) {
      noun = pick(OCCASION_FLAVOUR[ans.occasion]);
    } else {
      noun = pick(PROFILE_NOUNS[profiles[0]] || ['Drink']);
    }
    if (adj === noun) return formatName(`The ${adj}`);
    return formatName(`${adj} ${noun}`);
  }

  function generateTagline(ans, templateKey) {
    const profiles = asArray(ans.profile);
    const profile = profiles[0];
    const taglines = {
      espresso_awake: `Coffee-led and cold. Pour size is the bartender's call.`,
      sour: `A balanced ${profile === 'citrusy' ? 'citrus' : 'sweet'} sour. Shaken hard for a soft head.`,
      bitter_stirred: `Negroni-shaped. Stirred long and cold so the bitter sits behind the citrus oil.`,
      highball_spice: `Built tall over ice with spice doing the work.`,
      garden_stirred: `Vermouth-leaning, herb-forward. Stirred to keep it crystal.`,
      smoke_sour: `Mezcal forward, agave and lime to balance. Opens up over time.`,
      flora_fizz: `Light, perfumed, lifted by bubbles. ${ans.occasion === 'celebration' ? 'Topped with prosecco to mark the night.' : 'Topped long with soda or tonic.'}`,
      tropical_shake: `Tiki-shaped, open-poured over crushed ice. Easy in warm weather.`,
      champagne_fizz: `Citrus, sweetness, and a generous top of sparkling. Built to clink.`,
      old_fashioned: `Spirit forward. The bitters and sugar are in service of the base.`,
      low_abv_spritz: `Low-ABV, food-friendly. Made for slow conversation.`,
      milk_punch: `Velvety and dessert-leaning. Built for slow rooms.`,
      gimlet_classic: `A tight ratio of gin and lime cordial. Cold and direct.`,
      paloma: `Tequila with pink grapefruit and a pinch of salt. Made for warm afternoons.`,
      whiskey_smash: `Bourbon, mint, lemon. Built like a julep, drinks like a sour.`,
      mai_tai: `Aged rum, almond, lime. Tiki-shaped, never sweet.`,
      martini_dry: `Stirred until very cold, served very cold. Drink it slowly.`,
      negroni_sbagliato: `Negroni without the gin, with prosecco instead. Lower in alcohol, higher in joy.`,
      pandan_collins: `Gin, pandan, lime, soda. A KL highball with a green nose.`,
      gula_melaka_old_fashioned: `Whisky stirred down on palm sugar. Caramel and clove and aged spirit.`,
      calamansi_highball: `Six tiny limes, a long pour, ice cold. Made for sharing a plate.`,
      kopi_sour: `Local coffee, citrus, palm sugar. Wakes you up; calms you down.`,
      garden_sour: `Gin and basil, lemon and bubbles. The herb leads, the citrus lifts.`,
      jungle_bird: `Bitter, tropical, dark rum. Tiki shape, adult intent.`,
      flora_fizz_xl: `Lifted floral, extra lemon, lots of bubbles.`,
      smoky_margarita: `Mezcal forward, lime and agave, smoked salt rim.`,
    };
    let line = taglines[templateKey] || 'Built for your mood and palate.';
    if (profiles.length === 2) {
      line += ` ${cap(profiles[0])} and ${profiles[1]}, balanced.`;
    }
    return line;
  }

  /* ----- Recipe builder (seeded) ----- */

  function buildRecipe(ans, seed) {
    const originalRandom = Math.random;
    if (typeof seed === 'number') {
      Math.random = mulberry32(seed >>> 0);
    }
    try {
      const key = pickTemplate(ans);
      const fn = templates[key];
      const recipe = fn(ans);
      recipe.name = generateName(ans);
      recipe.tagline = generateTagline(ans, key);
      recipe.templateKey = key;
      return recipe;
    } finally {
      Math.random = originalRandom;
    }
  }

  function buildAlternateRecipe(ans, seed) {
    const profiles = asArray(ans.profile);
    const moods = asArray(ans.mood);
    const origKey = pickTemplate(ans);

    // Build a list of candidate mutated answer sets that might route to a
    // different template. First viable alt is used.
    const candidates = [];
    if (profiles.length === 2) {
      candidates.push(Object.assign({}, ans, { profile: [profiles[1]] }));
      candidates.push(Object.assign({}, ans, { profile: [profiles[0]] }));
    }
    if (moods.length === 2) {
      candidates.push(Object.assign({}, ans, { mood: [moods[1]] }));
    }
    const profileChain = ['citrusy','sweet','bitter','herbal','smoky','floral','spicy','tropical'];
    const startIdx = profileChain.indexOf(profiles[0]);
    if (startIdx >= 0) {
      for (let i = 1; i < profileChain.length; i++) {
        candidates.push(Object.assign({}, ans, { profile: [profileChain[(startIdx + i) % profileChain.length]] }));
      }
    }

    for (const cand of candidates) {
      const k = pickTemplate(cand);
      if (k && k !== origKey && templates[k]) {
        const originalRandom = Math.random;
        Math.random = mulberry32(seed >>> 0);
        try {
          const recipe = templates[k](cand);
          recipe.name = generateName(ans);
          recipe.tagline = generateTagline(ans, k);
          recipe.templateKey = k;
          return recipe;
        } finally {
          Math.random = originalRandom;
        }
      }
    }
    return buildRecipe(ans, seed);
  }

  /* ----- WhatsApp ----- */

  const NUMBERS = { dissolved: '601140087607', soluble: '601116828651' };
  const BAR_NAMES = { dissolved: 'Dissolved Solids', soluble: 'Soluble Solids' };

  function buildWhatsAppUrl(bar, ans, recipe) {
    const plainName = recipe.name.replace(/<\/?i>/g, '');
    const lines = [
      `*DRINK BUILDER*`,
      ``,
      `Hi ${BAR_NAMES[bar]}! I used the drink builder on your website (dissolvedsolids.co/builder) and I'd like to come in and have you make this for me.`,
      ``,
      `Drink: ${plainName}`,
      ``,
      `Ingredients (no quantities - you decide the pour):`,
      ...recipe.ingredients.map(i => `- ${i}`),
      ``,
      `Method: ${recipe.method}`,
      `Garnish: ${recipe.garnish}`,
      ``,
      `(Mood: ${fmtAnswer(ans.mood)} · profile: ${fmtAnswer(ans.profile)} · strength: ${ans.strength} · occasion: ${ans.occasion})`,
      ``,
      `Glass is your call. Substitute anything we don't have. Looking forward to it!`,
    ];
    return `https://wa.me/${NUMBERS[bar]}?text=` + encodeURIComponent(lines.join('\n'));
  }

  /* ----- Hash encode / decode ----- */

  function encodeHash(ans, reroll) {
    const fields = QUESTIONS.map((key) => {
      const v = ans[key];
      if (Array.isArray(v)) return v.slice().sort().join('+');
      return v || '';
    });
    let str = fields.join('.');
    if (reroll && reroll > 0) str += `.r${reroll}`;
    return str;
  }
  function decodeHash(hashStr) {
    const clean = (hashStr || '').replace(/^#/, '');
    if (!clean) return null;
    const parts = clean.split('.');
    let reroll = 0;
    if (parts.length && /^r\d+$/.test(parts[parts.length - 1])) {
      reroll = parseInt(parts.pop().slice(1), 10);
    }
    if (parts.length !== QUESTIONS.length) return null;
    const ans = {};
    for (let i = 0; i < QUESTIONS.length; i++) {
      const key = QUESTIONS[i];
      const v = parts[i];
      if (!v) return null;
      if (MULTI_KEYS.has(key)) {
        ans[key] = v.split('+').filter(Boolean);
      } else {
        ans[key] = v;
      }
    }
    return { ans: ans, reroll: reroll };
  }
  function validateAnswers(ans) {
    for (const key of QUESTIONS) {
      const v = ans[key];
      const pool = ALL_VALUES[key];
      if (MULTI_KEYS.has(key)) {
        if (!Array.isArray(v) || v.length === 0 || v.length > 2) return false;
        if (v.some((x) => !pool.includes(x))) return false;
      } else {
        if (!pool.includes(v)) return false;
      }
    }
    return true;
  }
  function seedFor(ans, reroll) {
    return cyrb53(encodeHash(ans, reroll));
  }

  /* ----- Random answer-set generator (for "Build everything for me") ----- */

  function randomAnswers() {
    const out = {};
    for (const key of QUESTIONS) {
      const pool = ALL_VALUES[key];
      const first = pool[Math.floor(Math.random() * pool.length)];
      if (MULTI_KEYS.has(key) && Math.random() < 0.5) {
        const rest = pool.filter((x) => x !== first);
        const second = rest[Math.floor(Math.random() * rest.length)];
        out[key] = [first, second].sort();
      } else if (MULTI_KEYS.has(key)) {
        out[key] = [first];
      } else {
        out[key] = first;
      }
    }
    return out;
  }

  /* ----- Mount function ----- */

  function mountBuilder(root) {
    if (root.dataset.builderMounted === '1') return;
    root.dataset.builderMounted = '1';

    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => Array.from(root.querySelectorAll(sel));

    const heroEl = $('.builder-hero');
    const flowEl = $('.builder-flow');
    const resultEl = $('.builder-result');
    const startBtn = $('.builder-start');
    const retryBtn = $('.builder-retry');
    const rerollBtn = $('.builder-reroll');
    const stripEl = $('.builder-progress-strip');

    const state = { step: 0, answers: {}, reroll: 0 };

    function freshAnswers() {
      const a = {};
      for (const k of QUESTIONS) a[k] = MULTI_KEYS.has(k) ? [] : '';
      return a;
    }
    function resetState() {
      state.answers = freshAnswers();
      state.reroll = 0;
    }
    resetState();

    function continueButtonFor(key) {
      return root.querySelector(`.builder-continue[data-for="${key}"]`);
    }

    function updateContinueButton(key) {
      const cont = continueButtonFor(key);
      if (!cont) return;
      const arr = asArray(state.answers[key]);
      if (arr.length === 0) {
        cont.hidden = true;
      } else {
        cont.hidden = false;
        const countEl = cont.querySelector('.continue-count');
        if (countEl) countEl.textContent = `${arr.length} of 2`;
      }
    }

    function prettyValue(v) {
      if (!v) return '—';
      if (Array.isArray(v)) {
        if (!v.length) return '—';
        return v.map((x) => cap(x.replace(/-/g, ' '))).join(' + ');
      }
      return cap(v.replace(/-/g, ' '));
    }
    function updateProgressStrip() {
      if (!stripEl) return;
      const slots = stripEl.querySelectorAll('[data-strip]');
      slots.forEach((slot) => {
        const key = slot.dataset.strip;
        const text = prettyValue(state.answers[key]);
        slot.textContent = text;
        slot.classList.toggle('is-filled', text !== '—');
      });
    }

    function showStep(n) {
      $$('.builder-step').forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === n));
      $$('.builder-progress span').forEach((p) => p.classList.toggle('is-done', Number(p.dataset.prog) <= n));
      state.step = n;
      updateProgressStrip();
      const scrollTarget = flowEl || root;
      const top = scrollTarget.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    function startQuiz() {
      if (heroEl) heroEl.hidden = true;
      flowEl.hidden = false;
      resultEl.classList.remove('is-active');
      resetState();
      $$('.builder-chip').forEach((c) => {
        c.classList.remove('is-selected');
        c.setAttribute('aria-pressed', 'false');
      });
      $$('.builder-continue').forEach((c) => { c.hidden = true; });
      showStep(1);
    }

    function pulseChip(el) {
      el.classList.remove('is-pulsing');
      void el.offsetWidth;
      el.classList.add('is-pulsing');
      setTimeout(() => el.classList.remove('is-pulsing'), 220);
    }

    function syncChipsForKey(key) {
      const group = root.querySelector(`.builder-chips[data-key="${key}"]`);
      if (!group) return;
      const sel = asArray(state.answers[key]);
      Array.from(group.querySelectorAll('.builder-chip')).forEach((c) => {
        const isSel = sel.includes(c.dataset.val);
        c.classList.toggle('is-selected', isSel);
        c.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      });
    }

    function recordAnswer(group, key, val, chipEl) {
      const isMulti = group.dataset.multi === '1';
      if (isMulti) {
        let arr = asArray(state.answers[key]).slice();
        const idx = arr.indexOf(val);
        if (idx > -1) {
          arr.splice(idx, 1);
        } else {
          if (arr.length >= 2) arr.shift();
          arr.push(val);
        }
        state.answers[key] = arr;
        syncChipsForKey(key);
        pulseChip(chipEl);
        updateContinueButton(key);
        updateProgressStrip();
      } else {
        state.answers[key] = val;
        syncChipsForKey(key);
        pulseChip(chipEl);
        updateProgressStrip();
        if (state.step < TOTAL_STEPS) {
          setTimeout(() => showStep(state.step + 1), 220);
        } else {
          setTimeout(showResult, 280);
        }
      }
    }

    function continueFromMulti(key) {
      const arr = asArray(state.answers[key]);
      if (arr.length === 0) return;
      if (state.step < TOTAL_STEPS) {
        showStep(state.step + 1);
      } else {
        showResult();
      }
    }

    function showResult() {
      const seed = seedFor(state.answers, state.reroll);
      const recipe = (state.reroll >= 2 && state.reroll % 2 === 0)
        ? buildAlternateRecipe(state.answers, seed)
        : buildRecipe(state.answers, seed);

      $('.result-name').innerHTML = recipe.name;
      $('.result-tagline').textContent = recipe.tagline;

      // Malaysian-local badge
      const existingTag = root.querySelector('.result-tag');
      if (existingTag) existingTag.remove();
      if (recipe.signature === 'malaysian-local') {
        const tag = document.createElement('span');
        tag.className = 'result-tag';
        tag.textContent = 'Malaysian local';
        $('.result-name').insertAdjacentElement('afterend', tag);
      }

      $('.result-method').textContent = recipe.method;
      $('.result-garnish').textContent = recipe.garnish;
      const ul = $('.result-ingredients');
      ul.innerHTML = '';
      recipe.ingredients.forEach((line, idx) => {
        const li = document.createElement('li');
        li.textContent = line;
        li.style.animationDelay = `${idx * 60}ms`;
        ul.appendChild(li);
      });
      $('.wa-dissolved').href = buildWhatsAppUrl('dissolved', state.answers, recipe);
      $('.wa-soluble').href = buildWhatsAppUrl('soluble', state.answers, recipe);

      flowEl.hidden = true;
      if (heroEl) heroEl.hidden = true;
      resultEl.classList.add('is-active');

      try {
        const hashStr = encodeHash(state.answers, state.reroll);
        const url = location.pathname + location.search + '#' + hashStr;
        history.replaceState(null, '', url);
      } catch (e) { /* noop */ }

      const top = resultEl.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    function reset() {
      resultEl.classList.remove('is-active');
      state.step = 0;
      resetState();
      $$('.builder-chip').forEach((c) => {
        c.classList.remove('is-selected');
        c.setAttribute('aria-pressed', 'false');
      });
      $$('.builder-continue').forEach((c) => { c.hidden = true; });
      updateProgressStrip();
      try {
        history.replaceState(null, '', location.pathname + location.search);
      } catch (e) { /* noop */ }
      if (heroEl) {
        heroEl.hidden = false;
        flowEl.hidden = true;
        heroEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        flowEl.hidden = false;
        showStep(1);
      }
    }

    function rerollResult() {
      state.reroll = (state.reroll || 0) + 1;
      showResult();
    }

    function surpriseEverything(e) {
      if (e && e.preventDefault) e.preventDefault();
      resetState();
      Object.assign(state.answers, randomAnswers());
      state.step = TOTAL_STEPS;
      if (heroEl) heroEl.hidden = true;
      flowEl.hidden = true;
      for (const k of QUESTIONS) syncChipsForKey(k);
      updateProgressStrip();
      showResult();
    }

    function loadFromHash() {
      const decoded = decodeHash(location.hash);
      if (!decoded) return false;
      if (!validateAnswers(decoded.ans)) return false;
      resetState();
      Object.assign(state.answers, decoded.ans);
      state.reroll = decoded.reroll || 0;
      state.step = TOTAL_STEPS;
      if (heroEl) heroEl.hidden = true;
      flowEl.hidden = true;
      for (const k of QUESTIONS) syncChipsForKey(k);
      updateProgressStrip();
      showResult();
      return true;
    }

    /* ----- Bind events ----- */

    $$('.builder-chips').forEach((group) => {
      const key = group.dataset.key;
      const isMulti = group.dataset.multi === '1';
      if (isMulti) {
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Choose up to two');
      }
      Array.from(group.querySelectorAll('.builder-chip')).forEach((chip) => {
        if (!chip.hasAttribute('aria-pressed')) chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', () => recordAnswer(group, key, chip.dataset.val, chip));
        chip.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' && isMulti) {
            ev.preventDefault();
            const arr = asArray(state.answers[key]);
            if (arr.length > 0) continueFromMulti(key);
          }
        });
      });
    });

    $$('.builder-continue').forEach((btn) => {
      const key = btn.dataset.for;
      btn.hidden = true;
      btn.addEventListener('click', () => continueFromMulti(key));
    });

    $$('.builder-back').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.step > 1) showStep(state.step - 1);
      });
    });

    $$('.builder-surprise').forEach((el) => {
      el.addEventListener('click', surpriseEverything);
    });

    if (retryBtn) retryBtn.addEventListener('click', reset);
    if (rerollBtn) rerollBtn.addEventListener('click', rerollResult);

    if (startBtn) {
      startBtn.addEventListener('click', startQuiz);
    } else {
      flowEl.hidden = false;
      const firstStep = $('.builder-step[data-step="1"]');
      if (firstStep) firstStep.classList.add('is-active');
      const firstProg = $('.builder-progress span[data-prog="1"]');
      if (firstProg) firstProg.classList.add('is-done');
      state.step = 1;
      updateProgressStrip();
    }

    // Hash on initial load
    if (location.hash) {
      loadFromHash();
    }
  }

  function init() {
    document.querySelectorAll('.builder-mount').forEach(mountBuilder);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
