# #15 search coverage

Searched on 2026-10-10 in the owner's Chrome (Claude in Chrome extension), reading result pages only. No sign-in, messages, bids or purchases; no bot check was solved. Each result title was matched against the catalog by art number, then by name, and by the eBay item numbers the catalog already cites. Anything unmatched was read by hand, and the listing page was opened where the title was not enough.

## Sites searched

| Site | Searches | Notes |
|---|---|---|
| picclick.de | about 30: schiebepuzzle, Pussy and "original Pussy", slide puzzle, Geduldspiel, Folienpuzzle, twisty, Collector's Edition, and 20 artist/title terms | Found the "Twisty Puzzle Sliding 2D" series (10 new works) |
| picclick.com | 14: Pussycat and Pussy slide puzzle, twisty, art, tile, plus Escher, Kandinsky, Klee, Dalí, Miró, Disney, Collector's Edition | `page=2` and `page=3` returned nothing beyond page 1, so depth past page 1 is not confirmed |
| picclick.co.uk | 8 | Nothing new |
| picclick.es | 9 | Found Miró *Die Zeitung (Le Journal)* |
| picclick.fr | 9 | Found the Pussy *Egypt* puzzle |
| picclick.it | 8, plus 7 listing pages read | Found Van Gogh *Cafeterrasse bei Nacht* and the clothespin slider |
| ebay.de | 2 | Same stock as picclick.de |
| ebay.es | 1 | First address gave an eBay "Error Page"; the homepage-then-search route worked |
| ebay.co.uk | 1 | Found *Pig* |
| ebay.fr | 1 | Found *Joker Poker* |
| ebay.it | 1 | Nothing new |
| ebay.nl | 2 | First load gave an "Error Page", then worked. Only Escher cube puzzles and music |
| ebay.com | 1 (240 per page) | Nothing new |

## Added (16), see `check-new.mjs` and `output.txt`

The first pass gave 17 from the listing titles. Reading the back photos corrected that: one of the 17 was already in the catalog, and several titles and numbers changed. The names and art numbers below are the ones printed on the backs.

Single "Twisty Puzzle Sliding 2D" puzzles from one seller, each with a back photo: Kandinsky *Trente (Dreissig)* 1937 (80 2345), Macke *Indianer* 1911 (80 2932), Macke *Staudacherhaus in Tegernsee* 1910 (80 2931), Klimt *Die Jungfrau* 1913 (80 23194), Klimt *Die drei Lebensalter der Frau* 1905 (80 23191), Monet *Au bord de l'eau, Bennecourt* 1868 (80 23211), Monet *Le déjeuner (panneau décoratif)* 1873 (80 23212), Monet *Jerusalem Artichoke Flowers* 1880 (80 23214), Marc *Die roten Pferde* 1911 (80 29 123), Marc *Das kleine blaue Pferdchen* 1912 (80 29 125).

Others: Van Gogh *Cafeterrasse bei Nacht* (1888, front only), Miró *Die Zeitung (Le journal)* 1972 (80 2994), Pussy *Tut-anch-Amun* (80 2955), Pussy *Pig* (plain back), Pussy *Joker* (80 2925), and a Pussycat *clothespin slider* (front only).

### What the backs changed
- **Miró "1953" was already in the catalog.** The back reads *Die Leitern durchziehen als Feuerrad das Himmelsblau*, Art. No. **80 2991**. That is `miro-80-2991`, which had no title. It now has the title, the art number confirmed, and these photos; the extra entry was removed.
- **The Monet "Le Déjeuner sur l'herbe" listing title was wrong.** The back reads *Das Mittagsmahl / Le déjeuner; panneau décoratif*, 1873, Musée d'Orsay (80 23212). The entry id and name changed to match.
- **Art number 80 2931 now sits on three entries.** The Macke *Staudacherhaus* back prints 80 2931, and the catalog's two Crossword entries also carry it from their listings. Each of the three says so in its description; the Crossword listings probably misread it.
- Art numbers fall in two runs: 80 23191 to 80 23214 (the Klimt and Monet) next to the catalog's 80 23215 and 80 23244, and 80 2925 to 80 2994.

## Possible duplicates, left for the owner to decide (not added)

| Listing | May be | Why uncertain |
|---|---|---|
| Marc *The Blue Fox, 1911* (317774074539) | `marc-blauschwarzer-fuchs` | Same painting under another title; the catalog entry may be a different size |
| "Original Pussy Schiebepuzzle mit Apfelmotiv" (278325166039) | `lufthansa-apfel` | Both are apple designs; no photo compared |
| Pussy "Dici puzzle matematica" 1970s, 26–99 pieces (177885051630) | `dice` | The catalog `dice` entry has no description to compare |
| Pussy "Brain Teaser con caja" (287527544304) | unknown | Title only; plastic puzzle in a box |
| Escher 1963 / E118 and "Birds" copies, Paradise 80 2938, People Puzzle 80 29 43, and about 90 other repeat listings | existing entries | Matched by art number or name; the catalog already records the duplicate numbers where they differ |
| The same works from the "Twisty" series that also exist as 7×7 or 7×9 puzzles (Kandinsky *Quadrate mit konzentrischen Ringen* 1913, Cézanne *Les Joueurs de cartes* 1890, Renoir *La Colazione dei Canottieri* 1881, Miró *Pygmées sous la lune* 1974, Dalí *Nature morte vivante* 1956, Mickey Mouse) | `kandinsky-80-2341`, `cezanne-card-players`, `renoir-boating-party`, `miro-pygmies-under-the-moon`, `dali-living-still-life`, `micky-maus` | Their backs print an art number, which would show whether they are the same puzzles; the listings give no size or number |

## Left out, with the reason

| Listing | Reason |
|---|---|
| Pussy *Geduldspiele* pocket sets, Legespiel *Fisch* 10 2204, Steckspiel *Triangel*, *Kanone* (metal balls), *Logic* 2502/2504, marble patience puzzle, "Geduldspiel 13 Astro / 14 Tangle" | Patience games, not sliding puzzles. Out of scope (`docs/requirements.md` §2) |
| Escher *Block* cube puzzle (80 5050), Escher finger puzzle *Concave & Convex* | Made by Pussycat, but cube and finger puzzles, not sliders. Out of scope |
| Robot, box and other 1960s keychain puzzles; rope puzzle (257744886796) | Not enough information to call them sliders; out of scope until a listing says so |
| *Rebus* Mondo Puzzle (1987), pyramid puzzle, other brands | Not Pussycat |
| Josie and the Pussycats, Pussycat Dolls, Faster Pussycat and other music, film and magazine results | Not puzzles |
| "Set of 6 / Lot of 2 / Lot of 5 Pussycat Puzzles", "pussycat slide puzzles" | Lots and generic titles; they name no distinct puzzle |
