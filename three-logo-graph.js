import * as THREE from "three";
import { SVGLoader } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/loaders/SVGLoader.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/environments/RoomEnvironment.js";
import * as BufferGeometryUtils from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/utils/BufferGeometryUtils.js";

const canvas = document.getElementById("graph");
const hero = canvas && canvas.parentElement;
const logos = window.LOGOS || {};

if (canvas && hero && Object.keys(logos).length) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const keys = [
    "kotlin", "springboot", "typescript", "postgresql", "redis", "kubernetes",
    "argo", "docker", "amazonwebservices", "prometheus", "grafana",
    "githubactions", "nginx", "keycloak"
  ];
  const defs = keys.map((key) => {
    const logo = logos[key];
    if (!logo || !logo.paths || !logo.paths[0]) return null;
    return { key, path: logo.paths[0], color: logo.color || logo.brand || "#5eead4" };
  }).filter(Boolean);

  canvas.setAttribute("aria-label", "기술 스택 공식 로고로 구성된 3D 노드 그래프");
  canvas.setAttribute("aria-roledescription", "3D technology stack graph");
  canvas.tabIndex = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(0, 0, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnvironment, .04).texture;
  roomEnvironment.dispose();
  pmremGenerator.dispose();

  const composer = new EffectComposer(renderer);
  const composerSamples = Math.min(4, renderer.capabilities.maxSamples || 0);
  if (composerSamples > 0) {
    composer.renderTarget1.samples = composerSamples;
    composer.renderTarget2.samples = composerSamples;
  }
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), .08, .34, .68);
  bloomPass.threshold = .68;
  bloomPass.strength = .08;
  bloomPass.radius = .34;
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  scene.environmentIntensity = .46;
  scene.add(new THREE.HemisphereLight(0xb9fff0, 0x050709, .62));
  scene.add(new THREE.AmbientLight(0x86e8dc, .06));
  const keyLight = new THREE.DirectionalLight(0xf1fffb, 1.55);
  keyLight.position.set(-4, 7, 10);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xff8157, .48);
  rimLight.position.set(5, -4, -6);
  scene.add(rimLight);
  const cyanLight = new THREE.PointLight(0x48e8cc, 3.2, 14, 2);
  cyanLight.position.set(5, 2, 5);
  scene.add(cyanLight);
  const amberLight = new THREE.PointLight(0xff7d4d, 1.7, 13, 2);
  amberLight.position.set(-4, -4, 4);
  scene.add(amberLight);

  const graph = new THREE.Group();
  const edgeLayer = new THREE.Group();
  const logoLayer = new THREE.Group();
  graph.add(edgeLayer);
  graph.add(logoLayer);
  graph.rotation.set(-.08, -.56, 0);
  scene.add(graph);

  const layout = [
    [-2.72, 2.20, .22], [-1.72, 2.72, 1.10], [-.34, 2.46, -.34], [1.18, 2.08, .72],
    [-2.76, .72, -1.02], [-1.35, .92, .82], [.05, .74, .28], [1.66, .52, 1.04],
    [-2.20, -.78, .66], [-.76, -1.12, -.88], [.76, -.92, .48], [2.22, -.72, -.42],
    [-1.18, -2.26, .18], [.62, -2.18, .70]
  ];
  const linkKeys = [
    ["kotlin", "springboot"], ["springboot", "postgresql"], ["springboot", "redis"],
    ["springboot", "kubernetes"], ["typescript", "postgresql"], ["typescript", "docker"],
    ["postgresql", "redis"], ["kubernetes", "argo"], ["kubernetes", "docker"],
    ["argo", "githubactions"], ["docker", "amazonwebservices"], ["amazonwebservices", "nginx"],
    ["prometheus", "grafana"], ["kubernetes", "prometheus"], ["keycloak", "springboot"],
    ["keycloak", "typescript"], ["githubactions", "nginx"]
  ];

  const nodes = [];
  const logoMeshes = [];
  const nodeByKey = new Map();
  const svgLoader = new SVGLoader();
  const hex = (value) => parseInt(String(value).replace("#", ""), 16) || 0x5eead4;
  const darken = (value, amount) => new THREE.Color(value).multiplyScalar(amount);
  const pose = [
    [-.18, -.48, .018], [.12, .44, -.024], [-.10, .54, .014], [.16, -.46, -.018],
    [.18, .62, .022], [-.16, -.44, -.020], [.12, .56, .016], [-.12, -.58, -.014],
    [.20, .48, .018], [-.18, -.64, -.022], [.14, .58, .014], [-.16, -.46, -.018],
    [.18, .60, .022], [-.12, -.52, -.012]
  ];

  function createLogo(def, index) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="' + def.path + '" fill="' + def.color + '"/></svg>';
    const parsed = svgLoader.parse(svg);
    const root = new THREE.Group();
    const brand = new THREE.Color(def.color);
    const front = new THREE.MeshPhysicalMaterial({
      color: brand,
      emissive: brand.clone().multiplyScalar(.04),
      emissiveIntensity: .12,
      metalness: .24,
      roughness: .28,
      clearcoat: .74,
      clearcoatRoughness: .14,
      specularIntensity: .86,
      envMapIntensity: .48,
      sheen: .12,
      sheenColor: brand.clone().lerp(new THREE.Color(0xffffff), .32),
      side: THREE.DoubleSide
    });
    const side = new THREE.MeshPhysicalMaterial({
      color: darken(def.color, .3),
      emissive: brand.clone().multiplyScalar(.015),
      emissiveIntensity: .04,
      metalness: .82,
      roughness: .34,
      clearcoat: .34,
      clearcoatRoughness: .24,
      envMapIntensity: .56,
      side: THREE.DoubleSide
    });
    const face = new THREE.MeshPhysicalMaterial({
      color: brand,
      emissive: brand.clone().multiplyScalar(.025),
      emissiveIntensity: .08,
      metalness: .12,
      roughness: .24,
      clearcoat: .92,
      clearcoatRoughness: .1,
      specularIntensity: 1,
      envMapIntensity: .42,
      sheen: .18,
      sheenColor: brand.clone().lerp(new THREE.Color(0xffffff), .22),
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.DoubleSide
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: brand.clone().lerp(new THREE.Color(0xffffff), .16),
      transparent: true,
      opacity: .24,
      depthWrite: false
    });

    parsed.paths.forEach((path) => {
      const shapes = typeof path.toShapes === "function" ? path.toShapes() : SVGLoader.createShapes(path);
      shapes.forEach((shape) => {
        const depth = 6.2;
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth,
          steps: 6,
          curveSegments: 48,
          bevelEnabled: true,
          bevelThickness: .42,
          bevelSize: .24,
          bevelSegments: 9
        });
        geometry.translate(0, 0, -depth / 2);
        const creasedGeometry = BufferGeometryUtils.toCreasedNormals(geometry, THREE.MathUtils.degToRad(58));
        creasedGeometry.computeVertexNormals();
        creasedGeometry.computeBoundingBox();
        const mesh = new THREE.Mesh(creasedGeometry, [front, side]);
        mesh.userData.nodeIndex = index;
        mesh.renderOrder = 1;
        root.add(mesh);
        logoMeshes.push(mesh);

        const capGeometry = new THREE.ShapeGeometry(shape, 48);
        capGeometry.translate(0, 0, depth / 2 + .035);
        capGeometry.computeVertexNormals();
        const cap = new THREE.Mesh(capGeometry, face);
        cap.userData.nodeIndex = index;
        cap.renderOrder = 2;
        root.add(cap);
        logoMeshes.push(cap);

        const outline = new THREE.LineSegments(new THREE.EdgesGeometry(creasedGeometry, 36), edgeMaterial);
        outline.renderOrder = 3;
        root.add(outline);
      });
    });

    const bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const fit = .94 / Math.max(size.x, size.y);
    root.position.sub(center);
    root.scale.set(fit, -fit, fit);
    root.rotation.set(...pose[index % pose.length]);
    root.userData.front = front;
    root.userData.face = face;
    root.userData.edge = edgeMaterial;
    return root;
  }

  defs.forEach((def, index) => {
    const root = createLogo(def, index);
    const [x, y, z] = layout[index % layout.length];
    root.position.set(x, y, z);
    const node = {
      index,
      key: def.key,
      root,
      base: new THREE.Vector3(x, y, z),
      baseScale: Math.abs(root.scale.x),
      phase: index * .73,
      baseRotation: root.rotation.clone(),
      targetScale: 1
    };
    root.userData.node = node;
    logoLayer.add(root);
    nodes.push(node);
    nodeByKey.set(def.key, node);
  });

  const edges = linkKeys.map((pair, index) => {
    const a = nodeByKey.get(pair[0]);
    const b = nodeByKey.get(pair[1]);
    if (!a || !b) return null;
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(logos[pair[0]].color || a.root.userData.front.color).lerp(
        new THREE.Color(logos[pair[1]].color || b.root.userData.front.color), .5
      ),
      transparent: true,
      opacity: .16
    });
    const line = new THREE.Line(new THREE.BufferGeometry(), material);
    edgeLayer.add(line);
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xc8fff4, transparent: true, opacity: .9 })
    );
    edgeLayer.add(pulse);
    return { a: a.index, b: b.index, line, pulse, t: (index * .17) % 1, bow: index % 2 ? -.32 : .32 };
  }).filter(Boolean);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-10, -10);
  let pointerInside = false;
  let hovered = -1;
  let focused = -1;
  let lastTime = performance.now();
  let frame = 0;
  let running = false;
  let spinY = -.56;

  function pointFor(node, now) {
    const point = node.base.clone();
    if (!reduce) {
      point.y += Math.sin(now * .00065 + node.phase) * .055;
      point.z += Math.cos(now * .0005 + node.phase) * .035;
    }
    return point;
  }
  function hitTest() {
    if (!pointerInside) return -1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(logoMeshes, false);
    return hits.length ? (hits[0].object.userData.nodeIndex ?? -1) : -1;
  }
  function updateEdges(active, now, dt) {
    edges.forEach((edge) => {
      const a = pointFor(nodes[edge.a], now);
      const b = pointFor(nodes[edge.b], now);
      const control = a.clone().lerp(b, .5);
      control.z += edge.bow;
      control.y += edge.bow * .22;
      const curve = new THREE.QuadraticBezierCurve3(a, control, b);
      edge.line.geometry.dispose();
      edge.line.geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
      const connected = active >= 0 && (edge.a === active || edge.b === active);
      edge.line.material.opacity = active >= 0 ? (connected ? .72 : .025) : .22;
      if (!reduce) {
        edge.t += dt * (connected ? .42 : .18);
        if (edge.t > 1) edge.t = 0;
      }
      edge.pulse.position.copy(curve.getPoint(edge.t));
      edge.pulse.material.opacity = active >= 0 ? (connected ? .95 : .04) : .7;
      edge.pulse.scale.setScalar(connected ? 1.35 : 1);
    });
  }
  function updateNodeEmphasis(active, dt) {
    nodes.forEach((node) => {
      const connected = active >= 0 && (
        node.index === active ||
        edges.some((edge) => (edge.a === active && edge.b === node.index) || (edge.b === active && edge.a === node.index))
      );
      node.targetScale = active < 0 ? 1 : node.index === active ? 1.14 : connected ? 1.03 : .88;
      const magnitude = THREE.MathUtils.damp(
        Math.abs(node.root.scale.x),
        node.baseScale * node.targetScale,
        10,
        dt
      );
      node.root.scale.set(magnitude, -magnitude, magnitude);
      const emissive = active < 0 ? .08 : node.index === active ? .32 : connected ? .16 : .018;
      node.root.userData.front.emissiveIntensity = emissive;
      node.root.userData.face.emissiveIntensity = emissive * .72;
      node.root.userData.edge.opacity = active < 0 ? .32 : node.index === active ? .72 : connected ? .48 : .05;
    });
  }
  function resize() {
    const rect = hero.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const desktop = width > 900;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, desktop ? 2.25 : 1.75);
    renderer.setPixelRatio(pixelRatio);
    composer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = desktop ? 36 : 43;
    camera.position.z = desktop ? 12 : 12.8;
    camera.updateProjectionMatrix();
    graph.position.x = desktop ? (width / height) * 2.02 : 0;
    graph.position.y = desktop ? .08 : -.58;
    graph.scale.setScalar(desktop ? .84 : .74);
  }
  function render(now) {
    const dt = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
    lastTime = now;
    if (!reduce) {
      spinY += dt * .055;
      const desiredY = spinY + (pointerInside ? pointer.x * .08 : 0);
      graph.rotation.y += (desiredY - graph.rotation.y) * Math.min(1, dt * 2.8);
      graph.rotation.x += ((pointerInside ? pointer.y * .055 : 0) - graph.rotation.x) * Math.min(1, dt * 2.8);
    }
    nodes.forEach((node) => {
      const point = pointFor(node, now);
      node.root.position.y = point.y;
      node.root.position.z = point.z;
      if (!reduce) {
        node.root.rotation.x = node.baseRotation.x + Math.sin(now * .00042 + node.phase) * .016;
        node.root.rotation.y = node.baseRotation.y + Math.cos(now * .00036 + node.phase) * .022;
        node.root.rotation.z = node.baseRotation.z + Math.sin(now * .00031 + node.phase) * .010;
      }
    });
    hovered = hitTest();
    const active = hovered >= 0 ? hovered : focused;
    hero.style.cursor = hovered >= 0 ? "pointer" : "";
    updateNodeEmphasis(active, dt);
    updateEdges(active, now, dt);
    composer.render();
    if (running) frame = requestAnimationFrame(render);
  }
  function start() {
    if (running || reduce) return;
    running = true;
    lastTime = performance.now();
    frame = requestAnimationFrame(render);
  }
  function stop() {
    running = false;
    if (frame) cancelAnimationFrame(frame);
  }
  function localPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  hero.addEventListener("pointermove", (event) => {
    localPointer(event);
    pointerInside = true;
    if (reduce) render(performance.now());
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointerInside = false;
    pointer.set(-10, -10);
    if (reduce) render(performance.now());
  });
  hero.addEventListener("pointerdown", (event) => {
    localPointer(event);
    pointerInside = true;
    const picked = hitTest();
    if (picked >= 0) {
      focused = picked;
      canvas.focus({ preventScroll: true });
      if (reduce) render(performance.now());
    }
  }, { passive: true });
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      if (focused < 0) focused = 0;
    } else {
      const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      focused = (focused < 0 ? 0 : focused + step + nodes.length) % nodes.length;
    }
    if (reduce) render(performance.now());
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("resize", resize, { passive: true });

  resize();
  render(performance.now());
  start();
}
