//
//
//

const abs = Math.abs;


function prepareLevel(level) {
  let lines = level.split(/\r?\n/);
  lines = lines.map(l => l.trimEnd());
  while (typeof lines[0] === 'string' && !lines[0]) lines.splice(0, 1);
  while (typeof lines[lines.length - 1] === 'string' && !lines[lines.length - 1]) lines.splice(lines.length - 1, 1);
  level = lines.join('\n');

  if ((level.match(/@/g) || []).length !== 1) throw new Error('Invalid number of @');
  if ((level.match(/\$/g) || []).length !== (level.match(/\./g) || []).length) throw new Error('Invalid number of $.');
  return level;
}

/**
 * Find coordinales of level where to put blocks
 * @param {string} level
 * @return {{y: number, x: number}[]}
 */
function getTargets(level) {
  const lines = level.split('\n');
  let result = [];
  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[y].length; x++) {
      if (lines[y][x] === '.') {
        result.push({y, x});
      }
    }
  }
  return result;
}

/**
 *
 * @param {string} level
 * @param {number} dy
 * @param {number} dx
 * @return {string|null}
 */
function move(level, dy, dx) {
  let lines = level.split('\n').map(line => line.split(''));
  let lineWithDog = lines.find(line => line.includes('@'));
  let y = lines.indexOf(lineWithDog);
  let x = lineWithDog.indexOf('@');
  lines[y][x] = ' ';
  y += dy;
  x += dx;
  if (!lines[y][x]) throw new Error(`Moved player outside of map with y=${y} x=${x}`);
  if (lines[y][x] === '$') {                                                                        // move block
    if (!lines[y + dy][x + dx]) throw new Error(`Moved block outside of map with y=${y + dy} x=${x + dx}`);
    if (lines[y + dy][x + dx] !== ' ') return null;                                                 // no place for block
    lines[y + dy][x + dx] = '$';
    lines[y][x] = ' ';
  }
  if (lines[y][x] !== ' ') return null;
  lines[y][x] = '@';

  return lines.map(line => line.join('')).join('\n');
}

/**
 *
 * @param {string} level
 * @return {string|null}
 */
function moveUp(level) { return move(level, -1, 0);}

/**
 *
 * @param {string} level
 * @return {string|null}
 */
function moveDown(level) { return move(level, 1, 0); }

/**
 *
 * @param {string} level
 * @return {string|null}
 */
function moveLeft(level) { return move(level, 0, -1); }

/**
 *
 * @param {string} level
 * @return {string|null}
 */
function moveRight(level) { return move(level, 0, 1); }

/**
 * GameState type - level and up, down, left and right moves to other GameState
 * @typedef {{id: number, level: string, depth: number, left: GameState|null, up: GameState|null, right: GameState|null, down: GameState|null, isWin: boolean}} GameState
 */

/**
 *
 * @param {string} level
 * @param {number} depth
 * @param {{y: number, x: number}[]} targets
 * @return {GameState}
 */
function makeGameState(level, depth, targets) {
  const lines = level.split('\n');
  return {
    id: -1,
    level,
    depth,
    up: null,
    down: null,
    left: null,
    right: null,
    isWin: targets.every(({y, x}) => lines[y][x] === '$'),
  };
}

/**
 * Generate level graph
 * @param {string} level
 * @return {GameState[]}
 */
function genGraph(level) {
  level = prepareLevel(level);                                                                    // fix issues of level

  const targets = getTargets(level);                                                              // find targets (dots) and replace them with spaces
  level = level.replace(/\./g, ' ');

  /**
   * Start game state
   * @type {GameState}
   */
  const s0 = makeGameState(level, 0, targets);

  let h = {[s0.level]: s0};

  /**
   * The queue of unprocesses game states
   * @type {GameState[]}
   */
  let queue = [s0];

  /**
   * result of processing - list of all game states linked with each other
   * @type {GameState[]}
   */
  let states = [];

  while (queue.length) {
    let s = queue.shift();
    states.push(s);

    const level = s.level, levelU = moveUp(level), levelD = moveDown(level), levelL = moveLeft(level), levelR = moveRight(level);

    if (levelU) if (h[levelU]) s.up    = h[levelU]; else queue.push(s.up    = h[levelU] = makeGameState(levelU, s.depth + 1, targets));
    if (levelD) if (h[levelD]) s.down  = h[levelD]; else queue.push(s.down  = h[levelD] = makeGameState(levelD, s.depth + 1, targets));
    if (levelL) if (h[levelL]) s.left  = h[levelL]; else queue.push(s.left  = h[levelL] = makeGameState(levelL, s.depth + 1, targets));
    if (levelR) if (h[levelR]) s.right = h[levelR]; else queue.push(s.right = h[levelR] = makeGameState(levelR, s.depth + 1, targets));
  }

  states.forEach((s, i) => s.id = i);

  return states;
}

/**
 *
 * @param {GameState[]}states
 */
function logGameStates(states) {
  const LEVEL_WIDTH = Math.max.apply(Math, states[0].level.split('\n').map(line => line.length));
  console.log(''.padEnd(LEVEL_WIDTH + 8, ' ') + 'UP'.padEnd(LEVEL_WIDTH + 4, ' ') + 'DOWN'.padEnd(LEVEL_WIDTH + 4, ' ') + 'LEFT'.padEnd(LEVEL_WIDTH + 4, ' ') + 'RIGHT'.padEnd(LEVEL_WIDTH + 4, ' '));
  for (let state of states) {
    console.log((state.id + ' (' + state.depth + ')').padEnd(LEVEL_WIDTH + 4, ' ') + '|   ' +
        (state.up   ? state.up.id    + ' (' + state.up.depth + ')' : '').padEnd(LEVEL_WIDTH + 4, ' ') +
        (state.down ? state.down.id  + ' (' + state.down.depth + ')' : '').padEnd(LEVEL_WIDTH + 4, ' ') +
        (state.left ? state.left.id  + ' (' + state.left.depth + ')' : '').padEnd(LEVEL_WIDTH + 4, ' ') +
        (state.right? state.right.id + ' (' + state.right.depth + ')' : '').padEnd(LEVEL_WIDTH + 4, ' '));
    for (let i = 0; true; i++){
      if (!state.level.split('\n')[i]) break;
      console.log(state.level.split('\n')[i].padEnd(LEVEL_WIDTH + 4, ' ') + '|   ' +
          (state.up   ? state.up.level.split('\n')[i] : '').padEnd(LEVEL_WIDTH + 4, ' ') +
          (state.down ? state.down.level.split('\n')[i] : '').padEnd(LEVEL_WIDTH + 4, ' ') +
          (state.left ? state.left.level.split('\n')[i] : '').padEnd(LEVEL_WIDTH + 4, ' ') +
          (state.right? state.right.level.split('\n')[i] : '').padEnd(LEVEL_WIDTH + 4, ' '));
    }
    console.log('');
  }
}


// __builtin_popcount
function count1s(v) {
  let result = 0;
  for (; v; result++) v &= (v - 1n);
  return result;
}


/**
 *
 * @param {string} level
 */
function genLevel(level) {
  const states = genGraph(level);
  const N = states.length;

  logGameStates(states);
  console.log(`Generated ${states.length} states`);

  // adjacency list

  let connectedIdxs = [];
  for (let i = 0; i < states.length; i++) {
    connectedIdxs[i] = [];
    for (let j = 0; j < states.length; j++) {
      if (states[j].up === states[i] || states[j].down === states[i] || states[j].left === states[i] || states[j].right === states[i] ||
          states[i].up === states[j] || states[i].down === states[j] || states[i].left === states[j] || states[i].right === states[j]) {
        connectedIdxs[i].push(j);
      }
    }
  }


  // full distance matrix
  let dists = states.map((_, i) => states.map((_, j) => i === j ? 0 : connectedIdxs[i].includes(j) ? 1 : Infinity));

  for (let k = 0; k < N; k++) {
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        dists[i][j] = Math.min(dists[i][j], dists[i][k] + dists[k][j]);
  }


  let result = [0n];           // for the first one (depth=0) we set it
  let START_DEPTH = 1;


  // precalculated:
  let semiresults = [
    // depth
    /*  0 */ [0n],                                                                // 0
    /*  1 */ [1n, 2n, 4n],                                                        // 1 10 100
    /*  2 */ [3n, 10n, 5n, 6n, 12n],                                              // 11 1010 101 110 1100
    /*  3 */ [19n, 11n, 14n, 7n, 21n, 37n, 22n, 13n, 28n],                        // 10011 1011 1110 111 10101 100101 10110 1101 11100
    /*  4 */ [27n, 43n, 15n, 46n, 30n, 71n, 29n, 53n, 39n, 23n, 54n, 45n],        // 11011 101011 1111 101110 11110 1000111 11101 110101 100111 10111 110110 101101
    /*  5 */
  ]

  result = [].concat.apply([], semiresults);
  START_DEPTH = semiresults.length;


  const isSortedArraysHaveSameElement = (as, bs) => {
    let ai = 0, bi = 0;
    while (ai < as.length && bi < bs.length) {
      if (as[ai] === bs[bi]) return true;
      if (as[ai] < bs[bi]) ai++;
      else bi++;
    }
    return false;
  }

  const getChildrenIds = (i) => connectedIdxs[i].filter(j => j > i);


  const getBottomDist = (i, j) => {
    let is = [i], js = [j], depth = 0;
    while (!isSortedArraysHaveSameElement(is, js)) {
      is = Array.prototype.concat.apply([], is.map(getChildrenIds)).sort((a, b) => a - b);        // TODO: uniqify
      if (is.length === 0) return Infinity;
      js = Array.prototype.concat.apply([], js.map(getChildrenIds)).sort((a, b) => a - b);        // TODO: uniqify
      if (js.length === 0) return Infinity;
      depth++;
    }
    return 2 * depth;
  };


  debugger;
  for (let depth = START_DEPTH; ; depth++) {
    let ss = states.filter(state => state.depth === depth);                                         // states of selected depth
    if (ss.length === 0) break;


    debugger;
    let w = ss.map(s1 => ss.map(s2 => getBottomDist(s1.id, s2.id)));                                // distance submatrix
    console.log('Distance matrix: ', w);

    let parentValue = [];
    let fixedValue = [];

    // evaluate those that have more than one parent and set parentId for others
    ss.forEach((s, i) => {
      let sParentIds = connectedIdxs[s.id].filter(nid => states[nid].depth < depth);
      if (sParentIds.length === 0) { debugger; throw new Error('NO PARENT FOR STATE')}
      if (sParentIds.length === 1) { parentValue[i] = result[sParentIds[0]]; return true; }
      debugger;
      // find the result for the state as OR function of its parents
      let r = 0n;
      sParentIds.forEach(pid => {
        if (states[pid].depth !== depth - 1)  { debugger; throw new Error('Parent has invalid depth') }
        r |= result[pid];
      });
      if (count1s(r) !== depth) { debugger; throw new Error('Invalid OR on parents gave wrong result')}
      fixedValue[i] = r;
    });

    const dist = (n1, n2) => count1s(n1 ^ n2);


    function getNNumbersThatGivesSumEqualsK(n, k, fn) {
      let r = [];
      let rec = (i, k) => {
        if (i === n - 1) {
          r[i] = k;
          return fn(r);
        }
        for (r[i] = 0; r[i] <= k; r[i] ++) {
          if (rec(i + 1, k - r[i])) {
            return true;
          }
        }
      }
      return rec(0, k);
    }

    debugger;
    let maskSets = ss.map((s, i) => {
      let maskSet = [];
      let mask = 1n;
      for (let j = 0; j < 100; j++) {
        if (!fixedValue[i]) {
          while (parentValue[i] & mask) mask <<= 1n;
          maskSet.push(mask);
          mask <<= 1n;
        }
      }
      return maskSet;
    });


    let r = [];

    for (let sum = 0; sum < 100; sum++) {
      console.log('sum=', sum);
      let success = getNNumbersThatGivesSumEqualsK(maskSets.length, sum, (maskIndexes) => {
        let masks = maskIndexes.map((maskIndex, i) => maskSets[i][maskIndex]);
        r = masks.map((mask, i) => fixedValue[i] || (parentValue[i] ^ mask));
        // check r...
        for (let i = 0; i < r.length - 1; i++) {
          for (let j = i + 1; j < r.length; j++) {
            let d = dist(r[i], r[j]);
            if (d === 0 || dist(r[i], r[j]) > w[i][j]) return false;
          }
        }
        return true;
      });
      if (success) break;
    }

    console.log('depth=', depth, 'res = ', r, r.map(v => v.toString(2)));
    debugger;


    ss.forEach((s, i) => result[s.id] = r[i]);
  }


}


export { genLevel };
