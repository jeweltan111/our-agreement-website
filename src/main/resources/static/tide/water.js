(() => {
    const intro = document.getElementById('screen-intro');
    const world = document.querySelector('.tide-world');
    const arrival = document.querySelector('.tide-arrival');
    const canvas = document.querySelector('.tide-water');
    const star = document.getElementById('startBtn');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const context = canvas.getContext('2d', { alpha: false });
    const shore = new Image();
    const interval = 3.15;
    const approachDuration = 10.4;
    const tau = Math.PI * 2;
    let startTime = performance.now();
    let frame;
    let lastPaint = -Infinity;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    function smooth(start, end, value) {
        const p = clamp((value - start) / (end - start));
        return p * p * (3 - 2 * p);
    }

    function paintBottle(time) {
        const emergence = smooth(.55, 3.15, time);
        // Successive crests lift the glass, carry it forward, then pass underneath it.
        const progress = .18 * smooth(1.2, 3.65, time)
            + .32 * smooth(3.65, 6.25, time)
            + .35 * smooth(6.25, 8.7, time)
            + .15 * smooth(8.7, approachDuration, time);
        const swell = Math.sin((time - .9) * tau / interval);
        const floatAmount = emergence * (1 - .8 * smooth(8.8, approachDuration, time));
        const shortScreen = innerWidth <= 620;
        const travelX = Math.min(innerWidth * (shortScreen ? .30 : .37), 590);
        const travelY = Math.min(innerHeight * (shortScreen ? .31 : .25), 255);
        const x = (progress - 1) * travelX + swell * 16 * floatAmount;
        const y = (progress - 1) * travelY + (1 - emergence) * 19 - swell * 22 * floatAmount;
        arrival.toggleAttribute('data-drifting', time < approachDuration && intro.classList.contains('active'));
        arrival.style.setProperty('--drift-x', `${x}px`);
        arrival.style.setProperty('--drift-y', `${y}px`);
        arrival.style.setProperty('--drift-scale', `${.23 + .77 * progress}`);
        arrival.style.setProperty('--drift-angle', `${-5 - 25 * (1 - emergence) + swell * 14 * floatAmount}deg`);
        arrival.style.setProperty('--bottle-opacity', smooth(.2, 1.3, time));
        arrival.style.setProperty('--waterline', `${22 + 83 * emergence - swell * 11 * floatAmount}%`);
    }

    const pigment = new Image();
    const waveLayer = document.createElement('canvas');
    const waveContext = waveLayer.getContext('2d');
    const alongSteps = 23;
    const profile = [0, .27, .46, .59, .77, 1];
    const lifetime = 8.7;

    function coastline(v) {
        return .83 - .33 * v - .20 * v * v;
    }

    // Affine-map one texture triangle to its projected 3D face.
    function drawFace(target, art, texture, points) {
        const [[u0, v0], [u1, v1], [u2, v2]] = texture;
        const [[x0, y0], [x1, y1], [x2, y2]] = points;
        const du1 = u1 - u0, du2 = u2 - u0, dv1 = v1 - v0, dv2 = v2 - v0;
        const area = du1 * dv2 - du2 * dv1;
        const a = ((x1 - x0) * dv2 - (x2 - x0) * dv1) / area;
        const b = ((y1 - y0) * dv2 - (y2 - y0) * dv1) / area;
        const c = (du1 * (x2 - x0) - du2 * (x1 - x0)) / area;
        const d = (du1 * (y2 - y0) - du2 * (y1 - y0)) / area;
        const centerX = (x0 + x1 + x2) / 3;
        const centerY = (y0 + y1 + y2) / 3;
        target.save();
        target.beginPath();
        points.forEach(([x, y], index) => {
            const expansion = 1 / Math.max(1, Math.hypot(x - centerX, y - centerY));
            const px = x + (x - centerX) * expansion;
            const py = y + (y - centerY) * expansion;
            if (index === 0) target.moveTo(px, py);
            else target.lineTo(px, py);
        });
        target.closePath();
        target.clip();
        target.setTransform(a, b, c, d, x0 - a * u0 - c * v0, y0 - b * u0 - d * v0);
        const left = Math.max(0, Math.floor(Math.min(u0, u1, u2)) - 2);
        const top = Math.max(0, Math.floor(Math.min(v0, v1, v2)) - 2);
        const right = Math.min(art.width, Math.ceil(Math.max(u0, u1, u2)) + 2);
        const bottom = Math.min(art.height, Math.ceil(Math.max(v0, v1, v2)) + 2);
        target.drawImage(art, left, top, right - left, bottom - top, left, top, right - left, bottom - top);
        target.restore();
    }

    function waveVariation(index, offset) {
        const value = Math.sin(index * 53.183 + offset * 19.319) * 43758.5453;
        return value - Math.floor(value);
    }

    function paintWave(index, age, project, width, height) {
        const p = age / lifetime;
        const length = .72 + waveVariation(index, 1) * .31;
        const reach = .39 + waveVariation(index, 2) * .036;
        const breakStart = .54 + waveVariation(index, 3) * .11;
        const breakOver = smooth(breakStart, breakStart + .23, p);
        const drain = smooth(.75 + waveVariation(index, 4) * .065, 1, p);
        const strength = smooth(.04, .26, p) * (1 - drain);
        if (strength < .01) return;

        const heading = waveVariation(index, 5) * tau;
        const heightOfCrest = .045 + waveVariation(index, 6) * .056;
        const spanStart = .58 - length / 2 + .06 * Math.sin(heading);
        const bendCount = 1 + Math.floor(waveVariation(index, 7) * 2);
        const shapeBias = waveVariation(index, 8) * 2 - 1;
        const mesh = [];
        for (let i = 0; i <= alongSteps; i++) {
            const s = i / alongSteps;
            const v = spanStart + s * length;
            const taper = smooth(0, .21, s) * (1 - smooth(.79, 1, s));
            const bunch = Math.sin(s * bendCount * Math.PI + heading + p * 3.6);
            const finger = Math.sin(s * 22 + heading - p * 6);
            const sectionAge = p + .075 * bunch + .012 * finger + (s - .5) * shapeBias * .14;
            const build = smooth(.06, .5, sectionAge);
            const collapse = smooth(breakStart, breakStart + .19, sectionAge);
            const advance = -.37 + reach * smooth(0, .81, sectionAge) - .078 * drain;
            const depth = (.081 + .072 * build + .040 * collapse) * (.59 + .41 * taper);
            const shape = .032 * bunch * taper + .006 * finger + .023 * shapeBias * (s - .5);
            const peak = .41 + .063 * bunch + .145 * collapse;
            mesh.push(profile.map(t => {
                const shoulder = t < peak ? .24 : .11 + collapse * .18;
                const crest = Math.exp(-(((t - peak) / shoulder) ** 2));
                const z = crest * heightOfCrest * build * (1 - .96 * collapse)
                    * (.44 + .56 * taper) * (1 + .19 * finger);
                return project(coastline(v) + advance + shape + (t - .5) * depth + z * .28,
                    v + (t - .5) * (.033 + .045 * build), z);
            }));
        }

        waveContext.clearRect(0, 0, width, height);
        const reverse = waveVariation(index, 9) > .5;
        const cropStart = waveVariation(index, 10) * .13;
        const cropEnd = .87 + waveVariation(index, 11) * .13;
        const textureX = step => {
            const t = reverse ? 1 - step / alongSteps : step / alongSteps;
            return (cropStart + (cropEnd - cropStart) * t) * pigment.width;
        };
        for (let i = 0; i < alongSteps; i++) {
            const u0 = textureX(i), u1 = textureX(i + 1);
            for (let j = 0; j < profile.length - 1; j++) {
                const v0 = profile[j] * pigment.height, v1 = profile[j + 1] * pigment.height;
                const a = mesh[i][j], b = mesh[i + 1][j], c = mesh[i][j + 1], d = mesh[i + 1][j + 1];
                drawFace(waveContext, pigment, [[u0, v0], [u1, v0], [u0, v1]], [a, b, c]);
                drawFace(waveContext, pigment, [[u1, v0], [u1, v1], [u0, v1]], [b, d, c]);
            }
        }
        // A breaking section loses its foam sooner than the rest of the crest.
        const fade = waveContext.createLinearGradient(0, project(0, spanStart - .025, 0)[1],
            0, project(0, spanStart + length + .04, 0)[1]);
        fade.addColorStop(0, 'transparent');
        for (let section = 1; section < 10; section++) {
            const s = section / 10;
            const weak = .5 + .5 * Math.sin(s * (bendCount + 1) * tau + heading + p * 4);
            const opacity = smooth(.02, .16, s) * (1 - smooth(.84, .98, s))
                * (1 - breakOver * weak ** 3 * .78);
            fade.addColorStop(s, `rgba(0,0,0,${opacity})`);
        }
        fade.addColorStop(1, 'transparent');
        waveContext.save();
        waveContext.globalCompositeOperation = 'destination-in';
        waveContext.fillStyle = fade;
        waveContext.fillRect(0, 0, width, height);
        waveContext.restore();
        context.globalAlpha = strength * (.91 - .18 * breakOver);
        context.drawImage(waveLayer, 0, 0);
        context.globalAlpha = 1;
    }

    // Resample the entire wet region every frame. The long swell, the shorter
    // chop and the sideways current run at different speeds, including offshore.
    function paintWaterSurface(time, width, height, scale, left, top) {
        const imageWidth = shore.width * scale;
        const imageHeight = shore.height * scale;
        const columns = 30;
        const rows = Math.max(17, Math.round(columns * height / width));
        const longPhase = time * tau / interval;
        const crossPhase = time * 1.47;
        const chopPhase = time * 3.22;
        const vertices = [];
        for (let row = 0; row <= rows; row++) {
            const y = height * row / rows;
            const v = (y - top) / imageHeight;
            const shoreU = coastline(v);
            const cross = Math.sin(v * 8.6 - crossPhase);
            const bend = 1.42 * Math.sin(v * 7.8) + .35 * Math.sin(v * 19 + crossPhase);
            const band = [];
            for (let col = 0; col <= columns; col++) {
                const x = width * col / columns;
                const u = (x - left) / imageWidth;
                const distance = u - shoreU;
                const palm = smooth(.12, .34, v) + (1 - smooth(.57, .71, u)) * (1 - smooth(.12, .34, v));
                const wet = (1 - smooth(-.026, .028, distance)) * palm;
                const swell = longPhase - u * 26 + bend;
                const chop = chopPhase - u * 44 + v * 21;
                const surge = Math.sin(swell) * .018 + Math.sin(chop) * .004
                    + Math.sin(crossPhase - u * 15 - v * 9) * .008;
                const lift = Math.cos(swell - .34) * .008 + Math.sin(chop - .7) * .003 + cross * .003;
                const edgeX = smooth(0, width * .07, Math.min(x, width - x));
                const edgeY = smooth(0, height * .06, Math.min(y, height - y));
                band.push({
                    uv: [(x - left) / scale, (y - top) / scale],
                    point: [x + surge * imageWidth * wet * edgeX, y - lift * imageHeight * wet * edgeY],
                    wet
                });
            }
            vertices.push(band);
        }

        for (let row = 0; row < rows; row++) {
            const near = vertices[row], far = vertices[row + 1];
            for (let col = 0; col < columns; col++) {
                const a = near[col], b = near[col + 1], c = far[col], d = far[col + 1];
                if (a.wet + b.wet + c.wet + d.wet === 0) {
                    context.drawImage(shore, a.uv[0], a.uv[1], d.uv[0] - a.uv[0], d.uv[1] - a.uv[1],
                        a.point[0], a.point[1], d.point[0] - a.point[0], d.point[1] - a.point[1]);
                    continue;
                }
                drawFace(context, shore, [a.uv, b.uv, c.uv], [a.point, b.point, c.point]);
                drawFace(context, shore, [b.uv, d.uv, c.uv], [b.point, d.point, c.point]);
            }
        }
    }

    function paintSea(time) {
        if (!context || !shore.naturalWidth || time - lastPaint < .033) return;
        lastPaint = time;
        const width = Math.min(1080, canvas.clientWidth);
        const height = Math.max(1, Math.round(width * canvas.clientHeight / canvas.clientWidth));
        if (canvas.width !== width || canvas.height !== height || waveLayer.width !== width || waveLayer.height !== height) {
            canvas.width = waveLayer.width = width;
            canvas.height = waveLayer.height = height;
        }
        const scale = Math.max(width / shore.width, height / shore.height);
        const imageWidth = shore.width * scale;
        const imageHeight = shore.height * scale;
        const left = (width - imageWidth) / 2;
        const top = (height - imageHeight) / 2;
        paintWaterSurface(time, width, height, scale, left, top);

        if (pigment.naturalWidth) {
            const project = (x, y, z) => [
                left + imageWidth * x,
                top + imageHeight * (y - z)
            ];
            const newest = Math.floor(time / interval);
            for (let index = newest; index >= newest - Math.ceil(lifetime / interval); index--) {
                const age = time - index * interval;
                if (age < lifetime) paintWave(index, age, project, width, height);
            }
        }
        if (!canvas.hasAttribute('data-ready')) canvas.setAttribute('data-ready', '');
    }

    function tick(now) {
        frame = undefined;
        if (reducedMotion.matches) {
            canvas.removeAttribute('data-ready');
            paintBottle(approachDuration);
            return;
        }
        if (!world.clientWidth || document.hidden) return;
        const time = Math.max(0, (now - startTime) / 1000);
        paintSea(time);
        paintBottle(time);
        schedule();
    }
    function schedule() {
        if (frame === undefined) frame = requestAnimationFrame(tick);
    }
    function skipDrift() {
        if (performance.now() - startTime >= approachDuration * 1000) return;
        startTime = performance.now() - approachDuration * 1000;
        paintBottle(approachDuration);
    }

    star.addEventListener('focus', skipDrift);
    document.querySelector('.review-replay')?.addEventListener('click', () => {
        startTime = performance.now();
        lastPaint = -Infinity;
        schedule();
    });
    new MutationObserver(schedule).observe(intro, { attributes: true, attributeFilter: ['class'] });
    reducedMotion.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    shore.onload = schedule;
    shore.src = new URL('shore-calm.webp', document.currentScript.src);
    pigment.onload = schedule;
    pigment.src = new URL('tide-pigment.webp', document.currentScript.src);
    paintBottle(reducedMotion.matches ? approachDuration : 0);
    schedule();
})();
