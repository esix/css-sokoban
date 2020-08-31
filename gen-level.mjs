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
 * @typedef {{level: string, left: GameState|null, up: GameState|null, right: GameState|null, down: GameState|null, isWin: boolean}} GameState
 */

/**
 *
 * @param {string} level
 * @param {{y: number, x: number}[]} targets
 * @return {GameState}
 */
function makeGameState(level, targets) {
  const lines = level.split('\n');
  return {
    level,
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
  const s0 = makeGameState(level, targets);

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

    if (levelU) if (h[levelU]) s.up    = h[levelU]; else queue.push(s.up    = h[levelU] = makeGameState(levelU, targets));
    if (levelD) if (h[levelD]) s.down  = h[levelD]; else queue.push(s.down  = h[levelD] = makeGameState(levelD, targets));
    if (levelL) if (h[levelL]) s.left  = h[levelL]; else queue.push(s.left  = h[levelL] = makeGameState(levelL, targets));
    if (levelR) if (h[levelR]) s.right = h[levelR]; else queue.push(s.right = h[levelR] = makeGameState(levelR, targets));
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
 * @return {number}
 */
function countFitness(states, chromosome) {
  const genes = chromosome.split(',');
  let result = 0;
  for (let i = 0; i < states.length; i++) {
    let up = states.indexOf(states[i].up), down = states.indexOf(states[i].down), left = states.indexOf(states[i].left), right = states.indexOf(states[i].right);
    if (up !== -1) result += binaryDiff(genes[up], genes[i]) !== 1;
    if (down !== -1) result += binaryDiff(genes[down], genes[i]) !== 1;
    if (left !== -1) result += binaryDiff(genes[left], genes[i]) !== 1;
    if (right !== -1) result += binaryDiff(genes[right], genes[i]) !== 1;
  }
  return result;
}

/**
 *
 * @param {GameState[]} states
 * @param {string[]} population
 * @param {number} n
 * @return {string[]}
 */
function selectTop(states, population, n) {
  let idxs = population.map((_, i) => i);
  const scores = population.map(chromosome => countFitness(states, chromosome));
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


function mutate(chromosome) {
  let genes = chromosome.split(',');

  if (Math.random() < 0.2) swapRandom(genes);
  if (Math.random() < 0.2) swapRandom(genes);
  if (Math.random() < 0.2) swapRandom(genes);

  // TODO: add extra bit left
  if (Math.random() < 0.1) {
    const n = genes.length - 1;
    const i = 1 + Math.floor(Math.random() * n);
    let v = +genes[i], mask = 1;
    while (mask <= v) mask <<= 1;
    v = String(v | mask);
    if (!genes.includes(v)) {
      genes[i] = v;
    }
  }

  return genes.join(',');
}

/**
 *
 * @param {GameState[]} states
 * @param {string[]} population
 * @return {string[]}
 */
function populationStep(states, population) {
  let chromosomesSet = new Set(population);

  for (let i = 0; i < population.length - 1; i++) {
    for (let j = i + 1; j < population.length; j++) {
      chromosomesSet.add(mutate(crossover(population[i], population[j])))
    }
  }

  population = Array.from(chromosomesSet);

  population = selectTop(states, population, 20);
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

  const chromosome0 = states.map((_, i) => i).join(',');
  const chromosome1 = states.map((_, i) => states.length - i - 1).join(',');

  let score = 0, n = 0;

  let islands = [];
  for (let i = 0; i < 10; i++) islands[i] = [chromosome0, chromosome1];

  do {
    if (++n % 100 === 0) {
      console.log('iteration', n);

      for (let i = 0; i < islands.length; i++) {
        const iScore = countFitness(states, islands[i][0]);
        console.log('    ', islands[i][0], ' => ', iScore);
      }

      let leaders = islands.map(population => population[0]);
      islands = [];
      for (let a = 0; a < leaders.length - 1; a++) {
        for (let b = a + 1; b < leaders.length; b++) {
          islands.push([leaders[a], leaders[b]]);
        }
      }

    }

    score = Infinity;

    for (let i = 0; i < islands.length; i++) {
      islands[i] = populationStep(states, islands[i]);
      score = Math.min(countFitness(states, islands[i][0]));
    }

    islands = sortIslands(states, islands);
    if (islands.length > 10) islands.pop();

  } while (score > 0);


  console.log(islands[0][0]);
}


export { genLevel };
