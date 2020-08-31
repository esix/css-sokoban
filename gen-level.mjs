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


const moveUp = (level) => move(level, -1, 0);
const moveDown = (level) => move(level, 1, 0);
const moveLeft = (level) => move(level, 0, -1);
const moveRight = (level) => move(level, 0, 1);

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


function logStates(states) {
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

function binaryDiff(a, b) {
  let result = 0;
  for( ; a || b; (a >>= 1), (b >>= 1)) result += +((a & 1) !== (b & 1));
  return result;
}

function countFitness(states, mapping) {
  let result = 0;
  for (let i = 0; i < states.length; i++) {
    let up = states.indexOf(states[i].up), down = states.indexOf(states[i].down), left = states.indexOf(states[i].left), right = states.indexOf(states[i].right);
    if (up !== -1) result += binaryDiff(mapping[up], mapping[i]) !== 1;
    if (down !== -1) result += binaryDiff(mapping[down], mapping[i]) !== 1;
    if (left !== -1) result += binaryDiff(mapping[left], mapping[i]) !== 1;
    if (right !== -1) result += binaryDiff(mapping[right], mapping[i]) !== 1;
  }
  return result;
}


function crossover(x, y) {
  const n = x.length;
  let mapping = new Array(n);
  for (let i = 0; i < n; i++) {
    let [a, b] = Math.random() < 0.5 ? [x, y] : [y, x];

    for (let k = i; k !== -1 && mapping[k] === undefined; k = b.indexOf(a[k])) {
      mapping[k] = a[k];
    }

  }
  return mapping;
}


function swapRandom(mapping) {
  const n = mapping.length - 1;
  let i = 1 + Math.floor(Math.random() * n), j = 1 + Math.floor(Math.random() * n);
  [mapping[i], mapping[j]] = [mapping[j], mapping[i]];
}


function mutate(mapping) {
  mapping = mapping.slice(0);
  // mutate
  if (Math.random() < 0.2) swapRandom(mapping);
  if (Math.random() < 0.2) swapRandom(mapping);
  if (Math.random() < 0.2) swapRandom(mapping);

  // TODO: add extra bit left

  return mapping;
}


function genLevel(level) {
  level = prepareLevel(level);                                                                    // fix issues of level

  const targets = getTargets(level);                                                              // find targets (dots) and replace them with spaces
  level = level.replace(/\./g, ' ');
  console.log('targets', targets);

  const s0 = makeGameState(level, targets);
  let h = {[s0.level]: s0};

  let queue = [s0];
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

  logStates(states);
  console.log(`Generated ${states.length} states`);

  let mapping = states.map((_, i) => i);
  let population = [];
  for (let i = 0; i < 100; i++) population.push(mapping.slice(0));

  for (let i = 0; i < 2000; i++) {
    // console.log('iteration', i);
    population.forEach(mapping => mapping.score = countFitness(states, mapping));
    population.sort((p1, p2) => p1.score - p2.score);

    population = population.slice(0, 10);
    for (let a = 0; a < 10; a++) {
      for (let b = 0; b < 10; b++) {
        if (a !== b) {
          population.push(mutate(crossover(population[a], population[b])));
        }
      }
    }

    // console.log(`population ${i}: Best ${population[0].score}`)
  }

  console.log(population[0]);
}


export { genLevel };
