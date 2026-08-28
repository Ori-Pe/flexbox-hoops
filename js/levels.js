export const LEVELS = [
  {
    id: 'baseline-drive',
    title: 'Baseline Drive',
    goal: 'One ball, one basket on the right edge of the court. Send the ball there.',
    hint: 'justify-content moves items along the main axis: flex-start, flex-end, center, space-between, space-around.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'flex-end' } },
  },
  {
    id: 'top-of-the-key',
    title: 'Top of the Key',
    goal: 'The basket sits dead center on the main axis. Send the ball there.',
    hint: 'Try justify-content: center;',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'center' } },
  },
  {
    id: 'spread-the-floor',
    title: 'Spread the Floor',
    goal: 'Three balls, three baskets — one at each edge and one in the middle. Space them out.',
    hint: 'space-between pushes the first and last item to the edges and divides the remaining space evenly between the rest.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'space-between' } },
  },
  {
    id: 'even-spacing',
    title: 'Even Spacing',
    goal: 'Same three baskets, but now each one needs equal space on both sides of it.',
    hint: 'space-around gives every item half a unit of space at the ends, a full unit between items.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'space-around' } },
  },
  {
    id: 'low-post',
    title: 'Low Post',
    goal: 'The basket dropped to the floor. Follow it down the cross axis.',
    hint: 'align-items works on the cross axis. flex-end sends items to the bottom of a row.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { alignItems: 'flex-end' } },
  },
  {
    id: 'center-court',
    title: 'Center Court',
    goal: 'Both axes this time — the basket hangs at the exact middle of the court.',
    hint: 'You need two declarations: one for the main axis, one for the cross axis.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'center', alignItems: 'center' } },
  },
  {
    id: 'fast-break-back',
    title: 'Fast Break Back',
    goal: 'The colored rings show which ball belongs in which basket — the order is reversed.',
    hint: 'flex-direction: row-reverse flips the main axis, so items lay out right to left.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'row-reverse' } },
  },
  {
    id: 'stack-the-rack',
    title: 'Stack the Rack',
    goal: 'The baskets are stacked vertically now.',
    hint: 'flex-direction: column makes the main axis vertical.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'column' } },
  },
  {
    id: 'bottom-up',
    title: 'Bottom Up',
    goal: 'Stacked, reversed, and pushed to the bottom of the court.',
    hint: 'Combine column-reverse with a justify-content value. With column-reverse the main axis starts at the bottom.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'column-reverse', justifyContent: 'flex-end' } },
  },
  {
    id: 'sub-him-out',
    title: 'Sub Him Out',
    goal: 'Only the first ball is out of place — it belongs last. Change that one ball, not the court.',
    hint: 'order defaults to 0 for every item. A higher order moves an item later.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'item', index: 0 }],
    solution: { items: { 0: { order: 1 } } },
  },
  {
    id: 'one-man-down-low',
    title: 'One Man Down Low',
    goal: 'The court aligns every ball to the top. The second ball needs the bottom basket.',
    hint: 'align-self overrides align-items for a single item.',
    ballCount: 3,
    base: { alignItems: 'flex-start' },
    editableTargets: [{ kind: 'item', index: 1 }],
    solution: { items: { 1: { alignSelf: 'flex-end' } } },
  },
  {
    id: 'full-roster',
    title: 'Full Roster',
    goal: 'Eight balls, two rows of baskets. They will not fit on one line.',
    hint: 'flex-wrap: wrap lets items break onto new lines instead of overflowing.',
    ballCount: 8,
    base: { gap: '20px', alignContent: 'space-between' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexWrap: 'wrap' } },
  },
];

export function validateLevels(levels) {
  const errors = [];
  if (levels.length < 6) {
    errors.push(`expected at least 6 levels, got ${levels.length}`);
  }

  const seenIds = new Set();
  const propertiesUsed = new Set();
  const solutionSignatures = new Set();
  let combinedCount = 0;

  levels.forEach((level, index) => {
    const label = `level ${index} (${level.id ?? 'unknown id'})`;

    for (const field of ['id', 'title', 'goal', 'ballCount', 'editableTargets', 'solution']) {
      if (level[field] === undefined) {
        errors.push(`${label}: missing required field "${field}"`);
      }
    }

    if (level.id) {
      if (seenIds.has(level.id)) errors.push(`${label}: duplicate id`);
      seenIds.add(level.id);
    }

    const allProps = [...Object.keys(level.base || {})];
    if (level.solution?.container) {
      allProps.push(...Object.keys(level.solution.container));
    }
    if (level.solution?.items) {
      for (const [itemIndex, decl] of Object.entries(level.solution.items)) {
        if (Number(itemIndex) >= level.ballCount) {
          errors.push(`${label}: solution references item index ${itemIndex} but ballCount is ${level.ballCount}`);
        }
        allProps.push(...Object.keys(decl));
      }
    }
    allProps.forEach((p) => propertiesUsed.add(p));
    if (allProps.length > 1) combinedCount += 1;

    const signature = JSON.stringify(level.solution);
    if (solutionSignatures.has(signature)) {
      errors.push(`${label}: solution identical to another level`);
    }
    solutionSignatures.add(signature);
  });

  for (const required of ['flexDirection', 'justifyContent', 'alignItems', 'flexWrap']) {
    if (!propertiesUsed.has(required)) {
      errors.push(`no level uses required property "${required}"`);
    }
  }

  if (combinedCount < 3) {
    errors.push(`expected at least 3 levels combining more than one property, found ${combinedCount}`);
  }

  return errors;
}
