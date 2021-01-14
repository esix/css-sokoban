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


function checkHasOne1(mask) {
  while (mask > 0 && (mask & 1) === 0) mask >>= 1;
  return mask === 1;
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

  // adjacency matrix
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

  function count1s(v) {
    let result = 0;
    for (; v; result++) v &= (v - 1n);
    return result;
  }

  function make1(v, v1) {
    let m = (v === -1) ? 1 :  (v ^ v1) << 1;                                        // setup to 1 first bit, next mask otherwise
    if (count1s(m) !== 1) {
      debugger;                                                         // mask must be 1
    }
    for (; v1 & m; m <<= 1);                                                   // search for 0 bit
    return v1 | m;
  }

  function make2(v, v1, v2) {
    let n = count1s(v1);
    if (n !== count1s(v2)) { debugger; throw new Error(`v1 and v2 no match for bits: ${v1}, _${v2}_`); }
    v = v1 | v2;
    if (count1s(v) !== n + 1) {
      // debugger;
      return -1;
    }
    return v;
  }

  function make3(v, v1, v2, v3) {
    let n = count1s(v1);
    if (n !== count1s(v2)) { debugger; throw new Error(`v1, v2 and v3 no match for bits: ${v1}, _${v2}_, ${v3}`); }
    if (n !== count1s(v3)) { debugger; throw new Error(`v1, v2 and v3 no match for bits: ${v1}, ${v2}, _${v3}_`); }
    v = v1 | v2 | v3;
    if (count1s(v) !== n + 1) {
      // debugger;
    }
    return v;
  }


  // full distance matrix
  let dists = states.map((_, i) => states.map((_, j) => i === j ? 0 : connectedIdxs[i].includes(j) ? 1 : Infinity));

  for (let k = 0; k < N; k++) {
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        dists[i][j] = Math.min(dists[i][j], dists[i][k] + dists[k][j]);
  }


  let result = [0n];           // for the first one (depth=0) we set it

  const abs = Math.abs;

  debugger;
  for (let depth = 1; ; depth++) {
    let ss = states.filter(state => state.depth === depth);                   // states of depth
    if (ss.length === 0) break;

    // values for id
    let parentValue = [];

    // remove those that have more then one parent, find parents for those that are left, find result for them
    ss = ss.filter(s => {
      let sParentIds = connectedIdxs[s.id].filter(nid => states[nid].depth < depth);
      if (sParentIds.length === 0) { debugger; throw new Error('NO PARENT FOR STATE')}
      if (sParentIds.length === 1) { parentValue.push(result[sParentIds[0]]); return true; }
      debugger;
      // find the result for the state as OR function of its parents
      let r = 0n;
      sParentIds.forEach(pid => {
        if (states[pid].depth !== depth - 1)  { debugger; throw new Error('Parent has invalid depth') }
        r |= result[pid];
      });
      if (count1s(r) !== depth) { debugger; throw new Error('Invalid OR on parents gave wrong result')}
      return false;                                                           // we don't need this element further
    });

    let w = ss.map(s1 => ss.map(s2 => dists[s1.id][s2.id]));                  // distance submatrix
    console.log(w);

    const d = (n1, n2) => count1s(n1 ^ n2);


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
        while (parentValue[i] & mask) mask <<= 1n;
        maskSet.push(mask);
        mask <<= 1n;
      }
      return maskSet;
    });


    let r = [];

    for (let sum = 0; sum < 100; sum++) {
      console.log('sum=', sum);
      let success = getNNumbersThatGivesSumEqualsK(maskSets.length, sum, (maskIndexes) => {
        let masks = maskIndexes.map((maskIndex, i) => maskSets[i][maskIndex]);
        r = masks.map((mask, i) => parentValue[i] ^ mask);
        // check r...
        for (let i = 0; i < r.length; i++) {
          for (let j = 0; j < r.length; j++) {
            if (d(r[i], r[j]) !== w[i][j]) return false;
          }
        }
        return true;
      });
      if (success) break;
    }

    debugger;


    // let r = [];                                                               // local result
    //
    // let rec = (i) => {
    //   if (i === ss.length) return true;
    //   const p = parentValue[i];
    //   outer:
    //   for (let bit = 0n; bit < 30n; bit++) {
    //     let mask = 1n << bit;
    //     if (!(p & mask)) {                                           // has corresponding bit set to 0
    //       r[i] = p ^ mask;                                           // set this bit to 1
    //       for (let j = 0; j < i; j++) {
    //         if (d(r[i], r[j]) !== w[i][j]) continue outer;      // not match binary distance => try next bit
    //       }
    //
    //       if (rec(i+1)) {
    //         return true;
    //       }
    //     }
    //   }
    // }
    //
    // debugger;
    // let res = rec(0);
    // if (!res) {
    //   debugger;
    // }





    // let countError = (chromosome) => {
    //   let error = 0;
    //   ss.forEach((s, i) => error += 10000 * abs(count1s(chromosome[i]) - depth));      // number or 1 bits should be equal to depth
    //   ss.forEach((s1 , i) => ss.forEach((s2, j) => {                  // should be uniq
    //     if (i !== j && chromosome[i] === chromosome[j]) error += 1000;
    //   }));
    //   ss.forEach((s, i) => error += 100 * abs(count1s(chromosome[i] ^ parentValue[i]) - 1)); // parent should differ only one bit
    //
    //   ss.forEach((s1 , i) => ss.forEach((s2, j) => {                  // should match distances
    //     if (i !== j)
    //       error += abs(1 * count1s(chromosome[i] ^ chromosome[j]) - w[i][j]);                             //
    //   }));
    //
    //   return error;
    // }
    //







    let mutate = (chromosome) => {
      let idx = Math.floor(Math.random() * chromosome.length);
      let c = chromosome[idx]
      let len = c.toString(2).length;
      if (Math.random() > 0.8) {
        let bitIdx = BigInt(Math.floor(Math.random() * (len + 1)));
        c = c ^ (1n << bitIdx);
      } else {  // swap two random bits
        let i1 = BigInt(Math.floor(Math.random() * (len + 2)));
        let i2 = BigInt(Math.floor(Math.random() * (len + 2)));
        let b1 = (c & (1n << i1)) >> i1;
        let b2 = (c & (1n << i2)) >> i2;
        if (b1) c |= (1n << i2); else c ^= (1n << i2);
        if (b2) c |= (1n << i1); else c ^= (1n << i1);
      }
      chromosome[idx] = c;
      return chromosome;
    }

    let crossover = (chromosome1, chromosome2) => {
      let n = chromosome1.length;
      let result = [];
      for (let i = 0; i < n; i++) {
        let v1 = chromosome1[i], v2 = chromosome2[i];
        let diffBits = (v1 ^ v2).toString(2);
        let or = 0n;
        for (let i = 0; i < diffBits.length; i++) {
          if (diffBits[i] === '1' && Math.random() < 0.5) {
            or |= (1n << BigInt(i));                                                                    // setup some of diff bits to 1
          }
        }
        result.push(v1 | or);
      }
      return result;
    }

    // let chromosomes = [
    //     ss.map((s, i) => 1n << BigInt(i)),
    //     ss.map((s, i) => 1n << BigInt(i + 1)),
    //     ss.map((s, i) => 1n << BigInt(ss.length - i - 1)),
    //     ss.map((s, i) => 1n << BigInt(ss.length - i))];

    // run genetic
    // let localResult = null;
    //
    // for (let g = 0; g < 10000; g++) {
    //   let n = chromosomes.length;
    //
    //   let newChromosomes = {};
    //   chromosomes.forEach(c => newChromosomes[c] = c);
    //
    //   for (let i = 0; i < n; i++) {
    //     for (let j = 0; j < n; j++) {
    //       let c = mutate(crossover(chromosomes[i], chromosomes[j]));
    //       newChromosomes[c] = c;
    //     }
    //   }
    //   chromosomes = Object.values(newChromosomes);
    //
    //   let pairs = chromosomes.map(chromosome => [countError(chromosome), chromosome]);
    //   pairs.sort(([e1, c1], [e2, c2]) => e1 - e2);
    //   pairs = pairs.slice(0, 10);
    //   let bestPair = pairs[0];
    //   console.log(bestPair[0]);
    //   if (bestPair[0] === 0) {                                                // error === 0
    //     localResult = bestPair[1];
    //     break;
    //   }
    //   chromosomes = pairs.map(([v, c]) => c);
    // }
    //
    //
    // if (!localResult) {
    //   debugger;
    //   let c = chromosomes[0];
    //   let maxLen = Math.max.apply(Math, c.map(c => c.toString(2).length));
    //   console.log(countError(c), c, '\n' + c.map(c => c.toString(2).padStart(maxLen, '0')).join('\n'));
    //   throw new Error('No result found');
    // }

    ss.forEach((s, i) => result[s.id] = r[i]);
  }



  /*
  let results = states.map(() => -1);
  results[0] = 0;

  for (let i = 1; i < states.length; ) {
    let idxs = connectedIdxs[i].filter(j => j < i);
    let connectedValues = idxs.map(j => results[j]);
    if (connectedValues.length === 0) throw new Error('0');
    else if (connectedValues.length === 1) {
      results[i] = make1(results[i], connectedValues[0], used);
      if (used[results[i]]) continue;
      used[results[i]] = true;
    } else if (connectedValues.length === 2) {
      results[i] = make2(results[i], connectedValues[0], connectedValues[1]);
      if (results[i] === -1 || used[results[i]]) {                                                    // fallback to idxs[1]
        for (; i > idxs[1]; i--) { used[results[i]] = false; results[i] = -1; }
        continue;
      }
      used[results[i]] = true;

    } else if (connectedValues.length === 3) {
      results[i] = make3(results[i], connectedValues[0], connectedValues[1], connectedValues[2]);
      if (results[i] === -1 || used[results[i]]) {                                                    // fallback to idxs[1]
        for (; i > idxs[1]; i--) { used[results[i]] = false; results[i] = -1; }
        continue;
      }
      used[results[i]] = true;

    } else if (connectedValues.length === 4) {
      throw new Error('4');
    } else {
      throw new Error('MANY???');
    }
    console.log(`state ${i} (${states[i].depth}) connected`, connectedValues,`make value  = ${results[i]} (${results[i].toString(2).padStart(8, '0')})`);

    i++;
  }



  let i = 1;

  let n = 0;
  const MAX = 0x10000;
  //const MAX = 0x00020;

  while (i < states.length) {
    if ((n++) % 10000000 === 0) {
      console.log('STEP', n, ': ', i, ':', results.slice(0, i).join(','));
    }

    let connected = connectedIdxs[i].map(j => results[j]);

    let mask;
    if (results[i] === -1) {
      mask = 1;
    } else {
      mask = results[i] ^ connected[0];
      mask <<= 1;                                             // will change next bit
      if (!checkHasOne1(mask)) {
        debugger;
        console.log('INVALID MASK', 'i=', i, 'results[i]=', results[i], 'connected[0]=', connected[0]);
        throw new Error('invalid mask');
      }
      if (mask === MAX) {                                   // overflow: step back
        // const lastConnectedIndex = connectedIdxs[i][connectedIdxs[i].length - 1];
        // if (lastConnectedIndex === 0) {
        //   debugger;
        // }
        // while (i > lastConnectedIndex) {
        results[i] = -1;
        i--;
        //}
        continue;
      }
    }

    results[i] = connected[0] ^ mask;

    if (results.indexOf(results[i]) !== i) {                                                  // duplicate: maybe search next
      continue;
    }

    if (connected[1] !== undefined && !checkHasOne1(connected[1] ^ results[i]) ||
        connected[2] !== undefined && !checkHasOne1(connected[2] ^ results[i]) ||
        connected[3] !== undefined && !checkHasOne1(connected[3] ^ results[i])) {
      continue;
    }

    // value passed tests and is ok
    i++;
  }

  console.log(results.join(','));
  */

}


export { genLevel };
