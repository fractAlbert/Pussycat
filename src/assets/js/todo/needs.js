/**
 * Works out what stands between each puzzle and being playable, and what else
 * the catalog is missing. Pure functions over Puzzle instances, so the page
 * stays current with puzzles.json and needs no list of its own to maintain.
 *
 * Play needs three things (Puzzle.isPlayable): the clean art, a grid, and a
 * blank type. Art can only be public domain if the artist died more than 70
 * years ago and the work was published before 1931 (docs/data-model.md), so
 * most of the "needs art" question is really a question about the artist.
 */

/** Artists whose work can be public domain. The work's own date still decides. */
export const PUBLIC_DOMAIN_ARTISTS = new Set([
  'Paul Cézanne',
  'Claude Monet',
  'Pierre-Auguste Renoir',
  'Vincent van Gogh',
  'Gustav Klimt',
  'August Macke',
  'Franz Marc',
  'Wassily Kandinsky',
  'Paul Klee',
  'Paul Gauguin',
  'Henri de Toulouse-Lautrec',
]);

/** Works by those artists that are too recent to use, and why. */
export const HELD_BACK = {
  'klee-80-23155': 'The puzzle carries a 1940 inscription, after the 1931 cut-off.',
  'klee-uebermut': 'The artwork is from 1939, after the 1931 cut-off.',
  'kandinsky-trente': 'The artwork is from 1937, after the 1931 cut-off.',
};

/** What is known to be in the way for a particular entry. */
export const NOTES = {
  'kandinsky-weiches-hart': 'No public-domain scan of 800 px or more has been found yet.',
  'van-gogh-selbstportraet': 'Which of his self-portraits it shows is not known.',
  'klee-80-23151': 'Its title is not known, so the date cannot be checked.',
};

const isSet = (p) => p.series === "Collector's Edition";
const byArtistThenName = (a, b) => a.artistLabel.localeCompare(b.artistLabel) || a.name.localeCompare(b.name);

/** A puzzle whose back or listing says it shows a detail needs the same crop. */
const showsADetail = (p) => /\((Detail|Ausschnitt)\)/i.test(p.description);

function row(puzzle, notes, link = null) {
  return { puzzle, notes: notes.filter(Boolean), link };
}

/**
 * The lists the To do page shows. Sets (Collector's Edition) are left out of
 * the art and grid lists: each is a box of several small puzzles whose
 * individual designs are not named, so it has no single picture or grid.
 */
export function sortOut(puzzles) {
  const playable = puzzles.filter((p) => p.isPlayable);
  const photoNote = (p) =>
    p.hasImages ? 'There is a photo to count from.' : 'No photo of the puzzle, so it needs a count from the puzzle in hand.';

  const needsCount = puzzles
    .filter((p) => p.art && !p.isPlayable)
    .sort(byArtistThenName)
    .map((p) => row(p, [
      [!p.grid && 'grid', !p.blank && 'layout'].filter(Boolean).join(' and ') + ' missing.',
      photoNote(p),
    ]));

  const needsArt = puzzles
    .filter((p) => !p.art && PUBLIC_DOMAIN_ARTISTS.has(p.artist) && !isSet(p) && !(p.id in HELD_BACK))
    .sort(byArtistThenName)
    .map((p) => row(p, [
      p.hasImages ? 'Has a photo: the grid can be counted from it once there is art.' : 'No photo of the puzzle.',
      showsADetail(p) && 'The puzzle shows a detail of the painting, so the art needs the same crop.',
      NOTES[p.id],
    ]));

  const heldBack = puzzles
    .filter((p) => !p.art && p.id in HELD_BACK)
    .sort(byArtistThenName)
    .map((p) => row(p, [HELD_BACK[p.id]]));

  const needsPhoto = puzzles
    .filter((p) => !p.hasImages)
    .sort(byArtistThenName)
    .map((p) => row(p, [p.source ? 'Photo to save from its listing.' : 'No listing recorded to take a photo from.'], p.source));

  const needsGrid = puzzles
    .filter((p) => !isSet(p) && (!p.grid || !p.blank))
    .sort(byArtistThenName)
    .map((p) => row(p, [
      !p.grid ? 'No grid.' : `Grid ${p.sizeLabel}, layout (extra space or inline) not recorded.`,
      p.art && 'Has art: this is all it needs to be playable.',
    ]));

  return { playable, needsCount, needsArt, heldBack, needsPhoto, needsGrid };
}
