/* Runs in the page (driver eval). For each entry, compares the art drawn
   through a candidate CSS filter with the picture area of the puzzle photo,
   and keeps the filter whose luminance spread (p10/p50/p90) and mean
   saturation come closest. Statistics ignore tile order, so a scrambled photo
   works as well as a solved one. Boxes are percentages of the photo:
   [left, top, right, bottom], measured by eye to exclude the frame, the
   logo button and any gap. */
(async () => {
  const boxes = {
    'cezanne-card-players': [19, 15, 80, 68],
    'cezanne-large-bathers': [21, 18, 84, 75],
    'monet-80-23215': [26, 19, 71, 70],
    'kandinsky-80-2341': [27, 35, 69, 66],
    'kandinsky-kreise-im-kreis': [11, 31, 68, 70],
    'renoir-boating-party': [13, 13, 81, 72],
    'renoir-1881': [16, 15, 85, 74],
    'renoir-1883': [15, 16, 84, 74],
    'renoir-1876': [19, 15, 85, 70],
    'cezanne-kitchen-table': [15, 14, 81, 70],
    'van-gogh-sunflowers': [12, 17, 86, 80],
    'macke-spaziergaenger-am-see': [9, 35, 66, 77],
  };
  const load = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
  const S = 160;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const stats = (data) => {
    const lum = []; let sat = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255, gg = data[i + 1] / 255, b = data[i + 2] / 255;
      lum.push(0.2126 * r + 0.7152 * gg + 0.0722 * b);
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      sat += mx - mn;
    }
    lum.sort((a, b) => a - b);
    const q = (p) => lum[Math.floor(p * (lum.length - 1))];
    return { p10: q(0.1), p50: q(0.5), p90: q(0.9), sat: sat / (data.length / 4) };
  };
  const draw = (img, sx, sy, sw, sh, filter) => {
    g.filter = filter; g.clearRect(0, 0, S, S);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, S, S);
    g.filter = 'none';
    return stats(g.getImageData(0, 0, S, S).data);
  };
  const css = (f) => `contrast(${f[0]}) saturate(${f[1]}) brightness(${f[2]})`;
  const loss = (a, t) => (a.p10 - t.p10) ** 2 + (a.p50 - t.p50) ** 2 + (a.p90 - t.p90) ** 2 + 2 * (a.sat - t.sat) ** 2;
  const range = (lo, hi, step) => { const out = []; for (let v = lo; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100); return out; };
  const out = {};
  for (const [id, [l, t, r, b]] of Object.entries(boxes)) {
    const photo = await load(`images/puzzles/${id}-front.jpg`);
    const art = await load(`images/art/${id}.jpg`);
    const W = photo.naturalWidth, H = photo.naturalHeight;
    const target = draw(photo, W * l / 100, H * t / 100, W * (r - l) / 100, H * (b - t) / 100, 'none');
    const fit = (f) => loss(draw(art, 0, 0, art.naturalWidth, art.naturalHeight, css(f)), target);
    let best = null, bestLoss = Infinity;
    for (const c of range(0.9, 1.6, 0.1)) for (const s of range(0.8, 2, 0.1)) for (const br of range(0.8, 1.2, 0.1)) {
      const e = fit([c, s, br]); if (e < bestLoss) { bestLoss = e; best = [c, s, br]; }
    }
    const [c0, s0, b0] = best;
    for (const c of range(c0 - 0.08, c0 + 0.08, 0.02)) for (const s of range(s0 - 0.08, s0 + 0.08, 0.02)) for (const br of range(b0 - 0.08, b0 + 0.08, 0.02)) {
      const e = fit([c, s, br]); if (e < bestLoss) { bestLoss = e; best = [c, s, br]; }
    }
    const round = (v) => Math.round(v * 20) / 20;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    best = [clamp(best[0], 0.9, 1.6), clamp(best[1], 0.8, 2), clamp(best[2], 0.8, 1.2)];
    const filter = { contrast: round(best[0]), saturate: round(best[1]), brightness: round(best[2]), hueRotate: 0 };
    const asDefault = fit([1.2, 1.3, 1]);
    out[id] = { filter, loss: +bestLoss.toFixed(5), defaultLoss: +asDefault.toFixed(5), target: Object.fromEntries(Object.entries(target).map(([k, v]) => [k, +v.toFixed(3)])) };
  }
  return out;
})()
