/* Azzam / Liquid Glass — live contour sphere (raw WebGL, no dependencies).
   Contour lines of a 3D simplex-noise field evaluated on a lit sphere.
   Exposes window.AzzamOrb; if WebGL is unavailable the static SVG stays visible. */
(() => {
  'use strict';
  const stage = document.querySelector('.orb-stage');
  const canvas = document.querySelector('.orb-canvas');
  const fail = () => { window.AzzamOrb = {ok: false}; };
  if (!stage || !canvas) return fail();

  const opts = {alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power'};
  const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return fail();

  const VERT = `attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;
  const FRAG = `#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uTime, uBands, uFreq, uSeed, uPulse, uDpr, uDark, uLineW;
uniform vec2 uRot;
uniform vec3 uBase, uShade, uLine, uGlow;

// 3D simplex noise — Ian McEwan / Stefan Gustavson (MIT)
vec3 mod289(vec3 x){return x - floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x - floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - .85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1./6., 1./3.); const vec4 D = vec4(0., .5, 1., 2.);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1. - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0., i1.z, i2.z, 1.)) + i.y + vec4(0., i1.y, i2.y, 1.)) + i.x + vec4(0., i1.x, i2.x, 1.));
  float n_ = .142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49. * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7. * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1. - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2. + 1.; vec4 s1 = floor(b1)*2. + 1.; vec4 sh = -step(h, vec4(0.));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.); m = m*m;
  return 42. * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

void main(){
  vec2 p = vUv * 2. - 1.;
  float r = length(p);
  float px = 2. / uRes.x;                       // one device pixel in uv units
  float mask = 1. - smoothstep(1. - 1.6*px, 1., r);
  if (mask <= 0.) { gl_FragColor = vec4(0.); return; }

  float z = sqrt(max(0., 1. - r*r));
  vec3 n = vec3(p, z);
  vec3 q = rotY(uRot.x) * rotX(uRot.y) * n;

  vec3 sp = q * uFreq + vec3(uSeed, uSeed * .61, uTime * .055);
  float f = snoise(sp) * .82 + snoise(sp * 1.93 + 4.13) * .18;
  f += uPulse * .22 * sin(q.y * 8. + q.x * 3. - (1. - uPulse) * 9.);

  // Contour lines with constant on-screen width; fade to average coverage where they crowd at the rim.
  float v = f * uBands;
  float fw = max(fwidth(v), 1e-4);
  float d = abs(fract(v + .5) - .5) / fw;
  float w = uLineW * uDpr;
  float line = 1. - smoothstep(w - .7, w + .7, d);
  float crowd = smoothstep(.22, .55, fw);
  line = mix(line, min(1., 2. * w * fw) * .9, crowd);

  // Soft studio lighting
  vec3 L = normalize(vec3(-.45, .55, .72));
  float diff = clamp(dot(n, L), 0., 1.);
  float rim = pow(1. - z, 2.4);
  vec3 base = mix(uShade, uBase, .38 + .62 * diff);
  base = mix(base, uShade, rim * .5);
  base += uGlow * pow(clamp(dot(n, normalize(vec3(.55, -.6, .45))), 0., 1.), 3.) * .45;
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0., 0., 1.)), 0., 1.), 28.) * (.38 - uDark * .2);

  vec3 lineCol = uLine * (.82 + .18 * diff) + uGlow * rim * .25 * uDark;
  vec3 col = mix(base, lineCol, line * (.95 - .3 * spec));
  col += spec;
  col += uGlow * rim * .18 * uDark;              // atmospheric edge in dark mode
  gl_FragColor = vec4(col * mask, mask);
}`;

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return fail();
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fail();
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uRes', 'uTime', 'uBands', 'uFreq', 'uSeed', 'uPulse', 'uDpr', 'uDark', 'uLineW', 'uRot', 'uBase', 'uShade', 'uLine', 'uGlow']
    .forEach(name => { U[name] = gl.getUniformLocation(prog, name); });

  // Each project gets its own landscape: orientation, density and noise region.
  const PROJECTS = [
    {yaw: 0.0, pitch: 0.10, bands: 13, freq: 0.78, seed: 0.0},
    {yaw: 0.95, pitch: -0.18, bands: 16, freq: 0.92, seed: 3.2},
    {yaw: -0.8, pitch: 0.28, bands: 12, freq: 0.70, seed: 7.4},
    {yaw: 1.75, pitch: 0.05, bands: 15, freq: 0.86, seed: 11.1},
    {yaw: -1.55, pitch: -0.25, bands: 11, freq: 0.66, seed: 15.8},
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const target = Object.assign({}, PROJECTS[0]);
  const cur = Object.assign({}, PROJECTS[0]);
  const pointer = {x: 0, y: 0, cx: 0, cy: 0};
  let time = 0, pulse = 0, last = 0, raf = 0, active = false, colors = null, dpr = 1;

  const hex = value => {
    const m = /#([0-9a-f]{6})/i.exec(value || '');
    if (!m) return [0, 0, 0];
    const n = parseInt(m[1], 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  };
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    colors = {
      base: hex(cs.getPropertyValue('--orb-base')), shade: hex(cs.getPropertyValue('--orb-shade')),
      line: hex(cs.getPropertyValue('--orb-line')), glow: hex(cs.getPropertyValue('--orb-glow')),
      dark: parseFloat(cs.getPropertyValue('--orb-dark')) || 0,
    };
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.round(Math.min(canvas.clientWidth * dpr, 1500)));
    if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw() {
    if (!colors) readTheme();
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uBands, cur.bands); gl.uniform1f(U.uFreq, cur.freq); gl.uniform1f(U.uSeed, cur.seed);
    gl.uniform1f(U.uPulse, pulse); gl.uniform1f(U.uDpr, canvas.width / Math.max(1, canvas.clientWidth));
    gl.uniform1f(U.uDark, colors.dark); gl.uniform1f(U.uLineW, colors.dark ? 0.85 : 1.05);
    gl.uniform2f(U.uRot, cur.yaw + pointer.cx * 0.38 + time * 0.035, cur.pitch - pointer.cy * 0.26);
    gl.uniform3fv(U.uBase, colors.base); gl.uniform3fv(U.uShade, colors.shade);
    gl.uniform3fv(U.uLine, colors.line); gl.uniform3fv(U.uGlow, colors.glow);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function step(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    const k = 1 - Math.exp(-dt * 2.4), kp = 1 - Math.exp(-dt * 3.5);
    for (const key of ['yaw', 'pitch', 'bands', 'freq', 'seed']) cur[key] += (target[key] - cur[key]) * k;
    pointer.cx += (pointer.x - pointer.cx) * kp; pointer.cy += (pointer.y - pointer.cy) * kp;
    pulse *= Math.exp(-dt * 1.5);
    time += dt;
    draw();
    if (active) raf = requestAnimationFrame(step);
  }
  function snap() { Object.assign(cur, target); pulse = 0; pointer.cx = pointer.x = 0; pointer.cy = pointer.y = 0; }
  function kick() { if (active && !raf) { last = 0; raf = requestAnimationFrame(step); } }

  const api = {
    ok: true,
    setProject(i) {
      Object.assign(target, PROJECTS[i % PROJECTS.length]);
      if (reduced.matches || !active) { snap(); draw(); } else { pulse = 1; kick(); }
    },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    setActive(on) {
      const next = on && !reduced.matches;
      if (next === active) return;
      active = next;
      if (active) kick(); else { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; draw(); }
    },
    refreshTheme() { readTheme(); if (!active) draw(); },
  };

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); active = false; stage.classList.remove('orb-live');
  });
  canvas.addEventListener('webglcontextrestored', () => window.location.reload());
  if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); if (!active) draw(); }).observe(canvas);
  resize(); readTheme(); draw();
  stage.classList.add('orb-live');
  window.AzzamOrb = api;
})();
