/* ====== 卡片滚动出现/消失动画（跟随滚动实时缩放） ====== */
(function () {
  'use strict';

  // 尊重系统“减少动态效果”设置
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 参与动画的卡片选择器
  var SELECTORS = [
    '#recent-posts > .recent-post-item',
    '#aside-content .card-widget',
    '.layout > div:first-child:not(.recent-posts)',
    '.relatedPosts > .relatedPosts-list > div'
  ];

  // 参数：从下方进入时最小 0.85，从上方退出时最小 0.90，最淡透明度 0.15
  var ENTER_MIN = 0.85;
  var EXIT_MIN = 0.90;
  var OPACITY_MIN = 0.15;

  function collect() {
    var seen = new Set();
    var cards = [];
    var i, j, list, el;
    for (i = 0; i < SELECTORS.length; i++) {
      list = document.querySelectorAll(SELECTORS[i]);
      for (j = 0; j < list.length; j++) {
        el = list[j];
        if (seen.has(el)) continue;
        seen.add(el);
        el.classList.add('reveal-card');
        cards.push(el);
      }
    }
    return cards;
  }

  function update(cards) {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var half = vh / 2;
    var i, el, rect, h, p, scale, opacity;
    for (i = 0; i < cards.length; i++) {
      el = cards[i];
      rect = el.getBoundingClientRect();
      h = rect.height;
      if (h >= vh) {
        // 长卡片（如文章正文）：顶部进入视口即恢复原大小，避免正文在加载/阅读时被缩小或变淡
        p = (rect.top - vh) / half;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        scale = ENTER_MIN + (1 - ENTER_MIN) * (1 - p);
        opacity = OPACITY_MIN + (1 - OPACITY_MIN) * (1 - p);
        // 退出：整张卡片完全滑出顶部后才由大到小
        p = -rect.bottom / half;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        scale = Math.min(scale, EXIT_MIN + (1 - EXIT_MIN) * (1 - p));
        opacity = Math.min(opacity, OPACITY_MIN + (1 - OPACITY_MIN) * (1 - p));
      } else {
        // 普通卡片：底部进入视口时由小到大，顶部滑出时由大到小
        p = (rect.bottom - vh) / half;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        scale = ENTER_MIN + (1 - ENTER_MIN) * (1 - p);
        opacity = OPACITY_MIN + (1 - OPACITY_MIN) * (1 - p);
        p = -rect.top / half;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        scale = Math.min(scale, EXIT_MIN + (1 - EXIT_MIN) * (1 - p));
        opacity = Math.min(opacity, OPACITY_MIN + (1 - OPACITY_MIN) * (1 - p));
      }
      el.style.setProperty('--reveal-scale', scale.toFixed(3));
      el.style.setProperty('--reveal-opacity', opacity.toFixed(3));
    }
  }

  var cards = collect();
  if (!cards.length) return;

  // 页面加载后立即计算一次初始状态
  update(cards);

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        update(cards);
        ticking = false;
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // 若主题启用 PJAX 局部刷新，刷新后重新收集卡片
  document.addEventListener('pjax:complete', function () {
    cards = collect();
    update(cards);
  });
})();