//
//
//

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
 * @typedef {{level: string, depth: number, left: GameState|null, up: GameState|null, right: GameState|null, down: GameState|null, isWin: boolean}} GameState
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

/**
 * Count bits that two numbers differs
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function binaryDiff(a, b) {
  let result = 0;
  for( ; a || b; (a >>= 1), (b >>= 1)) result += +((a & 1) !== (b & 1));
  return result;
}

/**
 *
 * @param {GameState[]} states
 * @param {string} chromosome
 * @param {number} maxDepth
 * @return {number}
 */
function countFitness(states, chromosome, maxDepth = Infinity) {
  const genes = chromosome.split(',');
  let result = 0;
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    if (state.depth > maxDepth) continue;
    const up = states.indexOf(state.up), down = states.indexOf(state.down), left = states.indexOf(state.left), right = states.indexOf(state.right)
    if (up !== -1 && state.up.depth <= maxDepth) result += (binaryDiff(+genes[up], +genes[i]) !== 1);
    if (down !== -1 && state.down.depth <= maxDepth) result += (binaryDiff(+genes[down], +genes[i]) !== 1);
    if (left !== -1 && state.left.depth <= maxDepth) result += (binaryDiff(+genes[left], +genes[i]) !== 1);
    if (right !== -1 && state.right.depth <= maxDepth) result += (binaryDiff(+genes[right], +genes[i]) !== 1);
  }
  return result;
}

/**
 *
 * @param {GameState[]} states
 * @param {string[]} population
 * @param {number} n
 * @param {number?} maxDepth
 * @return {string[]}
 */
function selectTop(states, population, n, maxDepth = Infinity) {
  let idxs = population.map((_, i) => i);
  const scores = population.map(chromosome => countFitness(states, chromosome, maxDepth));
  idxs.sort((i1, i2) => scores[i1] - scores[i2]);
  idxs = idxs.slice(0, n);
  return idxs.map(i => population[i]);
}


function crossover(x, y) {
  x = x.split(',');
  y = y.split(',');
  const n = x.length;
  let genes = new Array(n);

  for (let i = 0; i < n; i++) {
    let [a, b] = Math.random() < 0.5 ? [x, y] : [y, x];

    for (let k = i; k !== -1 && genes[k] === undefined; k = b.indexOf(a[k])) {
      genes[k] = a[k];
    }
  }

  return genes.join(',');
}


function swapRandom(genes) {
  const n = genes.length - 1;
  let i = 1 + Math.floor(Math.random() * n), j = 1 + Math.floor(Math.random() * n);
  [genes[i], genes[j]] = [genes[j], genes[i]];
}

/**
 *
 * @param {number} start
 * @param {number?} end
 * @returns {number}
 */
function rand(start, end) {
  if (!end) {
    [start, end] = [0, start];
  }
  const r = Math.floor((end - start) * Math.random());
  return start + r;
}

/**
 *
 * @param {number} v
 * @returns {number} number with one inverted bit
 */
function invertRandomBit(v) {
  const mask = 1 << rand(0, 16);
  v ^= mask;
  return v;
}


function mutate(chromosome) {
  let genes = chromosome.split(',');

  if (Math.random() < 0.2) swapRandom(genes);
  // if (Math.random() < 0.2) swapRandom(genes);
  // if (Math.random() < 0.2) swapRandom(genes);

  // invert random bit
  if (Math.random() < 0.1) {
    const n = genes.length - 1;
    const i = 1 + Math.floor(Math.random() * n);
    let v = String(invertRandomBit(+genes[i]));
    if (!genes.includes(v)) {
      genes[i] = v;
    }
  }

  // // Add extra bit left
  // if (Math.random() < 0.1) {
  //   const n = genes.length - 1;
  //   const i = 1 + Math.floor(Math.random() * n);
  //   let v = +genes[i], mask = 1;
  //   while (mask > 0 && mask <= v) mask <<= 1;
  //   v = String(v | mask);
  //   if (v > 0 && !genes.includes(v)) {
  //     genes[i] = v;
  //   }
  // }

  // if (Math.random() < 0.1) {
  //   const n = genes.length - 1;
  //   const i = 1 + Math.floor(Math.random() * n);
  //   let v = +genes[i];
  //   v = String(v >> 1);
  //   if (!genes.includes(v)) {
  //     genes[i] = v;
  //   }
  // }

  return genes.join(',');
}

/**
 *
 * @param {GameState[]} states
 * @param {string[]} population
 * @param {number?} maxDepth
 * @return {string[]}
 */
function populationStep(states, population, maxDepth = Infinity) {
  let chromosomesSet = new Set();

  for (let i = 0; i < population.length; i++) {
    for (let j = 0; j < population.length; j++) {
      chromosomesSet.add(mutate(crossover(population[i], population[j])))
    }
  }

  population = Array.from(chromosomesSet);

  population = selectTop(states, population, 10, maxDepth);
  return population;
}

/**
 *
 * @param {GameState[]} states
 * @param {string[][]} islands
 * @return {string[][]}
 */
function sortIslands(states, islands) {
  /**
   *
   * @type {number[]}
   */
  const idxs = islands.map((_, i) => i);
  const scores = islands.map(population => countFitness(states, population[0]));
  idxs.sort((i1, i2) => scores[i1] - scores[i2]);
  return idxs.map(i => islands[i]);
}


/**
 *
 * @param {string} level
 */
function genLevel(level) {
  const states = genGraph(level);

  logGameStates(states);
  console.log(`Generated ${states.length} states`);


  const maxDepth = Math.max.apply(Math, states.map(state => state.depth));

  const chromosome0 = states.map((_, i) => i).join(',');
  const chromosome1 = states.map((_, i) => 2 * i).join(',');
  let population = [chromosome0, chromosome1];

  for (let depth = 0; depth <= maxDepth; depth++) {
    console.log('depth=', depth);
    let score = 0, n = 0;
    do {
      population = populationStep(states, population, depth);
      score = countFitness(states, population[0], depth);

      if (++n % 100 === 0) {
        console.log('iteration', n, 'score=', score, 'chromosome=', population[0].split(',').map((gene, i) => states[i].depth <= depth ? gene : '_' ).join(','));
      }

      if (n > 1000) {
        console.log('REPLAY depth = ', depth, 'score=', score, 'chromosome=', population[0].split(',').map((gene, i) => states[i].depth <= depth ? gene : '_' ).join(','));
        depth -= 2;
        break;
      }
    } while (score > 0);

    if (score === 0) {
      console.log('SUCCESS depth = ', depth, 'score=', score, 'chromosome=', population[0].split(',').map((gene, i) => states[i].depth <= depth ? gene : '_' ).join(','));
    }
  }

  console.log(population[0]);
}


export { genLevel };
