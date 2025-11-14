// Minimal dynamic behavior for dashboard tiles (index.html)
document.addEventListener('DOMContentLoaded', () => {
  // animate stat numbers quickly (mock)
  const statEls = document.querySelectorAll('.visual-number, .stat-value');
  statEls.forEach(el => {
    const start = 0;
    const target = parseInt(el.textContent.replace(/[^0-9]/g, '') || 0, 10);
    let v = start;
    const step = Math.max(1, Math.floor(target / 40));
    const iv = setInterval(() => {
      v += step;
      if (v >= target) {
        el.textContent = el.textContent; // keep original markup (already present)
        clearInterval(iv);
        return;
      }
      el.textContent = v;
    }, 20);
  });
});
