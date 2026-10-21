const canvas = document.getElementById("graph");
const page = document.getElementById("top");

if (canvas && page) {
  let loaded = false;

  const loadGraph = () => {
    if (loaded) return;
    loaded = true;
    import("./three-logo-graph-core.js?v=cover-v49")
      .then(({ mountGraph }) => mountGraph(canvas))
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
    observer.observe(page);
  } else {
    schedule();
  }
}
