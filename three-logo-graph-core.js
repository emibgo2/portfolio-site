import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js";
import { SVGLoader } from "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/loaders/SVGLoader.js";
import { createScatterLayout, getQualityProfile } from "./graph-geometry.mjs";

const GRAPH_KEYS = [
  "kotlin", "springboot", "typescript", "postgresql", "redis", "kubernetes",
  "argo", "docker", "amazonwebservices", "prometheus", "grafana",
  "githubactions", "nginx", "keycloak"
];

function makeGlowTexture() {
  const size = 96;
  const glow = document.createElement("canvas");
  glow.width = size;
  glow.height = size;
  const context = glow.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(222,255,249,1)");
  gradient.addColorStop(.12, "rgba(94,234,212,.88)");
  gradient.addColorStop(.36, "rgba(0,183,255,.27)");
  gradient.addColorStop(1, "rgba(0,73,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(glow);
}

function makeLogo(definition, index, profile, loader, logoMeshes) {
  const parsed = loader.parse(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${definition.path}" /></svg>`
  );
  const root = new THREE.Group();
  const brand = new THREE.Color(definition.color);
  const displayBrand = brand.clone().lerp(new THREE.Color("#ffffff"), .18);
  const front = new THREE.MeshStandardMaterial({
    color: displayBrand,
    emissive: displayBrand,
    emissiveIntensity: .56,
    metalness: .3,
    roughness: .3,
    side: THREE.DoubleSide
  });
  const side = new THREE.MeshStandardMaterial({
    color: brand.clone().lerp(new THREE.Color("#ffffff"), .08).multiplyScalar(.62),
    emissive: displayBrand.clone().multiplyScalar(.22),
    emissiveIntensity: .28,
    metalness: .58,
    roughness: .38,
    side: THREE.DoubleSide
  });

  parsed.paths.forEach((path) => {
    const shapes = typeof path.toShapes === "function" ? path.toShapes(true) : SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: profile.logoDepth,
        steps: 1,
        curveSegments: profile.curveSegments,
        bevelEnabled: true,
        bevelThickness: .16,
        bevelSize: .11,
        bevelSegments: 3
      });
      geometry.translate(0, 0, -profile.logoDepth / 2);
      const mesh = new THREE.Mesh(geometry, [front, side]);
      mesh.userData.nodeIndex = index;
      mesh.renderOrder = 2;
      root.add(mesh);
      logoMeshes.push(mesh);
    });
  });

  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const fit = .62 / Math.max(size.x, size.y, .01);
  root.children.forEach((child) => child.geometry?.translate(-center.x, -center.y, -center.z));
  root.position.set(0, 0, 0);
  root.scale.set(fit, -fit, fit);
  root.rotation.set(
    (index % 2 ? 1 : -1) * (.36 + (index % 3) * .1),
    (index % 3 - 1) * .34,
    (index % 4 - 1.5) * .09
  );
  root.userData.front = front;
  root.userData.side = side;
  root.userData.nodeIndex = index;
  root.userData.baseRotation = root.rotation.clone();
  return root;
}

export function mountGraph(canvas, hero) {
  const logos = window.LOGOS || {};
  const definitions = GRAPH_KEYS.map((key) => {
    const logo = logos[key];
    return logo?.paths?.[0]
      ? { key, label: logo.label || key, path: logo.paths[0], color: logo.color || "#5eead4" }
      : null;
  }).filter(Boolean);
  if (!definitions.length) return;

  canvas.setAttribute("aria-label", "기술 스택 공식 로고가 흩어져 있는 3D 기술 그래프");
  canvas.setAttribute("aria-roledescription", "3D technology stack graph");
  canvas.tabIndex = 0;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(41, 1, .1, 100);
  camera.position.set(0, 0, 8.6);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !matchMedia("(max-width: 760px)").matches,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const ambient = new THREE.HemisphereLight(0x8effed, 0x07111d, .95);
  const keyLight = new THREE.DirectionalLight(0xd9fff9, 1.8);
  keyLight.position.set(-3, 4, 7);
  const rimLight = new THREE.PointLight(0x2d8cff, 3.2, 12, 2);
  rimLight.position.set(-3, -2, 4);
  scene.add(ambient, keyLight, rimLight);

  const graph = new THREE.Group();
  const haloLayer = new THREE.Group();
  const logoLayer = new THREE.Group();
  graph.add(haloLayer, logoLayer);
  scene.add(graph);

  const logoMeshes = [];
  const loader = new SVGLoader();
  const profileFor = () => getQualityProfile(
    hero.getBoundingClientRect().width,
    hero.getBoundingClientRect().height,
    window.devicePixelRatio || 1
  );
  let profile = profileFor();
  const layout = createScatterLayout(Math.min(profile.nodeCount, definitions.length));
  const nodes = definitions.slice(0, layout.length).map((definition, index) => ({
    ...definition,
    index,
    layout: layout[index],
    root: makeLogo(definition, index, profile, loader, logoMeshes),
    phase: index * .57,
    active: false
  }));
  const positionFor = (node, now = 0) => {
    const { x, y, z } = node.layout;
    const layoutScale = profile.mobile ? .58 : 1;
    const float = reduced.matches ? 0 : Math.sin(now * .0007 + node.phase) * .035;
    return new THREE.Vector3(
      x * layoutScale,
      y * layoutScale + float,
      z + Math.cos(now * .00055 + node.phase) * .025
    );
  };

  const glowTexture = makeGlowTexture();
  nodes.forEach((node) => {
    const position = positionFor(node);
    node.root.position.copy(position);
    logoLayer.add(node.root);
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      color: new THREE.Color(node.color),
      transparent: true,
      opacity: profile.haloOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    aura.scale.setScalar(.72);
    aura.position.copy(position);
    aura.renderOrder = 1;
    haloLayer.add(aura);
    node.aura = aura;
  });

  const label = document.getElementById("graphLabel");
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-10, -10);
  let hovered = -1;
  let focused = -1;
  let pointerInside = false;
  let running = false;
  let visible = true;
  let frame = 0;
  let lastTime = performance.now();
  let rotation = -.2;
  let targetRotation = rotation;
  let width = 1;
  let height = 1;

  function setNodeState(node, active) {
    const opacity = active ? (node.active ? 1 : .72) : profile.frontOpacity;
    node.root.userData.front.opacity = opacity;
    node.root.userData.front.transparent = opacity < 1;
    node.root.userData.side.opacity = opacity;
    node.root.userData.side.transparent = opacity < 1;
    node.root.userData.front.emissiveIntensity = active && node.active ? .78 : active ? .28 : .42;
    node.root.userData.side.emissiveIntensity = active && node.active ? .34 : .2;
    node.aura.material.opacity = active ? (node.active ? .58 : .1) : profile.haloOpacity;
  }

  function updateEmphasis(active) {
    nodes.forEach((node) => {
      node.active = node.index === active;
      setNodeState(node, active >= 0);
      const baseScale = node.root.userData.nodeScale || node.root.scale.x;
      const targetScale = baseScale * (node.active ? 1.18 : active >= 0 ? .78 : 1);
      const scale = THREE.MathUtils.damp(Math.abs(node.root.scale.x), targetScale, 9, .016);
      node.root.scale.set(scale, -scale, scale);
    });
  }

  nodes.forEach((node) => {
    node.root.userData.nodeScale = node.root.scale.x;
  });

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    profile = profileFor();
    renderer.setPixelRatio(profile.pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = profile.mobile ? 46 : 41;
    camera.position.z = profile.mobile ? 9.2 : 8.6;
    camera.updateProjectionMatrix();
    const desktop = width > 900;
    graph.position.set(0, desktop ? .04 : 1.18, 0);
    graph.scale.setScalar(desktop ? .92 : .68);
  }

  function localPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function hitTest() {
    if (!pointerInside) return -1;
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(logoMeshes, false);
    return intersections.length ? intersections[0].object.userData.nodeIndex : -1;
  }

  function updateLabel(active) {
    if (!label || active < 0 || !nodes[active]) {
      if (label) label.hidden = true;
      return;
    }
    const node = nodes[active];
    const screenPosition = positionFor(node, performance.now()).applyMatrix4(graph.matrixWorld).project(camera);
    label.hidden = false;
    label.textContent = node.label;
    label.style.transform = `translate3d(${((screenPosition.x + 1) / 2) * width + 16}px, ${((-screenPosition.y + 1) / 2) * height - 14}px, 0)`;
  }

  function render(now) {
    if (!running && !reduced.matches) return;
    const dt = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
    lastTime = now;
    hovered = hitTest();
    const active = hovered >= 0 ? hovered : focused;
    if (!reduced.matches) {
      rotation += dt * .035;
      targetRotation = rotation + (pointerInside ? pointer.x * .14 : 0);
      graph.rotation.y += (targetRotation - graph.rotation.y) * Math.min(1, dt * 2.4);
      graph.rotation.x += ((pointerInside ? pointer.y * .08 : .06) - graph.rotation.x) * Math.min(1, dt * 2.4);
    }
    nodes.forEach((node) => {
      const position = positionFor(node, now);
      node.root.position.copy(position);
      if (!reduced.matches) {
        const baseRotation = node.root.userData.baseRotation;
        node.root.rotation.x = baseRotation.x + Math.sin(now * .00042 + node.phase) * .055;
        node.root.rotation.y = baseRotation.y + Math.cos(now * .00036 + node.phase) * .08;
        node.root.rotation.z = baseRotation.z + Math.sin(now * .00031 + node.phase) * .035;
      }
      node.aura.position.copy(position);
    });
    updateEmphasis(active);
    updateLabel(active);
    renderer.render(scene, camera);
    if (running) frame = requestAnimationFrame(render);
  }

  function start() {
    if (running || reduced.matches || !visible) return;
    running = true;
    lastTime = performance.now();
    frame = requestAnimationFrame(render);
  }

  function stop() {
    running = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  hero.addEventListener("pointermove", (event) => {
    localPointer(event);
    pointerInside = true;
    if (reduced.matches) render(performance.now());
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointerInside = false;
    pointer.set(-10, -10);
    if (reduced.matches) render(performance.now());
  });
  hero.addEventListener("pointerdown", (event) => {
    localPointer(event);
    pointerInside = true;
    const picked = hitTest();
    if (picked >= 0) {
      focused = picked;
      canvas.focus({ preventScroll: true });
      if (reduced.matches) render(performance.now());
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
    if (reduced.matches) render(performance.now());
  });
  reduced.addEventListener?.("change", () => {
    if (reduced.matches) { stop(); render(performance.now()); }
    else start();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { start(); render(performance.now()); }
      else stop();
    }, { rootMargin: "120px" })
    : null;
  observer?.observe(hero);
  window.addEventListener("resize", resize, { passive: true });
  resize();
  render(performance.now());
  start();
}
