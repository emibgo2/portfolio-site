const canvas = document.getElementById("graph");
const hero = canvas?.parentElement;

if (canvas && hero) {
  let loaded = false;

  const loadGraph = () => {
    if (loaded) return;
    loaded = true;
    import("./three-logo-graph-core.js?v=scatter-v11")
      .then(({ mountGraph }) => mountGraph(canvas, hero))
      .catch((error) => console.warn("3D graph unavailable", error));
  };

  const schedule = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadGraph, { timeout: 900 });
    } else {
      window.setTimeout(loadGraph, 180);
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        schedule();
      }
    }, { rootMargin: "160px" });
    observer.observe(hero);
  } else {
    schedule();
  }
}
