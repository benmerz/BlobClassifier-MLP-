function randn() { // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateQuadrantBlobs(n, f) {
  const points = [];
  // Separation shrinks as f increases (f in 0..1)
  const sep = 0.6 * (1 - f * 0.5); // at f=1 sep -> 0.3 (closer clusters)
  const centers = [
    { x: -sep, y: -sep, c: 0 },
    { x:  sep, y: -sep, c: 1 },
    { x: -sep, y:  sep, c: 2 },
    { x:  sep, y:  sep, c: 3 }
  ];
  const per = Math.floor(n / centers.length);
  const sigma = 0.12 + f * 0.35; // more noise with higher f
  centers.forEach(center => {
    for (let i = 0; i < per; i++) {
      points.push({
        x: center.x + randn() * sigma,
        y: center.y + randn() * sigma,
        c: center.c
      });
    }
  });
  return points;
}

function generateMoon(n, f, gapValue) { // Two moons with adjustable user gap & randomness
  const points = [];
  const per = Math.floor(n / 2);
  // Gap directly from slider (0..0.5). Noise can shrink effective gap slightly for dynamic feel.
  const gap = Math.max(0, gapValue - f * gapValue * 0.4); // shrink a bit with noise
  // Horizontal shift scaled by gap for consistent shape
  const horizShift = 0.3 + gap * 1.2; // smaller gap => smaller shift
  for (let i = 0; i < per; i++) {
    const t = Math.random() * Math.PI;
    // Increased baseline noise & stronger scaling with f
    const rNoise = (Math.random() - 0.5) * (0.08 + f * 0.25);
    let x = Math.cos(t) + rNoise * 1.4;
    let y = (Math.sin(t) * 0.5) + gap / 2 + rNoise;
    points.push({ x, y, c: 0 });
  }
  for (let i = 0; i < per; i++) {
    const t = Math.random() * Math.PI;
    const rNoise = (Math.random() - 0.5) * (0.08 + f * 0.25);
    let x = horizShift - Math.cos(t) + rNoise * 1.4;
    let y = (-Math.sin(t) * 0.5) - gap / 2 + rNoise;
    points.push({ x, y, c: 1 });
  }
  // Normalize to -1..1 using bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(p => { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; });
  const scaleX = 2 / (maxX - minX);
  const scaleY = 2 / (maxY - minY);
  points.forEach(p => { p.x = (p.x - minX) * scaleX - 1; p.y = (p.y - minY) * scaleY - 1; });
  return points;
}

function generateDiagonalStripes(n, f) { // Diagonal corner clusters: two clusters share class
  const points = [];
  // separation shrinks slightly with f for more overlap
  const sep = 0.7 - f * 0.2; // 0.7 -> 0.5
  const sigmaShared = 0.08 + f * 0.25;
  const sigmaUnique = 0.08 + f * 0.25;
  const centers = [
    { x: -sep, y: -sep, c: 0 }, // shared class corner 1
    { x:  sep, y:  sep, c: 0 }, // shared class corner 2 (diagonal)
    { x:  sep, y: -sep, c: 1 }, // unique class
    { x: -sep, y:  sep, c: 2 }  // unique class
  ];
  // allocate counts: shared class gets double allocation
  const per = Math.floor(n / (centers.length + 1)); // +1 weight for shared duplication
  centers.forEach(center => {
    const isShared = center.c === 0;
    const count = isShared ? per * 2 : per;
    const sigma = isShared ? sigmaShared : sigmaUnique;
    for (let i = 0; i < count; i++) {
      points.push({
        x: center.x + randn() * sigma,
        y: center.y + randn() * sigma,
        c: center.c
      });
    }
  });
  // If we are short due to floor rounding, add random from centers
  while (points.length < n) {
    const center = centers[Math.floor(Math.random() * centers.length)];
    const sigma = center.c === 0 ? sigmaShared : sigmaUnique;
    points.push({ x: center.x + randn() * sigma, y: center.y + randn() * sigma, c: center.c });
  }
  return points;
}

const palette = ["#ff6b6b", "#4dabf7", "#ffd43b", "#51cf66", "#845ef7", "#ff922b"];

function draw(points) {
  const canvas = document.getElementById('plot');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // Decision boundary background if model trained
  if (mlpModel) {
    drawDecisionBoundary(ctx, w, h);
  }
  // axes & grid
  ctx.strokeStyle = '#2b3139';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 0.5) {
    const gx = ((i + 1) / 2) * w;
    ctx.beginPath();
    ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    const gy = h - ((i + 1) / 2) * h;
    ctx.beginPath();
    ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }
  // points
  points.forEach(p => {
    const px = ((p.x + 1) / 2) * w;
    const py = h - ((p.y + 1) / 2) * h;
    ctx.fillStyle = palette[p.c % palette.length];
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    if (p.pred !== undefined && p.pred !== p.c) { // misclassification highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function generate(dataset, n, f, gapValue) {
  switch (dataset) {
    case 'quadrant': return generateQuadrantBlobs(n, f);
    case 'moon': return generateMoon(n, f, gapValue);
    case 'diagonal': return generateDiagonalStripes(n, f);
    default: return [];
  }
}

function regenerate() {
  const dataset = document.getElementById('datasetSelect').value;
  let n = parseInt(document.getElementById('pointCount').value, 10);
  if (isNaN(n) || n < 50) n = 600;
  const f = parseFloat(document.getElementById('noiseSlider').value);
  let gapValue = 0.2;
  const gapEl = document.getElementById('moonGapSlider');
  if (dataset === 'moon' && gapEl) {
    gapValue = parseFloat(gapEl.value);
    if (isNaN(gapValue)) gapValue = 0.2;
  }
  const pts = generate(dataset, n, f, gapValue);
  draw(pts);
  currentPoints = pts; // store for training
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('regenBtn').addEventListener('click', regenerate);
  document.getElementById('datasetSelect').addEventListener('change', regenerate);
  document.getElementById('datasetSelect').addEventListener('change', handleMoonGapVisibility);
  const noiseSlider = document.getElementById('noiseSlider');
  const noiseValue = document.getElementById('noiseValue');
  noiseSlider.addEventListener('input', () => {
    noiseValue.textContent = parseFloat(noiseSlider.value).toFixed(2);
    regenerate();
  });
  const moonGapSlider = document.getElementById('moonGapSlider');
  const moonGapValue = document.getElementById('moonGapValue');
  if (moonGapSlider) {
    moonGapSlider.addEventListener('input', () => {
      moonGapValue.textContent = parseFloat(moonGapSlider.value).toFixed(2);
      if (document.getElementById('datasetSelect').value === 'moon') regenerate();
    });
  }
  document.getElementById('trainBtn').addEventListener('click', startTraining);
  handleMoonGapVisibility();
  regenerate();
});

// ===== MLP Implementation =====
let mlpModel = null;
let currentPoints = [];
const boundaryResolution = 120; // grid cells per axis for boundary
let trainingActive = false;
function handleMoonGapVisibility() {
  const ds = document.getElementById('datasetSelect').value;
  const elements = [
    document.getElementById('moonGapLabel'),
    document.getElementById('moonGapSlider'),
    document.getElementById('moonGapValue')
  ];
  elements.forEach(el => { if (el) el.style.display = ds === 'moon' ? '' : 'none'; });
}

function initMLP(inputDim, hiddenDims, outputDim) {
  const layers = [];
  let prev = inputDim;
  hiddenDims.forEach(h => {
    layers.push({
      W: randMatrix(prev, h),
      b: new Array(h).fill(0)
    });
    prev = h;
  });
  // output layer
  layers.push({ W: randMatrix(prev, outputDim), b: new Array(outputDim).fill(0) });
  return { layers };
}

function randMatrix(r, c) {
  const m = new Array(r);
  for (let i = 0; i < r; i++) {
    m[i] = new Array(c);
    for (let j = 0; j < c; j++) {
      m[i][j] = (Math.random() - 0.5) * 0.4 / Math.sqrt(r); // scaled init
    }
  }
  return m;
}

function forward(model, x) {
  let a = x.slice();
  const activations = [a];
  for (let li = 0; li < model.layers.length; li++) {
    const { W, b } = model.layers[li];
    const z = new Array(W[0].length).fill(0);
    for (let j = 0; j < W[0].length; j++) {
      let sum = b[j];
      for (let i = 0; i < W.length; i++) sum += a[i] * W[i][j];
      z[j] = sum;
    }
    if (li < model.layers.length - 1) {
      // ReLU
      a = z.map(v => v > 0 ? v : 0);
    } else {
      // Softmax
      const maxZ = Math.max(...z);
      const exps = z.map(v => Math.exp(v - maxZ));
      const sumExp = exps.reduce((acc, v) => acc + v, 0);
      a = exps.map(v => v / sumExp);
    }
    activations.push(a);
  }
  return activations;
}

function backward(model, activations, target) {
  // target is one-hot array
  const grads = [];
  // output error (softmax cross-entropy derivative): a_L - target
  let delta = activations[activations.length - 1].map((v, i) => v - target[i]);
  for (let li = model.layers.length - 1; li >= 0; li--) {
    const aPrev = activations[li];
    const { W } = model.layers[li];
    // gradients for W and b
    const dW = new Array(W.length);
    for (let i = 0; i < W.length; i++) {
      dW[i] = new Array(W[0].length);
      for (let j = 0; j < W[0].length; j++) {
        dW[i][j] = aPrev[i] * delta[j];
      }
    }
    const db = delta.slice();
    grads.unshift({ dW, db });
    if (li > 0) {
      // propagate delta to previous layer
      const newDelta = new Array(model.layers[li - 1].W[0].length).fill(0);
      for (let i = 0; i < model.layers[li - 1].W[0].length; i++) {
        let sum = 0;
        for (let j = 0; j < delta.length; j++) {
          sum += delta[j] * model.layers[li].W[i][j];
        }
        // ReLU derivative
        const activated = activations[li][i];
        newDelta[i] = activated > 0 ? sum : 0;
      }
      delta = newDelta;
    }
  }
  return grads;
}

function applyGrads(model, grads, lr) {
  for (let li = 0; li < model.layers.length; li++) {
    const layer = model.layers[li];
    const { dW, db } = grads[li];
    for (let i = 0; i < layer.W.length; i++) {
      for (let j = 0; j < layer.W[0].length; j++) {
        layer.W[i][j] -= lr * dW[i][j];
      }
    }
    for (let j = 0; j < layer.b.length; j++) layer.b[j] -= lr * db[j];
  }
}

function oneHot(c, numClasses) {
  const arr = new Array(numClasses).fill(0);
  arr[c] = 1;
  return arr;
}

function predict(model, x) {
  const acts = forward(model, x);
  const out = acts[acts.length - 1];
  let maxI = 0; let maxV = out[0];
  for (let i = 1; i < out.length; i++) if (out[i] > maxV) { maxV = out[i]; maxI = i; }
  return maxI;
}

function drawDecisionBoundary(ctx, w, h) {
  const res = boundaryResolution;
  const cellW = w / res;
  const cellH = h / res;
  // classify grid
  const grid = new Array(res);
  for (let gy = 0; gy < res; gy++) {
    grid[gy] = new Array(res);
    const y = 1 - (gy + 0.5) / res * 2; // map to -1..1 (canvas top is +1)
    for (let gx = 0; gx < res; gx++) {
      const x = -1 + (gx + 0.5) / res * 2;
      grid[gy][gx] = predict(mlpModel, [x, y]);
    }
  }
  // draw filled background cells (batch via rects)
  for (let gy = 0; gy < res; gy++) {
    for (let gx = 0; gx < res; gx++) {
      const c = grid[gy][gx];
      ctx.fillStyle = hexWithAlpha(palette[c % palette.length], 0.15);
      ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
    }
  }
  // draw border lines where class changes horizontally / vertically
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  for (let gy = 0; gy < res; gy++) {
    for (let gx = 0; gx < res; gx++) {
      const c = grid[gy][gx];
      // right neighbor
      if (gx + 1 < res && grid[gy][gx + 1] !== c) {
        const x0 = (gx + 1) * cellW;
        const y0 = gy * cellH;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y0 + cellH);
        ctx.stroke();
      }
      // bottom neighbor
      if (gy + 1 < res && grid[gy + 1][gx] !== c) {
        const x0 = gx * cellW;
        const y0 = (gy + 1) * cellH;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + cellW, y0);
        ctx.stroke();
      }
    }
  }
}

function hexWithAlpha(hex, alpha) {
  // expand short hex
  let h = hex.replace('#','');
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function startTraining() {
  if (!currentPoints.length) return;
  const epochs = parseInt(document.getElementById('epochsInput').value, 10) || 100;
  const lr = parseFloat(document.getElementById('lrInput').value) || 0.05;
  const dataset = document.getElementById('datasetSelect').value;
  // Determine number of classes present
  let numClasses = 0;
  currentPoints.forEach(p => { if (p.c + 1 > numClasses) numClasses = p.c + 1; });
  const hiddenStr = document.getElementById('layersInput').value.trim();
  const hiddenLayers = parseHiddenLayers(hiddenStr);
  mlpModel = initMLP(2, hiddenLayers, numClasses);
  const statusEl = document.getElementById('trainStatus');
  statusEl.textContent = 'Training...';
  let epoch = 0;
  // Prepare training data arrays
  const data = currentPoints.map(p => ({ x: [p.x, p.y], y: oneHot(p.c, numClasses) }));
  trainingActive = true;

  function step() {
    if (!trainingActive) return; // abort early if stopped
    // simple full batch gradient descent
    let batchGrads = null;
    data.forEach(sample => {
      const acts = forward(mlpModel, sample.x);
      const grads = backward(mlpModel, acts, sample.y);
      if (!batchGrads) {
        batchGrads = grads.map(g => ({
          dW: g.dW.map(row => row.slice()),
          db: g.db.slice()
        }));
      } else {
        for (let li = 0; li < grads.length; li++) {
          for (let i = 0; i < grads[li].dW.length; i++) {
            for (let j = 0; j < grads[li].dW[0].length; j++) {
              batchGrads[li].dW[i][j] += grads[li].dW[i][j];
            }
          }
          for (let j = 0; j < grads[li].db.length; j++) batchGrads[li].db[j] += grads[li].db[j];
        }
      }
    });
    // average
    const invN = 1 / data.length;
    for (let li = 0; li < batchGrads.length; li++) {
      for (let i = 0; i < batchGrads[li].dW.length; i++) {
        for (let j = 0; j < batchGrads[li].dW[0].length; j++) {
          batchGrads[li].dW[i][j] *= invN;
        }
      }
      for (let j = 0; j < batchGrads[li].db.length; j++) batchGrads[li].db[j] *= invN;
    }
    applyGrads(mlpModel, batchGrads, lr);
    // accuracy
    let correct = 0;
    currentPoints.forEach(p => {
      const pred = predict(mlpModel, [p.x, p.y]);
      p.pred = pred;
      if (pred === p.c) correct++;
    });
    const acc = (correct / currentPoints.length * 100).toFixed(1);
    statusEl.textContent = `Epoch ${epoch + 1}/${epochs} Acc ${acc}%`;
    draw(currentPoints);
    epoch++;
    if (epoch < epochs) {
      // schedule next epoch
      if (epoch % 5 === 0) {
        // small pause every 5 epochs to keep UI responsive
        setTimeout(step, 0);
      } else {
        requestAnimationFrame(step);
      }
    } else {
      statusEl.textContent = `Done Acc ${acc}%`;
      trainingActive = false;
    }
  }
  step();
}

function parseHiddenLayers(str) {
  if (!str) return [16,16];
  const parts = str.split(/[,\s]+/);
  const layers = [];
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (!isNaN(n) && n > 0 && n <= 512) layers.push(n);
    if (layers.length >= 8) break; // cap depth
  }
  return layers.length ? layers : [16,16];
}

function stopTraining() {
  if (!trainingActive && !mlpModel) return; // nothing to stop
  trainingActive = false;
  mlpModel = null;
  // remove predictions
  currentPoints.forEach(p => { delete p.pred; });
  document.getElementById('trainStatus').textContent = 'Idle';
  draw(currentPoints);
}
  document.getElementById('stopBtn').addEventListener('click', stopTraining);
