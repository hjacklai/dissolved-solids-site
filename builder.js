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
    mood: ['refreshed','adventurous','comforting','celebratory','mellow','awake','cosy','playful'],
    spirit: ['gin','whiskey','vodka','rum','tequila','mezcal','brandy','surprise'],
    profile: ['citrusy','sweet','bitter','herbal','smoky','floral','spicy','tropical','creamy','nutty'],
    strength: ['light','medium','strong'],
    occasion: ['aperitif','with-food','nightcap','celebration','session','anytime','brunch','late-night'],
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

    /* ----- Expansion: classic strong sips ----- */

    manhattan: () => ({
      ingredients: [
        'Rye whisk(e)y (or bourbon for a softer pour)',
        cap(pick(['sweet vermouth','rosso vermouth','vermouth con vaniglia'])),
        'Angostura bitters', cap(pick(['orange bitters','aromatic bitters'])),
      ],
      method: 'Stir long and cold with ice. Strain into a chilled coupe.',
      garnish: pick(['Brandied cherry on a pick','Expressed orange peel','Lemon twist and a single cherry']),
      signature: 'spirit-forward'
    }),
    sazerac: () => ({
      ingredients: [
        'Rye whisk(e)y (or cognac for a softer take)',
        'Demerara syrup', "Peychaud's bitters", 'Dash of Angostura',
        'Absinthe rinse on the glass',
      ],
      method: 'Stir the rye, syrup, and bitters cold. Rinse a chilled rocks glass with absinthe, discard. Strain in.',
      garnish: pick(['Expressed lemon peel (discard the peel)','Long lemon twist','Lemon coin']),
      signature: 'spirit-forward'
    }),
    last_word: () => ({
      ingredients: [
        'Gin', 'Green chartreuse', 'Maraschino liqueur', 'Fresh lime juice',
      ],
      method: 'Equal parts. Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Brandied cherry','Lime peel','Three drops of green chartreuse on top']),
      signature: 'herb'
    }),
    vesper: () => ({
      ingredients: [
        'Gin', 'Vodka', 'Lillet Blanc (or Cocchi Americano)',
      ],
      method: 'Shake until very cold, double-strain into a frozen coupe. (Bond was wrong about stirring.)',
      garnish: pick(['Long lemon peel','Expressed orange peel','Olive on a pick']),
      signature: 'spirit-forward'
    }),
    aviation: () => ({
      ingredients: [
        'Gin', 'Maraschino liqueur', 'Crème de violette', 'Fresh lemon juice',
      ],
      method: 'Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Brandied cherry on the bottom','Lemon coin','A single violet petal']),
      signature: 'flower'
    }),
    corpse_reviver_2: () => ({
      ingredients: [
        'Gin', 'Cointreau', 'Lillet Blanc (or dry vermouth)', 'Fresh lemon juice',
        'Absinthe rinse on the glass',
      ],
      method: 'Rinse a chilled coupe with absinthe and discard. Shake the rest hard with ice and strain in.',
      garnish: pick(['Expressed lemon peel','Lemon coin','Brandied cherry on a pick']),
      signature: 'citrus'
    }),
    boulevardier: () => ({
      ingredients: [
        'Bourbon (or rye for more bite)',
        'Campari',
        cap(pick(['sweet vermouth','vermouth con vaniglia','rosso vermouth'])),
      ],
      method: 'Stir over ice until cold. Strain over a single large ice cube in a rocks glass.',
      garnish: pick(['Expressed orange peel','Lemon twist','Orange wheel and an olive']),
      signature: 'bitter'
    }),

    /* ----- Expansion: long + sessionable ----- */

    mojito: () => ({
      ingredients: [
        'White rum', 'Six to eight fresh mint leaves',
        'Fresh lime juice',
        cap(pick(['cane sugar','simple syrup','demerara syrup'])),
        'Top with chilled soda',
      ],
      method: 'Muddle mint gently with sugar and lime. Add rum, fill with crushed ice, stir. Top with soda.',
      garnish: pick(['Big mint bouquet','Mint sprig and a lime wheel','Mint top and three lime coins']),
      signature: 'herb'
    }),
    tom_collins: () => ({
      ingredients: [
        'Gin', 'Fresh lemon juice',
        cap(pick(['simple syrup','rich syrup'])),
        'Top with chilled soda',
      ],
      method: 'Shake the gin, lemon, and syrup with ice. Strain into a tall glass over fresh ice. Top.',
      garnish: pick(['Lemon wheel and a maraschino cherry','Three lemon coins','Lemon twist and a fresh mint top']),
      signature: 'citrus'
    }),
    moscow_mule: () => ({
      ingredients: [
        'Vodka', 'Fresh lime juice',
        'Top with chilled ginger beer',
      ],
      method: 'Build over ice in a copper mug (or any tall glass). Stir gently.',
      garnish: pick(['Lime wedge and crystallised ginger','Mint sprig and a lime cheek','Cucumber ribbon']),
      signature: 'ginger'
    }),
    dark_n_stormy: () => ({
      ingredients: [
        'Dark rum (Gosling\'s if we have it)',
        'Fresh lime juice',
        'Top with chilled ginger beer',
      ],
      method: 'Build over ice. Float the dark rum on top so it streaks down through the ginger beer.',
      garnish: pick(['Lime wedge','Candied ginger on a pick','Mint sprig and a lime wheel']),
      signature: 'ginger'
    }),
    southside: () => ({
      ingredients: [
        'Gin', 'Six to eight fresh mint leaves', 'Fresh lime juice',
        cap(pick(['simple syrup','mint-infused syrup'])),
      ],
      method: 'Muddle mint with syrup gently. Shake with the gin and lime, ice-cold. Double-strain into a chilled coupe.',
      garnish: pick(['Three small mint tops','Lime coin and a mint sprig','Slap of mint']),
      signature: 'herb'
    }),

    /* ----- Expansion: sweet + brunch + dessert ----- */

    bee_knees: () => ({
      ingredients: [
        'Gin', 'Honey syrup (1:1 honey to warm water)',
        'Fresh lemon juice',
      ],
      method: 'Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Lemon coin','Honeycomb shard on the rim','Expressed orange peel']),
      signature: 'sweet'
    }),
    gold_rush: () => ({
      ingredients: [
        'Bourbon', 'Honey syrup (1:1 honey to warm water)', 'Fresh lemon juice',
      ],
      method: 'Shake hard with ice. Strain over a single large ice cube.',
      garnish: pick(['Lemon twist','Honeycomb shard','Sugared lemon coin']),
      signature: 'sweet'
    }),
    bramble: () => ({
      ingredients: [
        'Gin', 'Fresh lemon juice',
        cap(pick(['simple syrup','rich syrup'])),
        'Crème de mûre (or blackberry liqueur), drizzled on top',
      ],
      method: 'Shake the gin, lemon, and syrup. Strain over crushed ice. Drizzle the mûre over the top so it bleeds down.',
      garnish: pick(['Two fresh blackberries','Lemon wheel and a blackberry on a pick','Mint top and a single blackberry']),
      signature: 'sweet'
    }),
    clover_club: () => ({
      ingredients: [
        'Gin', 'Fresh lemon juice', 'Raspberry syrup (or muddled fresh raspberries with simple)',
        'Egg white (or aquafaba)',
      ],
      method: 'Dry shake first, then shake hard with ice. Double-strain into a chilled coupe so the head sits clean.',
      garnish: pick(['Two raspberries on a pick','Single raspberry floated','Lemon coin and a rose petal']),
      signature: 'sweet'
    }),
    french_75: () => ({
      ingredients: [
        'Gin (or cognac for a French 76)',
        'Fresh lemon juice',
        cap(pick(['simple syrup','rich syrup'])),
        'Top with chilled champagne (or prosecco)',
      ],
      method: 'Shake the gin, lemon, and syrup with ice. Strain into a chilled flute. Top with the sparkling.',
      garnish: pick(['Long lemon spiral','Lemon coin and an edible flower','Lemon twist']),
      signature: 'sparkle'
    }),
    pina_colada: () => ({
      ingredients: [
        'Aged white rum (with an overproof float if you like)',
        'Fresh pineapple juice',
        'Coconut cream',
        'Fresh lime juice',
      ],
      method: 'Blend with crushed ice until silky. Pour into a hurricane (or any tall glass).',
      garnish: pick(['Pineapple wedge and a maraschino cherry','Toasted coconut flake rim','Pineapple frond and an orchid']),
      signature: 'tropical'
    }),

    /* ----- Expansion: smoky + agave ----- */

    naked_famous: () => ({
      ingredients: [
        'Mezcal', 'Yellow chartreuse', 'Aperol', 'Fresh lime juice',
      ],
      method: 'Equal parts. Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Lime coin','Expressed grapefruit peel','Single charred lime wheel']),
      signature: 'smoke'
    }),
    oaxaca_old_fashioned: () => ({
      ingredients: [
        'Reposado tequila', 'Mezcal (a barspoon)',
        'Agave syrup', 'Mole bitters (or angostura with a chocolate dash)',
      ],
      method: 'Stir over a large ice cube until cold and softened.',
      garnish: pick(['Flamed orange peel','Charred orange wheel','Orange peel and a pinch of smoked salt']),
      signature: 'spirit-forward'
    }),

    /* ----- Expansion: Malaysian local ----- */

    teh_tarik_old_fashioned: () => ({
      ingredients: [
        'Bourbon (or aged rum)',
        'Teh tarik reduction (strong black tea, condensed milk, reduced to a syrup)',
        'A dash of cardamom bitters',
        'A pinch of sea salt',
      ],
      method: 'Stir over a large ice cube until cold. Salt brings the milk-tea aroma forward.',
      garnish: pick(['Expressed orange peel and a star anise','Three cardamom pods on a pick','A cinnamon stick burned to scent']),
      signature: 'malaysian-local'
    }),
    cili_padi_margarita: () => ({
      ingredients: [
        'Tequila blanco', 'Fresh lime juice', 'Agave syrup',
        'Half a cili padi, muddled (seeds in for heat)',
        'Smoked salt or chilli-salt for the rim',
      ],
      method: 'Muddle the cili padi with agave. Shake everything hard with ice. Double-strain into a salt-rimmed coupe.',
      garnish: pick(['Lime wheel and a slit cili padi','Whole cili padi floated','Lime coin with chilli salt dusted on'    ]),
      signature: 'malaysian-local'
    }),
    cendol_milk_punch: () => ({
      ingredients: [
        'Aged rum',
        'Coconut milk (or coconut cream cut with whole milk)',
        'Gula melaka syrup',
        'Pandan tincture (or a few drops of pandan extract)',
        'A pinch of salt',
      ],
      method: 'Shake very hard with ice so the texture lands silky. Double-strain over fresh ice.',
      garnish: pick(['A pandan leaf knot and a curl of gula melaka','Toasted coconut flakes','Three green cendol noodles floated on top']),
      signature: 'malaysian-local'
    }),
    bandung_spritz: (ans) => ({
      ingredients: [
        ans.spirit === 'gin' ? 'Gin' : 'Vodka',
        'Rose syrup (Bandung-style, the pink one)',
        'A short pour of full-cream milk (or oat for vegan)',
        'Top with chilled prosecco',
      ],
      method: 'Build the base, rose syrup, and milk over ice in a wine glass. Stir gently. Top with prosecco.',
      garnish: pick(['Three rose petals','A long lemon zest','Dried hibiscus flower on the rim']),
      signature: 'malaysian-local'
    }),
    nasi_lemak_old_fashioned: () => ({
      ingredients: [
        'Bourbon (or aged rum)',
        'Pandan-coconut syrup (pandan steeped in warm coconut sugar water)',
        'A pinch of sea salt',
        'Angostura bitters',
      ],
      method: 'Stir over a large ice cube until cold. The salt + coconut + pandan does the nasi lemak nod.',
      garnish: pick(['Toasted coconut chip on the rim','A pandan leaf ribbon and a coconut shaving','Charred lime peel and a coconut flake']),
      signature: 'malaysian-local'
    }),

    /* ----- Expansion: duo combos ----- */

    spicy_paloma: () => ({
      ingredients: [
        'Tequila blanco (or mezcal for smoke)', 'Fresh pink grapefruit juice',
        'Fresh lime juice', 'Half a cili padi, muddled', 'Agave syrup',
        'A pinch of salt', 'Top with chilled grapefruit soda',
      ],
      method: 'Muddle the cili padi with agave. Shake the rest with ice. Strain over fresh ice. Top.',
      garnish: pick(['Pink grapefruit wedge with chilli salt rim','Slit cili padi floated','Charred grapefruit twist']),
      signature: 'spicy+citrus'
    }),
    tropical_mojito: () => ({
      ingredients: [
        'White rum (with an aged float)',
        'Fresh pineapple juice (or muddled fresh pineapple)',
        'Fresh lime juice', 'Six to eight fresh mint leaves',
        cap(pick(['cane sugar','demerara syrup'])),
        'Top with chilled soda',
      ],
      method: 'Muddle mint with sugar. Shake the rest. Pour over crushed ice. Top.',
      garnish: pick(['Pineapple wedge and a mint bouquet','Lime wheel and a pineapple frond','Toasted coconut and a mint top']),
      signature: 'citrus+tropical'
    }),
    herbal_negroni: (ans) => ({
      ingredients: [
        ans.spirit === 'whiskey' ? 'Bourbon' : 'Gin',
        'Campari',
        'Cynar (artichoke amaro)',
        'Sweet vermouth',
        'A dash of celery bitters',
      ],
      method: 'Stir over ice until cold. Strain over a large ice cube.',
      garnish: pick(['Expressed grapefruit peel','Olive and an orange wheel','Celery leaf and an orange peel']),
      signature: 'bitter+herb'
    }),
    boulevardier_rich: () => ({
      ingredients: [
        'Bourbon (or rye)',
        'Campari',
        'Sweet vermouth (with a dash of vermouth con vaniglia)',
        'A barspoon of maple syrup',
      ],
      method: 'Stir over ice until cold. Strain over a large rock.',
      garnish: pick(['Expressed orange peel','Lemon twist','Brandied cherry']),
      signature: 'bitter+sweet'
    }),
    garden_botanic: () => ({
      ingredients: [
        'Gin', 'Elderflower liqueur',
        'Fresh lemon juice',
        cap(pick(['basil syrup','rosemary syrup','thyme honey syrup'])),
        'Top with chilled tonic',
      ],
      method: 'Shake the base, citrus, and syrups with ice. Strain over fresh ice. Top with tonic.',
      garnish: pick(['Rosemary sprig and a lemon coin','Basil leaf clap and an edible flower','Thyme sprig and a sliced cucumber wheel']),
      signature: 'floral+herb'
    }),
    blossom_bramble: () => ({
      ingredients: [
        'Gin', 'Fresh lemon juice', 'Rose syrup',
        'Crème de mûre, drizzled on top',
      ],
      method: 'Shake the gin, lemon, and rose with ice. Strain over crushed ice. Drizzle the mûre over the top so it bleeds down.',
      garnish: pick(['Two raspberries and a rose petal','Lemon coin and three small berries','Edible flower and a lemon zest']),
      signature: 'floral+sweet'
    }),

    /* ----- Expansion: creamy + nutty profiles ----- */

    alexander: (ans) => {
      const base = ['brandy','gin'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Brandy';
      return {
        ingredients: [
          base,
          'Crème de cacao (dark for brandy, white for gin)',
          'Fresh cream',
          'A grate of nutmeg',
        ],
        method: 'Shake hard with ice so the cream emulsifies. Double-strain into a chilled coupe.',
        garnish: pick(['Grated nutmeg','Three coffee beans','Cocoa nibs on the rim']),
        signature: 'creamy'
      };
    },
    white_russian: () => ({
      ingredients: [
        'Vodka', 'Coffee liqueur',
        cap(pick(['fresh cream','oat cream','full-cream milk'])),
      ],
      method: 'Build vodka and coffee liqueur over ice. Slowly float the cream over the back of a spoon.',
      garnish: pick(['Three coffee beans','A dusting of cocoa','Grated chocolate']),
      signature: 'creamy'
    }),
    golden_milk_punch: () => ({
      ingredients: [
        'Aged rum (or bourbon)',
        'Turmeric-ginger syrup (warm-infused)',
        'Coconut cream',
        'A pinch of black pepper',
        'A pinch of sea salt',
      ],
      method: 'Shake very hard with ice. Double-strain over fresh ice in a rocks glass.',
      garnish: pick(['Toasted coconut chip and a turmeric thread','Cracked black pepper','A coconut shaving and a pinch of cardamom']),
      signature: 'creamy'
    }),
    orgeat_swizzle: (ans) => {
      const base = ['rum','brandy','whiskey'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Rum';
      return {
        ingredients: [
          base,
          'Orgeat (almond syrup)',
          'Fresh lime juice',
          'Angostura bitters',
        ],
        method: 'Swizzle with crushed ice in a tall glass until the outside frosts.',
        garnish: pick(['Mint bouquet and a lime wheel','Toasted almond and a mint sprig','Three star anise on a pick']),
        signature: 'nutty'
      };
    },
    nutty_old_fashioned: (ans) => {
      const base = ['whiskey','rum','brandy'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Whisk(e)y';
      return {
        ingredients: [
          base,
          cap(pick(['hazelnut syrup','toasted-pecan syrup','walnut bitters dose'])),
          'Angostura bitters',
          cap(pick(['orange bitters','black walnut bitters','chocolate bitters'])),
        ],
        method: 'Stir over a large ice cube until cold and softened.',
        garnish: pick(['Expressed orange peel and a toasted hazelnut','Lemon twist and a walnut half','Smoked orange peel']),
        signature: 'nutty'
      };
    },

    /* ----- Expansion: brunch + late-night occasions ----- */

    mimosa: () => ({
      ingredients: [
        cap(pick(['fresh orange juice','fresh grapefruit juice','a 50/50 of orange and grapefruit'])),
        'Top with chilled prosecco (or champagne)',
        pick(['A small dash of triple sec','A drop of orange bitters','A pinch of saline solution']),
      ],
      method: 'Pour the juice into a chilled flute. Top with the sparkling. Stir once, gently.',
      garnish: pick(['Long orange spiral','Single orange wheel on the rim','Sprig of fresh mint']),
      signature: 'sparkle'
    }),
    bloody_mary: (ans) => {
      const base = ['vodka','tequila','gin'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Vodka';
      return {
        ingredients: [
          base,
          'Tomato juice (proper, not from concentrate)',
          'Fresh lemon juice',
          'Worcestershire sauce, Tabasco, fresh black pepper',
          'A pinch of celery salt',
          pick(['A small dose of sambal for local heat','A spoon of horseradish for a sharper finish','A drop of saline']),
        ],
        method: 'Roll back and forth between two tins with ice (do not shake hard - keeps texture clean). Strain over fresh ice.',
        garnish: pick(['Celery stick and a lemon wedge','Pickled long bean and a cherry tomato','Crispy bacon and a green olive']),
        signature: 'savoury'
      };
    },
    hot_toddy: (ans) => {
      const base = ['whiskey','brandy','rum'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Whisk(e)y';
      return {
        ingredients: [
          base,
          'Hot water (just off the boil)',
          'Fresh lemon juice',
          cap(pick(['honey','demerara syrup','maple syrup'])),
          pick(['A whole clove or two','A short cinnamon stick','A slice of fresh ginger']),
        ],
        method: 'Build in a warmed mug. Stir gently. Steep two minutes so the spice opens up.',
        garnish: pick(['Long lemon twist','Cinnamon stick and a clove','Star anise floated']),
        signature: 'comforting'
      };
    },
    irish_coffee: () => ({
      ingredients: [
        'Irish whiskey',
        'Hot freshly-brewed coffee (or a strong kopi-O)',
        cap(pick(['demerara sugar','brown sugar syrup','gula melaka syrup'])),
        'Lightly-whipped fresh cream (float)',
      ],
      method: 'Warm a stemmed glass. Stir whiskey, sugar, and coffee together. Float the cream over the back of a spoon so it sits.',
      garnish: pick(['Grated nutmeg on the cream','A dusting of cocoa','Three coffee beans']),
      signature: 'creamy'
    }),
    sgroppino: () => ({
      ingredients: [
        'Vodka (or limoncello for a softer take)',
        'Lemon sorbet',
        'Top with chilled prosecco',
      ],
      method: 'Spoon a scoop of sorbet into a chilled flute or coupe. Pour the vodka and prosecco over it. Stir once, very gently.',
      garnish: pick(['Long lemon zest','Sprig of mint','Single basil leaf']),
      signature: 'sparkle'
    }),

    /* ============================================================
       Mega-expansion - 30 more templates so the same answer set
       can route to a fresher drink each visit, and so newly-added
       chips (cosy, playful, brunch, late-night, creamy, nutty) get
       deeper coverage.
       ============================================================ */

    /* --- Classics & near-classics --- */

    vieux_carre: () => ({
      ingredients: ['Rye whisky', 'Cognac', 'Sweet vermouth', 'Bénédictine (barspoon)', 'Peychaud\'s bitters', 'Angostura bitters'],
      method: 'Stir all ingredients over ice until very cold. Strain over a single large cube.',
      garnish: pick(['Lemon twist','Brandied cherry','Expressed orange peel']),
      signature: 'spirit-forward'
    }),
    paper_plane: () => ({
      ingredients: ['Bourbon', 'Amaro Nonino (or Montenegro)', 'Aperol', 'Fresh lemon juice'],
      method: 'Equal parts. Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Lemon coin','Brandied cherry','None - the colour is the garnish']),
      signature: 'bitter'
    }),
    trinidad_sour: () => ({
      ingredients: ['Angostura bitters 45ml (yes - 45ml)', 'Orgeat 30ml', 'Rye whisky 15ml', 'Fresh lemon juice 25ml'],
      method: 'Shake hard with ice. Double-strain. The bitters are the base spirit here.',
      garnish: pick(['Lemon coin','Star anise','Dehydrated lemon wheel']),
      signature: 'bitter'
    }),
    hanky_panky: () => ({
      ingredients: ['Gin', 'Sweet vermouth', 'Fernet-Branca (barspoon)'],
      method: 'Stir very cold. Strain into a chilled coupe.',
      garnish: pick(['Orange peel','Expressed grapefruit peel','Lemon twist']),
      signature: 'bitter'
    }),
    aperol_spritz: () => ({
      ingredients: ['Aperol 60ml', 'Prosecco 90ml', 'Soda water splash'],
      method: 'Build over ice in a large wine glass. Stir once gently.',
      garnish: pick(['Half orange slice','Two olives','Orange wheel and a sprig of thyme']),
      signature: 'spritz'
    }),
    americano: () => ({
      ingredients: ['Campari', 'Sweet vermouth', 'Top with soda'],
      method: 'Build over ice in a highball. Stir gently.',
      garnish: pick(['Orange slice','Lemon wheel','Orange peel and an olive']),
      signature: 'bitter'
    }),
    bicicletta: () => ({
      ingredients: ['Campari', 'Dry white wine (Pinot Grigio or similar)', 'Top with soda'],
      method: 'Build over ice in a wine glass. Stir once.',
      garnish: pick(['Half orange slice','Lemon wheel','Sprig of basil']),
      signature: 'bitter'
    }),
    pimms_cup: () => ({
      ingredients: ['Pimm\'s No. 1', 'Top with chilled lemonade (or ginger beer)', 'Cucumber ribbon, strawberry, orange wheel, mint sprig'],
      method: 'Build over ice in a tall glass. Stir, garnish generously.',
      garnish: pick(['Big cucumber ribbon and mint','Strawberry on a pick','Orange wheel and three mint tops']),
      signature: 'spritz'
    }),

    /* --- Tropical / tiki --- */

    painkiller: () => ({
      ingredients: ['Dark rum (Pusser\'s if you have it) 60ml', 'Pineapple juice 90ml', 'Orange juice 30ml', 'Coconut cream 30ml'],
      method: 'Shake hard with ice. Pour, unstrained, into a tiki vessel or tall glass.',
      garnish: pick(['Grated nutmeg and pineapple frond','Orange wheel and toasted coconut','Pineapple wedge and a maraschino cherry']),
      signature: 'tropical'
    }),
    zombie: () => ({
      ingredients: ['Light rum', 'Dark rum', 'Overproof rum (float)', 'Lime juice', 'Pineapple juice', 'Falernum', 'Grenadine', 'Angostura'],
      method: 'Shake hard with crushed ice. Pour, unstrained, into a tall tiki glass. Float the overproof on top.',
      garnish: pick(['Mint bouquet and a flaming lime shell','Pineapple frond and a speared cherry','Orchid and a pineapple wedge']),
      signature: 'tropical'
    }),
    hurricane: () => ({
      ingredients: ['Light rum', 'Dark rum', 'Passion fruit puree', 'Fresh lime juice', 'Grenadine', 'Simple syrup'],
      method: 'Shake hard with ice. Pour over fresh ice in a hurricane glass.',
      garnish: pick(['Orange wheel and a cherry','Lime wheel and a passion-fruit half','Pineapple frond and three cherries']),
      signature: 'tropical'
    }),
    doctor_funk: () => ({
      ingredients: ['Dark rum', 'Fresh lime juice', 'Grenadine', 'Absinthe rinse', 'Top with soda'],
      method: 'Rinse a chilled glass with absinthe, discard. Shake the rest with ice. Strain into the rinsed glass over fresh ice. Top with soda.',
      garnish: pick(['Lime wheel and a mint sprig','Dehydrated lime','Mint top']),
      signature: 'tropical'
    }),

    /* --- Creamy & dessert --- */

    brandy_alexander: () => ({
      ingredients: ['Brandy (or cognac) 30ml', 'Dark crème de cacao 30ml', 'Fresh cream 30ml'],
      method: 'Shake hard with ice so the cream emulsifies. Double-strain into a chilled coupe.',
      garnish: pick(['Grated nutmeg','Three coffee beans','Light cocoa dusting']),
      signature: 'creamy'
    }),
    grasshopper: () => ({
      ingredients: ['Green crème de menthe 30ml', 'White crème de cacao 30ml', 'Fresh cream 30ml'],
      method: 'Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Mint leaf','Light cocoa dusting','Sugar-coated mint sprig']),
      signature: 'creamy'
    }),
    pink_squirrel: () => ({
      ingredients: ['Crème de noyaux (or amaretto) 30ml', 'White crème de cacao 30ml', 'Fresh cream 30ml'],
      method: 'Shake hard with ice. Double-strain.',
      garnish: pick(['Three toasted almonds','Light cocoa dusting','Maraschino cherry']),
      signature: 'creamy'
    }),

    /* --- Modern gin classics --- */

    gin_basil_smash: () => ({
      ingredients: ['Gin 50ml', 'Fresh basil leaves (8-10)', 'Fresh lemon juice 25ml', 'Simple syrup 15ml'],
      method: 'Muddle basil with syrup. Add gin and lemon, shake hard with ice. Double-strain over fresh ice.',
      garnish: pick(['Big basil top','Three basil leaves','Lemon coin and a basil sprig']),
      signature: 'herb'
    }),
    lavender_collins: () => ({
      ingredients: ['Gin 45ml', 'Lavender syrup 20ml', 'Fresh lemon juice 25ml', 'Top with soda'],
      method: 'Shake gin, syrup, and lemon with ice. Strain over fresh ice. Top with soda.',
      garnish: pick(['Sprig of lavender','Lemon wheel and edible flower','Three lemon coins']),
      signature: 'floral'
    }),
    elderflower_gimlet: (ans) => ({
      ingredients: [ans.spirit === 'vodka' ? 'Vodka' : 'Gin', 'Elderflower liqueur', 'Fresh lime juice', 'Simple syrup (barspoon)'],
      method: 'Shake hard with ice. Double-strain into a chilled coupe.',
      garnish: pick(['Lime coin','Edible flower','Three cucumber ribbons']),
      signature: 'floral'
    }),

    /* --- Tequila & mezcal --- */

    tommy_margarita: () => ({
      ingredients: ['Tequila blanco 50ml', 'Fresh lime juice 25ml', 'Agave syrup 15ml'],
      method: 'Shake hard with ice. Strain over fresh ice (rocks) or into a chilled coupe.',
      garnish: pick(['Lime wheel and salted rim','Lime cheek','Dehydrated lime']),
      signature: 'citrus'
    }),
    mexican_mule: () => ({
      ingredients: ['Tequila 50ml', 'Fresh lime juice 20ml', 'Top with ginger beer'],
      method: 'Build over ice in a copper mug. Stir gently.',
      garnish: pick(['Lime wedge','Mint sprig','Candied ginger']),
      signature: 'spicy'
    }),
    mezcal_negroni: () => ({
      ingredients: ['Mezcal 30ml', 'Campari 30ml', 'Sweet vermouth 30ml'],
      method: 'Stir over ice until cold. Strain over a large cube.',
      garnish: pick(['Expressed orange peel','Charred orange wheel','Lemon twist and an olive']),
      signature: 'smoke'
    }),

    /* --- Whiskey / bourbon --- */

    mint_julep: () => ({
      ingredients: ['Bourbon 60ml', 'Fresh mint (8-10 leaves)', 'Demerara syrup 15ml'],
      method: 'Muddle mint with syrup in a julep cup. Fill with crushed ice, add bourbon, stir until cup frosts.',
      garnish: pick(['Big mint bouquet','Mint sprig and powdered sugar','Three mint tops']),
      signature: 'herb'
    }),
    john_collins: () => ({
      ingredients: ['Bourbon 50ml', 'Fresh lemon juice 25ml', 'Simple syrup 15ml', 'Top with soda'],
      method: 'Shake bourbon, lemon, and syrup with ice. Strain over fresh ice in a tall glass. Top.',
      garnish: pick(['Lemon wheel and a cherry','Three lemon coins','Lemon twist']),
      signature: 'citrus'
    }),
    whiskey_sour_classic: () => ({
      ingredients: ['Bourbon 50ml', 'Fresh lemon juice 25ml', 'Simple syrup 15ml', 'Egg white 15ml', 'Angostura'],
      method: 'Dry shake. Add ice, shake hard. Double-strain into a chilled coupe. Drop 3 dashes of angostura on the foam.',
      garnish: pick(['Lemon coin','Three angostura dots in a line','Brandied cherry']),
      signature: 'citrus'
    }),

    /* --- Spritzes --- */

    hugo_spritz: () => ({
      ingredients: ['Elderflower liqueur (St-Germain) 45ml', 'Prosecco 90ml', 'Soda water splash', '8 fresh mint leaves'],
      method: 'Build in a wine glass over ice with the mint. Stir once gently.',
      garnish: pick(['Mint sprig and lime wheel','Lemon coin and edible flower','Three mint tops']),
      signature: 'spritz'
    }),
    st_germain_spritz: () => ({
      ingredients: ['St-Germain elderflower 60ml', 'Top with prosecco', 'Splash of soda'],
      method: 'Build in a wine glass over ice. Stir once.',
      garnish: pick(['Lemon coin','Edible flower','Cucumber ribbon']),
      signature: 'floral'
    }),
    pirlo: () => ({
      ingredients: ['Aperol 60ml', 'Top with chilled dry white wine', 'Soda splash'],
      method: 'Build over ice. Stir once gently.',
      garnish: pick(['Orange wheel','Olive on a pick','Lemon coin']),
      signature: 'spritz'
    }),

    /* --- Malaysian-local creative builds --- */

    asam_boi_sour: (ans) => ({
      ingredients: [
        ['whiskey','vodka','rum','gin'].includes(ans.spirit) ? SPIRITS[ans.spirit] : 'Whisk(e)y',
        'Asam boi syrup (sour preserved-plum syrup)',
        'Fresh lime juice',
        'Demerara syrup (small amount)',
        'Egg white (or aquafaba)',
      ],
      method: 'Dry shake. Add ice, shake hard. Double-strain into a chilled coupe.',
      garnish: pick(['Single asam boi on a pick','Lime coin and asam boi dust','Three drops of plum bitters']),
      signature: 'malaysian-local'
    }),
    calamansi_mojito: () => ({
      ingredients: [
        'White rum', '8 fresh mint leaves',
        'Fresh calamansi juice (about 5 fruit)',
        'Palm sugar syrup',
        'Top with soda',
      ],
      method: 'Muddle mint with syrup. Add rum and calamansi, fill with crushed ice, stir. Top.',
      garnish: pick(['Big mint bouquet','Calamansi wheels','Mint sprig and a pandan ribbon']),
      signature: 'malaysian-local'
    }),
    bunga_kantan_gimlet: () => ({
      ingredients: [
        'Gin',
        'Fresh torch ginger flower (bunga kantan), thinly sliced',
        'Lime cordial',
        'Splash of fresh lime juice',
      ],
      method: 'Muddle the bunga kantan with cordial gently. Shake with the rest, double-strain into a chilled coupe.',
      garnish: pick(['A single bunga kantan petal','Lime coin and a small lemongrass stalk','Three drops of celery bitters']),
      signature: 'malaysian-local'
    }),
    sambal_margarita: () => ({
      ingredients: [
        'Tequila blanco',
        'Fresh lime juice', 'Agave syrup',
        'A pinch of sambal belacan muddled in (or sambal salt rim)',
      ],
      method: 'Shake with ice. Strain into a glass with a sambal-salt rim.',
      garnish: pick(['Lime wheel and chilli salt','Slit cili padi','Charred lime cheek']),
      signature: 'malaysian-local'
    }),
    pandan_milk_punch: () => ({
      ingredients: [
        'Aged rum or bourbon',
        'Pandan-infused milk (warm-steeped)',
        'Demerara syrup',
        'A pinch of salt',
      ],
      method: 'Shake very hard with ice so the texture lands silky. Double-strain over fresh ice.',
      garnish: pick(['Pandan leaf knot','Toasted coconut','Light grating of nutmeg']),
      signature: 'malaysian-local'
    }),
    kopi_negroni: () => ({
      ingredients: [
        'Gin (or bourbon)',
        'Campari',
        'Sweet vermouth',
        'Cold-brew kopi-O (barspoon)',
      ],
      method: 'Stir over ice until cold. Strain over a large cube.',
      garnish: pick(['Expressed orange peel and three coffee beans','Charred orange peel','Lemon twist']),
      signature: 'malaysian-local'
    }),

  };

  // Multi-select profile pairs (keys alphabetically sorted).
  const DUO_TEMPLATES = {
    'citrusy+herbal': 'garden_sour',
    'bitter+citrusy': 'jungle_bird',
    'citrusy+floral': 'flora_fizz_xl',
    'smoky+sweet': 'smoky_margarita',
    'bitter+herbal': 'herbal_negroni',
    'bitter+sweet': 'boulevardier_rich',
    'floral+herbal': 'garden_botanic',
    'floral+sweet': 'blossom_bramble',
    'citrusy+spicy': 'spicy_paloma',
    'citrusy+tropical': 'tropical_mojito',
    'citrusy+sweet': 'bee_knees',
    'smoky+citrusy': 'naked_famous',
    'herbal+sweet': 'whiskey_smash',
    'floral+tropical': 'flora_fizz_xl',
    'smoky+spicy': 'smoke_sour',
    'bitter+smoky': 'oaxaca_old_fashioned',
    'sweet+tropical': 'pina_colada',
    'herbal+tropical': 'mojito',
    'herbal+smoky': 'naked_famous',
    'bitter+floral': 'aviation',
    'bitter+tropical': 'jungle_bird',
    'spicy+sweet': 'dark_n_stormy',
    'spicy+tropical': 'jungle_bird',
    'spicy+herbal': 'highball_spice',
    'spicy+floral': 'flora_fizz_xl',
    'spicy+smoky': 'cili_padi_margarita',
    'spicy+bitter': 'highball_spice',
    'sweet+smoky': 'smoky_margarita',
    // Paper Plane / Trinidad Sour territory
    'bitter+nutty': 'trinidad_sour',
    // New: creamy combos
    'creamy+sweet': 'alexander',
    'citrusy+creamy': 'golden_milk_punch',
    'creamy+nutty': 'alexander',
    'bitter+creamy': 'white_russian',
    'creamy+spicy': 'golden_milk_punch',
    'creamy+tropical': 'pina_colada',
    'creamy+floral': 'alexander',
    'creamy+herbal': 'golden_milk_punch',
    'creamy+smoky': 'white_russian',
    // New: nutty combos
    'nutty+sweet': 'nutty_old_fashioned',
    'citrusy+nutty': 'orgeat_swizzle',
    'nutty+tropical': 'mai_tai',
    'bitter+nutty': 'nutty_old_fashioned',
    'nutty+smoky': 'nutty_old_fashioned',
    'herbal+nutty': 'orgeat_swizzle',
    'floral+nutty': 'orgeat_swizzle',
    'nutty+spicy': 'orgeat_swizzle',
  };

  // Template-key → /cocktails/{slug}/ URL slug.
  // When the builder routes to a template that's already on our menu, we surface
  // a small "On our menu" link so the user knows the bartender can pour it as-is.
  const MENU_SLUGS = {
    jungle_bird: 'jungle-bird',
    old_fashioned: 'old-fashioned',
    negroni_sbagliato: 'negroni-sbagliato',
    pandan_collins: 'pandan-collins',
    gula_melaka_old_fashioned: 'gula-melaka-old-fashioned',
    calamansi_highball: 'calamansi-highball',
    kopi_sour: 'kopi-sour',
    manhattan: 'manhattan',
    boulevardier: 'boulevardier',
    boulevardier_rich: 'boulevardier',
  };
  const MENU_NAMES = {
    jungle_bird: 'Jungle Bird',
    old_fashioned: 'Old Fashioned',
    negroni_sbagliato: 'Negroni Sbagliato',
    pandan_collins: 'Pandan Collins',
    gula_melaka_old_fashioned: 'Gula Melaka Old Fashioned',
    calamansi_highball: 'Calamansi Highball',
    kopi_sour: 'Kopi Sour',
    manhattan: 'Manhattan',
    boulevardier: 'Boulevardier',
    boulevardier_rich: 'Boulevardier (richer)',
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

    // Duo lookup first - if user picked two profiles, prefer the duo
    // template that captures the combo.
    if (profiles.length === 2) {
      const duoKey = profiles.join('+');
      if (DUO_TEMPLATES[duoKey]) return DUO_TEMPLATES[duoKey];
    }

    // Brunch + late-night occasion routes (new)
    if (occasion === 'brunch') {
      if (profile === 'bitter' || mood === 'comforting') return 'bloody_mary';
      if (profile === 'citrusy' || mood === 'celebratory') return Math.random() < 0.5 ? 'mimosa' : 'aperol_spritz';
      if (profile === 'sweet') return pick(['mimosa','bee_knees','hugo_spritz']);
      if (profile === 'tropical') return 'pina_colada';
      if (profile === 'creamy') return 'irish_coffee';
      if (profile === 'spicy') return 'bloody_mary';
      if (profile === 'floral') return 'st_germain_spritz';
      return pick(['mimosa','aperol_spritz','pimms_cup']);
    }
    if (occasion === 'late-night') {
      if (mood === 'awake' || profile === 'creamy') return Math.random() < 0.5 ? 'irish_coffee' : 'brandy_alexander';
      if (profile === 'sweet' || profile === 'nutty') return Math.random() < 0.5 ? 'nutty_old_fashioned' : 'vieux_carre';
      if (profile === 'bitter') return spirit === 'whiskey' ? 'manhattan' : 'hanky_panky';
      if (profile === 'smoky') return Math.random() < 0.5 ? 'oaxaca_old_fashioned' : 'mezcal_negroni';
      if (profile === 'herbal') return 'mint_julep';
      return pick(['old_fashioned','vieux_carre','hanky_panky']);
    }

    // Cosy + playful mood routes (new + expanded)
    if (mood === 'cosy') {
      if (profile === 'sweet' || profile === 'creamy') return Math.random() < 0.5 ? 'hot_toddy' : 'brandy_alexander';
      if (profile === 'citrusy') return 'hot_toddy';
      if (profile === 'nutty') return Math.random() < 0.5 ? 'nutty_old_fashioned' : 'pink_squirrel';
      if (profile === 'smoky') return 'mezcal_negroni';
      if (profile === 'herbal') return Math.random() < 0.5 ? 'whiskey_smash' : 'gin_basil_smash';
      if (profile === 'spicy') return 'hot_toddy';
      if (profile === 'floral') return 'lavender_collins';
      // fallthrough handled below
    }
    if (mood === 'playful') {
      if (profile === 'citrusy' || profile === 'sweet') return pick(['sgroppino','paper_plane','hugo_spritz']);
      if (profile === 'tropical') return pick(['pina_colada','painkiller','hurricane','doctor_funk']);
      if (profile === 'floral') return Math.random() < 0.5 ? 'bandung_spritz' : 'lavender_collins';
      if (profile === 'creamy') return Math.random() < 0.5 ? 'alexander' : 'grasshopper';
      if (profile === 'spicy') return Math.random() < 0.5 ? 'cili_padi_margarita' : 'mexican_mule';
      if (profile === 'herbal') return 'gin_basil_smash';
      // fallthrough handled below
    }

    // Creamy + nutty profile routes (expanded)
    if (profile === 'creamy') {
      if (occasion === 'nightcap') return Math.random() < 0.5 ? 'white_russian' : 'brandy_alexander';
      if (mood === 'awake') return 'irish_coffee';
      if (spirit === 'brandy') return 'brandy_alexander';
      if (spirit === 'gin') return Math.random() < 0.5 ? 'alexander' : 'grasshopper';
      if (mood === 'playful') return 'grasshopper';
      return pick(['golden_milk_punch','pandan_milk_punch','alexander']);
    }
    if (profile === 'nutty') {
      if (strength === 'strong' || occasion === 'nightcap') return Math.random() < 0.5 ? 'nutty_old_fashioned' : 'vieux_carre';
      if (mood === 'playful') return 'pink_squirrel';
      if (spirit === 'rum') return 'orgeat_swizzle';
      if (spirit === 'whiskey' && profile === 'bitter') return 'trinidad_sour';
      return Math.random() < 0.5 ? 'orgeat_swizzle' : 'pink_squirrel';
    }

    // Malaysia-local routes (priority - signature of the house)
    if (mood === 'awake' && profile === 'citrusy') return 'kopi_sour';
    if (mood === 'awake') return 'espresso_awake';
    if (mood === 'comforting' && profile === 'sweet' && (spirit === 'whiskey' || spirit === 'rum')) return 'teh_tarik_old_fashioned';
    if (profile === 'spicy' && spirit === 'tequila') return 'cili_padi_margarita';
    if (mood === 'adventurous' && profile === 'tropical' && spirit === 'rum') return 'cendol_milk_punch';
    if (profile === 'floral' && occasion === 'celebration' && (spirit === 'gin' || spirit === 'vodka')) return 'bandung_spritz';
    if (profile === 'sweet' && occasion === 'nightcap' && (spirit === 'whiskey' || spirit === 'rum')) return Math.random() < 0.5 ? 'gula_melaka_old_fashioned' : 'nasi_lemak_old_fashioned';
    if (profile === 'herbal' && strength === 'light') return 'pandan_collins';
    if (occasion === 'nightcap' && profile === 'sweet') return 'gula_melaka_old_fashioned';
    if (profile === 'citrusy' && (occasion === 'session' || occasion === 'with-food')) return 'calamansi_highball';

    // Strength routes - "strong" picks the spirit-forward classics first (expanded)
    if (strength === 'strong') {
      if (spirit === 'gin') {
        if (profile === 'herbal' || profile === 'bitter') return pick(['last_word','martini_dry','hanky_panky']);
        if (profile === 'floral') return 'aviation';
        if (profile === 'citrusy') return 'corpse_reviver_2';
        if (mood === 'adventurous') return 'vesper';
      }
      if (spirit === 'whiskey') {
        if (profile === 'sweet' || profile === 'bitter') return pick(['manhattan','old_fashioned','vieux_carre']);
        if (profile === 'herbal' || profile === 'smoky') return 'sazerac';
        if (profile === 'nutty') return 'trinidad_sour';
        return Math.random() < 0.5 ? 'old_fashioned' : 'vieux_carre';
      }
      if (spirit === 'mezcal' || spirit === 'tequila') {
        if (profile === 'smoky' || profile === 'spirit-forward') return Math.random() < 0.5 ? 'oaxaca_old_fashioned' : 'mezcal_negroni';
        if (profile === 'bitter') return Math.random() < 0.5 ? 'naked_famous' : 'mezcal_negroni';
        if (profile === 'citrusy') return 'tommy_margarita';
      }
      if (spirit === 'rum' || spirit === 'brandy') return Math.random() < 0.5 ? 'old_fashioned' : 'vieux_carre';
    }

    // Tropical short-circuit (expanded with tiki classics)
    if (profile === 'tropical') {
      if (spirit === 'rum' && (mood === 'celebratory' || mood === 'mellow')) return pick(['pina_colada','painkiller','hurricane']);
      if (spirit === 'rum' && strength === 'strong') return 'zombie';
      if (spirit === 'rum' && mood === 'adventurous') return pick(['zombie','hurricane','doctor_funk']);
      if (spirit === 'rum') return Math.random() < 0.4 ? 'mai_tai' : 'painkiller';
      if (mood === 'playful') return pick(['hurricane','painkiller','tropical_shake']);
      return 'tropical_shake';
    }
    if (mood === 'adventurous' && ['sweet','citrusy','spicy'].includes(profile)) return Math.random() < 0.5 ? 'tropical_shake' : 'paper_plane';

    // Occasion routes
    if (occasion === 'celebration') {
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'bitter') return 'negroni_sbagliato';
      if (profile === 'herbal') return 'garden_stirred';
      if (profile === 'sweet') return 'french_75';
      if (profile === 'floral') return Math.random() < 0.5 ? 'french_75' : 'aviation';
      return 'champagne_fizz';
    }
    if (occasion === 'nightcap') {
      if (profile === 'sweet') return Math.random() < 0.5 ? 'milk_punch' : 'gold_rush';
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'herbal') return Math.random() < 0.4 ? 'garden_stirred' : 'sazerac';
      if (profile === 'bitter') return spirit === 'whiskey' ? 'manhattan' : 'boulevardier';
      return 'old_fashioned';
    }
    if (occasion === 'aperitif') {
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'citrusy' && spirit === 'tequila') return Math.random() < 0.5 ? 'paloma' : 'tommy_margarita';
      if (profile === 'bitter') return pick(['boulevardier','americano','bicicletta','aperol_spritz']);
      if (profile === 'sweet') return 'bee_knees';
      if (profile === 'floral') return Math.random() < 0.5 ? 'hugo_spritz' : 'st_germain_spritz';
      if (profile === 'herbal') return 'gin_basil_smash';
      return pick(['low_abv_spritz','aperol_spritz','americano','pirlo']);
    }
    if (occasion === 'with-food') {
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'floral') return 'flora_fizz';
      if (profile === 'spicy') return 'highball_spice';
      if (profile === 'bitter') return 'boulevardier';
      return 'low_abv_spritz';
    }
    if (occasion === 'session') {
      if (profile === 'spicy') return spirit === 'vodka' ? 'moscow_mule' : (spirit === 'tequila' ? 'mexican_mule' : 'dark_n_stormy');
      if (profile === 'floral') return Math.random() < 0.5 ? 'flora_fizz' : 'hugo_spritz';
      if (profile === 'smoky') return 'smoke_sour';
      if (profile === 'herbal') return pick(['mojito','southside','gin_basil_smash','mint_julep']);
      if (profile === 'citrusy') return pick(['tom_collins','gimlet_classic','john_collins','tommy_margarita']);
      if (profile === 'sweet') return 'bramble';
      return pick(['low_abv_spritz','pimms_cup','americano']);
    }

    // Anytime / mood-spirit-profile fallthrough
    if (profile === 'herbal' && (mood === 'mellow' || mood === 'comforting')) return Math.random() < 0.5 ? 'whiskey_smash' : 'southside';
    if (profile === 'citrusy' && (spirit === 'gin' || spirit === 'vodka')) return Math.random() < 0.5 ? 'gimlet_classic' : 'tom_collins';
    if (profile === 'tropical' && spirit === 'rum') return 'mai_tai';
    if (spirit === 'tequila' && profile === 'citrusy') return 'paloma';
    if (spirit === 'gin' && profile === 'sweet') return Math.random() < 0.5 ? 'bee_knees' : 'clover_club';
    if (spirit === 'whiskey' && profile === 'sweet') return 'gold_rush';
    if (profile === 'sweet' && mood === 'celebratory') return 'french_75';
    if (profile === 'spicy' && spirit === 'vodka') return 'moscow_mule';
    if (profile === 'spicy' && spirit === 'rum') return 'dark_n_stormy';

    const byProfile = {
      citrusy: 'sour', sweet: 'sour', bitter: 'bitter_stirred',
      herbal: 'garden_stirred', smoky: 'smoke_sour', floral: 'flora_fizz',
      spicy: 'highball_spice', tropical: 'tropical_shake',
    };
    return byProfile[profile] || 'sour';
  }

  /* ----- Name generator ----- */

  const MOOD_WORDS = {
    refreshed: ['Bright','Clear','First','Bluebell','Daybreak','Crystal','Morning','Fresh-Cut','Lifted','Pivot','Mineral','Linen','Plein-Air','Vesper','Reset','Snowmelt','Mountain','Spring','Cold-Brew','Window-Open','Tonic','Glacier','Quartz','Cool','Spritz-Hour','Clear-Cut','Clean-Slate','Brisk','Tidewater','Cucumber','Wellspring','Trail-Head','Snowdrop','Outdoor','Sunlit'],
    adventurous: ['Wild','Untamed','Roaming','Lost','Trespass','Outlaw','Drift','Compass','Frontier','Wayward','Vagrant','Driftwood','Ramble','Switchback','Northbound','Smoke-Stack','Border','Highland','Brave','Off-Map','Rover','Voyager','Storyboard','Field-Notes','Caravan','Mapped','Detour','Lost-Highway','Migrant','Equator','Open-Road','Crosswind','Sundown','Marauder','Plot-Twist'],
    comforting: ['Slow','Hearth','Lantern','Late','Velvet','Quilt','Tender','Warm','Settle','Easy','Cardigan','Library','Fireside','Kindred','Domestic','Pillow','Slipper','Bookend','Embers','Long-Bath','Cocoa','Cashmere','Sweater','Stovetop','Soup-Pot','Mother-Tongue','Drowsy','Soft-Wool','Mantle','Threadbare','Stoneware','Warm-Cradle','Bath-House','Old-Letter','Lamplight'],
    celebratory: ['Gilded','High','Festival','Crystal','Confetti','Toast','Encore','Spotlight','Champagne','Holiday','Marquee','Garland','Threshold','Standing-Ovation','Carousel','Curtain-Call','Sequin','Velvet-Rope','Premiere','Fete','Gala','Headline','Banquet','Beacon','Crown','Centrefold','Crescendo','Top-Tier','Brassy','Headlights','Magnum','Stage','Limelight','Royal','Triumphal'],
    mellow: ['Soft','Idle','Hush','Dusk','Lullaby','Drowse','Slow','Coast','Linger','Glide','Tide','Whisper','Sunday','Easy','Slope','Slow-Lane','Sailing','Hammock','Drift','Quiet','Veiled','Lazy-Day','Long-Note','Loose','Open-Window','Park-Bench','Mellow','Side-Eye','Slow-Tide','Dampened','Footnote','Long-Light','Honey-Hour','Loose-Thread'],
    awake: ['Awake','Espresso','Daybreak','Sharp','Caffeinated','Sunrise','Alert','Bright-Eyed','Reset','Pulse','First-Train','Newsroom','Wide-Open','Sharp-Eyed','Filament','Wired','Cold-Plunge','Static','Adrenaline','Quartz','Snap','Wakeup','Notice','Volt','Surge','Switch-On','Currents','Static-Cling','Live-Wire','Polished','Galvanic','Caffeine','First-Light','Sharp-Edge','Catalyst'],
    cosy: ['Cosy','Snug','Fireplace','Wool','Mug','Warm-Socks','Knit','Flannel','Soft-Light','Steamed','Pajama','Cocoa-Hour','Brown-Sugar','Toaster','Bundle','Quilted','Hearth','Pocketed','Indoor-Day','Window-Seat','Tea-Hour','Crumpet','Cardigan-Day','Slow-Sunday','Reading-Lamp','Patchwork','Warm-Loaf','Stockpot','Heat-Lamp','Slipperhood','Hot-Steam','Plaid','Stillroom','Side-Lamp','Wool-Sweater'],
    playful: ['Playful','Confetti','Pop','Carousel','Tinsel','Mischief','Wink','Tickle','Sherbet','Whim','Doodle','Loose-Tooth','Skipped','Twirl','Sparkler','Pinball','Pinwheel','Trampoline','Bubble','Hopscotch','Sprinkles','Glitter','Funhouse','Catwalk','Disco','Pop-Up','Doodle-Hour','Marshmallow','Carnival','Whirligig','Cartwheel','Bubblegum','Polka','Skipping','Spangle'],
  };

  const PROFILE_NOUNS = {
    citrusy: ['Citrus','Lemon Tide','Yellow Hour','Daydream','Reset','Sunburst','Zest','Acid Test','Daylight','Sour Note','Tangerine','Lima','Verbena','Quarrel','Hour','Highball','Sherbet','Pith','Marmalade','Calamansi','Yuzu','Acid Cup','Limewash','Sodium','Brightside','Squeeze','Citroen','Bergamot','Yellow Card','Pithwork','Limelight','Daysplit','Open Window','Glass-Box','Lemonade'],
    sweet: ['Honey','Sugar Coast','Sweet Talk','Caramel','Easy','Confection','Patisserie','Vanilla','Praline','Drift','Treacle','Marzipan','Custard','Sweetbrier','Plush','Toffee','Brown Sugar','Maraschino','Bonbon','Mille-Feuille','Eclair','Honeycomb','Demerara','Caramelo','Cotton Cloud','Pillow','Brown Butter','Glace','Frosting','Cardamom Bun','Bakery','Lullaby','Half-Cake','Spoonful'],
    bitter: ['Counsel','Aperitivo','Red Quarter','Negroni','Stitch','Argument','Verdict','Carmine','Bitter Half','Crimson','Apothecary','Cinder','Stricture','Italics','Rouge','Edge','Margin','Sandpaper','Halfshell','Cynara','Wormwood','Quinine','Coffee Hour','Walnut','Burnt Caramel','Black Tea','Eraser','Saltpetre','Hard Note','Footnote','Olive Hour','Bittermost','Citrine','Hellebore'],
    herbal: ['Garden','Field','Greenhouse','Thicket','Botanic','Hedgerow','Apothecary','Underbrush','Meadow','Cordial','Herbarium','Allotment','Forager','Sprig','Tincture','Field Notes','Allium','Wild Thyme','Pasture','Marigold','Verbena','Chervil','Briar','Tussock','Wormwood','Hothouse','Glasshouse','Window-Box','Sapling','Plot','Veranda Pot','Coriander','Lemongrass','Greenroom'],
    smoky: ['Ember','Smoke Walker','Wildfire','Cinder','Forge','Ash Hour','Foundry','Bonfire','Brushfire','Furnace','Soot','Iron','Pit','Phoenix','Charcoal','Tinder','Wood-Smoke','Cast-Iron','Bone-Fire','Salt-Smoke','Backdraft','Charrette','Burned Honey','Filament','Kerosene','Brushwood','Hayfire','Mesquite','Magnesium','Brimstone','Banked Coal','Slow Burn','Black Wax','Outpost'],
    floral: ['Bloom','Petal','Rosebed','Garland','Greenhouse','Orchid','Bouquet','Hothouse','Florist','Festival','Peony','Camellia','Veranda','Sonnet','Posy','Buttercup','Jasmine','Peonyfield','Hibiscus','Orchidhouse','Lily-of-Valley','Magnolia','Dahlia','Anemone','Hydrangea','Lupin','Sweetpea','Wallflower','Snowdrop','Cottage Garden','Gardenia','Iris Hour','Pansy','Floraform'],
    spicy: ['Pepper','Storm','Mule','Ginger Walk','Heatwave','Spark','Friction','Brushfire','Chase','Wick','Cayenne','Catapult','Tide','Match','Coal','Five-Spice','Sambal','Heatwave','Chili-Stripe','Crackle','Smoke-Stack','Pepperhouse','Backfire','Cardamom','Capsaicin','Bird\'s-Eye','Match-Head','Pop','Hot-Wire','Wildfire','Hot-Day','Stinger','Cili Padi','Live-Wire'],
    tropical: ['Coconut','Trade Wind','Equator','Lagoon','Hibiscus','Calypso','Mango','Vacation','Atoll','Reef','Banyan','Verandah','Pineapple','Monsoon','Frangipani','Polynesia','Wayanad','Bougainvillea','Palm Shade','Saltwater','Tiki','Long Sail','Coral','Mangrove','Hammock','Sandcastle','Bird-of-Paradise','Lychee','Soursop','Bali Hour','Boat-Day','Reef-Walk','Outrigger','Coconut Grove','Open Sea'],
    creamy: ['Velvet','Pillow','Cream Hour','Silk','Cashmere','Butterhouse','Custard','Cradle','Soft-Pour','Crème','Tres-Leches','Mascarpone','Crema','Eider','Powder Room','White Bear','Plush','Whipped','Spoonful','Hush-Pillow','Snowdrop','Marshmallow Hour','Soft-Suede','Bone-China','Pale-Linen','Quiet Cream','Vanilla Fog','Talcum','Buttermilk','Soft-Foam','Heavy Pour','Hush','Cloud-Bed','Soufflé','Whip'],
    nutty: ['Almond','Hazel','Walnut Hour','Praline','Marzipan','Pecan','Frangipane','Brown Butter','Toasted','Nut House','Pistachio','Nougat','Burnt-Almond','Roastery','Macaroon','Marcona','Confiserie','Acorn','Brazil-Nut','Chestnut','Hazelnut Hour','Almond Tree','Pine-Nut','Cashew','Coconut-Husk','Toasted Grain','Brown-Crust','Sesame','Nut-Brittle','Praline Hour','Filbert','Caramel-Nut','Roasted-Skin','Almond Milk','Toffee-Nut'],
  };

  const OCCASION_FLAVOUR = {
    aperitif: ['Aperture','Prelude','First Round','Opening','Prologue'],
    'with-food': ['Pairing','Course','Side Note','Companion','Plate-Mate'],
    nightcap: ['Nightcap','Last Round','Closing','Lullaby','Lights Down'],
    celebration: ['Toast','Confetti','Spotlight','Encore','Standing'],
    session: ['Long Pour','Saturday','Open Tab','Marathon','Slow Lane'],
    anytime: [],
    brunch: ['Brunch','Sunday','Late Morning','Eggs Bench','Yolk Hour'],
    'late-night': ['Late Set','After Hours','Final Round','Last Train','Closing Time'],
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
      // Classics
      manhattan: `Rye, sweet vermouth, bitters. Stirred long, served very cold.`,
      sazerac: `Rye, sugar, peychaud, absinthe rinse. New Orleans, old room.`,
      last_word: `Equal parts gin, chartreuse, maraschino, lime. Soft on the tongue, big on the finish.`,
      vesper: `Gin, vodka, lillet. Big and cold. Built for one slow round.`,
      aviation: `Gin, maraschino, violette, lemon. Floral and dry.`,
      corpse_reviver_2: `Gin, cointreau, lillet, lemon, absinthe rinse. Lifts almost anything.`,
      boulevardier: `Bourbon, campari, sweet vermouth. The whiskey negroni.`,
      // Long + session
      mojito: `Rum, mint, lime, sugar, soda. Cold and easy.`,
      tom_collins: `Gin, lemon, sugar, soda. A clean classic. Built tall.`,
      moscow_mule: `Vodka, ginger beer, lime. In copper if we have it.`,
      dark_n_stormy: `Dark rum floated over ginger beer and lime.`,
      southside: `Gin, mint, lime, sugar. Mojito's stricter cousin.`,
      // Sweet + brunch + dessert
      bee_knees: `Gin, honey, lemon. The prettiest sour.`,
      gold_rush: `Bourbon, honey, lemon. A whiskey sour in a winter coat.`,
      bramble: `Gin sour with a blackberry drizzle. Looks like a postcard.`,
      clover_club: `Gin, lemon, raspberry, egg white. A pink head and a clean lift.`,
      french_75: `Gin, lemon, sugar, top with champagne. Made for a toast.`,
      pina_colada: `Aged rum, pineapple, coconut. Blended, unhurried.`,
      // Smoky + agave
      naked_famous: `Mezcal, chartreuse, aperol, lime. Equal parts. Endlessly drinkable.`,
      oaxaca_old_fashioned: `Reposado and mezcal stirred on agave. Smoke under the sweetness.`,
      // Malaysian
      teh_tarik_old_fashioned: `Bourbon stirred on milk-tea reduction. A KL nightcap.`,
      cili_padi_margarita: `Tequila, lime, agave, a kick of cili padi. Hot and bright.`,
      cendol_milk_punch: `Rum, coconut, pandan, gula melaka. Cendol in a glass.`,
      bandung_spritz: `Rose, milk, prosecco. Bandung with a Sunday afternoon dressed up.`,
      nasi_lemak_old_fashioned: `Bourbon on pandan-coconut sugar with a pinch of salt. A nod, not a parody.`,
      // Duos
      spicy_paloma: `Tequila, grapefruit, lime, cili padi. Tropical with a punch.`,
      tropical_mojito: `Rum, pineapple, mint, lime. Mojito on holiday.`,
      herbal_negroni: `Gin or bourbon, campari, cynar, vermouth. Bitter and herbal in the same sip.`,
      boulevardier_rich: `Bourbon, campari, sweet vermouth, a touch of maple. Deeper boulevardier.`,
      garden_botanic: `Gin, elderflower, lemon, garden syrup, tonic top. Floral and green at once.`,
      blossom_bramble: `Gin, lemon, rose, blackberry drizzle. Rose-coloured everything.`,
      // New: creamy + nutty
      alexander: `A short, silky cream cocktail. Drink it cold, drink it slowly.`,
      white_russian: `Vodka, coffee liqueur, cream on top. Easy and indulgent.`,
      golden_milk_punch: `Turmeric, coconut, palm sugar, rum. Warming without being hot.`,
      orgeat_swizzle: `Almond syrup, lime, spirit. Swizzled long over crushed ice.`,
      nutty_old_fashioned: `Whisky stirred on a nut-led syrup. Toasted, deep, slow.`,
      // New: brunch + late-night
      mimosa: `Citrus and sparkling. Best made with good juice, not a carton.`,
      bloody_mary: `Tomato, spice, vodka. Built for the morning after.`,
      hot_toddy: `Whisky, lemon, honey, hot water. For the room that needs warming.`,
      irish_coffee: `Whiskey, coffee, sugar, cream float. The original after-dinner pick-me-up.`,
      sgroppino: `Sorbet, vodka, prosecco. A drink-dessert hybrid. Disappears fast.`,
      // Mega-expansion
      vieux_carre: `Rye, cognac, vermouth, bénédictine, two bitters. A New Orleans nightcap.`,
      paper_plane: `Bourbon, amaro, aperol, lemon. Equal parts. A modern classic.`,
      trinidad_sour: `45ml of angostura as the base. Yes. Built to surprise.`,
      hanky_panky: `Gin, vermouth, a touch of fernet. Spirit-forward and bitter.`,
      aperol_spritz: `Aperol, prosecco, soda. Easy in any weather.`,
      americano: `Campari, sweet vermouth, soda. Low-ABV, conversation-friendly.`,
      bicicletta: `Campari, white wine, soda. Italian afternoon shape.`,
      pimms_cup: `Pimm's with lemonade and a salad's worth of garnish.`,
      painkiller: `Dark rum, pineapple, orange, coconut cream. Tiki, BVI style.`,
      zombie: `Three rums and tropical fruit. Treat with respect.`,
      hurricane: `Two rums, passion fruit, lime. New Orleans tiki.`,
      doctor_funk: `Dark rum, lime, grenadine, absinthe rinse, soda. Tiki original.`,
      brandy_alexander: `Brandy, dark cacao, cream. A short silky dessert drink.`,
      grasshopper: `Mint and chocolate cream. Vintage, polarising, fun.`,
      pink_squirrel: `Almond and chocolate cream. Forgotten and worth bringing back.`,
      gin_basil_smash: `Gin, basil, lemon. Modern German classic, brisk and green.`,
      lavender_collins: `Gin, lavender, lemon, soda. Floral and easy.`,
      elderflower_gimlet: `Gin or vodka, elderflower, lime. A softer Gimlet.`,
      tommy_margarita: `Tequila, lime, agave. The clean Margarita.`,
      mexican_mule: `Tequila, lime, ginger beer. Spicy long drink.`,
      mezcal_negroni: `Negroni with smoke. The kind of thing you order at our bar by accident and remember for years.`,
      mint_julep: `Bourbon, mint, sugar, crushed ice. The Kentucky classic.`,
      john_collins: `Bourbon Tom Collins. Long, simple, sessionable.`,
      whiskey_sour_classic: `Bourbon, lemon, sugar, egg white. Three angostura dots on the foam.`,
      hugo_spritz: `Elderflower, prosecco, mint. The Italian alpine spritz.`,
      st_germain_spritz: `St-Germain, prosecco, soda. Floral, light, photogenic.`,
      pirlo: `Aperol, white wine, soda. Lighter than the Spritz.`,
      asam_boi_sour: `Asam boi syrup, spirit, lime, egg white. Malaysian preserved-plum sour.`,
      calamansi_mojito: `White rum, calamansi, mint, palm sugar. Mojito with a Malaysian citrus accent.`,
      bunga_kantan_gimlet: `Gin, torch ginger flower, lime cordial. Local botanical gimlet.`,
      sambal_margarita: `Tequila, lime, sambal-belacan twist. Polarising but excellent.`,
      pandan_milk_punch: `Pandan-infused milk, rum, demerara. Silky tropical milk punch.`,
      kopi_negroni: `Gin or bourbon, Campari, vermouth, a barspoon of cold-brewed kopi-O. The local Negroni twist.`,
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
    const profileChain = ['citrusy','sweet','bitter','herbal','smoky','floral','spicy','tropical','creamy','nutty'];
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
      `*DRINK BUILDER · RESERVATION*`,
      ``,
      `Hi ${BAR_NAMES[bar]}! I used the drink builder and I'd like to book a table to have this made for me.`,
      ``,
      `*Drink: ${plainName}*`,
      ``,
      `Ingredients (no quantities, you decide the pour):`,
      ...recipe.ingredients.map(i => `* ${i}`),
      ``,
      `Method: ${recipe.method}`,
      `Garnish: ${recipe.garnish}`,
      ``,
      `(Mood: ${fmtAnswer(ans.mood)} · profile: ${fmtAnswer(ans.profile)} · strength: ${ans.strength} · occasion: ${ans.occasion})`,
      ``,
      `Glass is your call. Substitute anything you don't have. Looking forward to it!`,
      ``,
      `Please let me know how shall i proceed for a reservation`,
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
        // Multi-select groups have a `.continue-count` span and use the "1 of 2" hint.
        // Single-select groups just show the static label (Continue → / See your drink →).
        const countEl = cont.querySelector('.continue-count');
        if (countEl) countEl.textContent = `${arr.length} of 2`;
      }
    }

    function prettyValue(v) {
      if (!v) return '…';
      if (Array.isArray(v)) {
        if (!v.length) return '…';
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
        slot.classList.toggle('is-filled', text !== '…');
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
      } else {
        // Single-select: store as a string, but treat the array form
        // ['val'] for the Continue gating logic so all groups behave the
        // same way (show Continue when something is chosen, click to advance).
        state.answers[key] = val;
      }
      syncChipsForKey(key);
      pulseChip(chipEl);
      updateContinueButton(key);
      updateProgressStrip();
      // No more auto-advance: every group now requires the Continue
      // button click to move to the next step (user request - prevents
      // accidental advance, makes the flow consistent).
    }

    // Continue button handler - works for both single-select and
    // multi-select groups. Gated on at least one selection.
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

      // Menu cross-reference - if this template is already in our menu,
      // surface a small link so the user knows they can just order it.
      const existingMenu = root.querySelector('.result-menu-match');
      if (existingMenu) existingMenu.remove();
      const slug = MENU_SLUGS[recipe.templateKey];
      if (slug) {
        const menuLink = document.createElement('a');
        menuLink.className = 'result-menu-match';
        menuLink.href = '/cocktails/' + slug + '/';
        menuLink.innerHTML = '<span class="menu-eyebrow">On our menu</span> '
          + '<span class="menu-name">' + MENU_NAMES[recipe.templateKey] + '</span> '
          + '<span class="menu-arrow">→</span>';
        // Insert after the result-tag if present, else after the name
        const anchor = root.querySelector('.result-tag') || $('.result-name');
        anchor.insertAdjacentElement('afterend', menuLink);
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
          // Enter on any focused chip advances if at least one chip is
          // selected (used to only work in multi-select; now consistent
          // with the Continue-everywhere model).
          if (ev.key === 'Enter') {
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
