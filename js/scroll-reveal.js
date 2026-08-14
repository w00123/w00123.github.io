/* ====== 卡片滚动出现动画（触发后平滑执行到底） ====== */
(function () {
  'use strict';

  // 尊重系统“减少动态效果”设置
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 只在首页启用该动画，文章页与普通页面（导航、防火墙配置等）不启用
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;

  // 参与动画的卡片选择器
  var SELECTORS = [
    '#recent-posts > .recent-post-item',
    '#aside-content .card-widget',
    '.layout > div:first-child:not(.recent-posts)',
    '.relatedPosts > .relatedPosts-list > div'
  ];

  // 参数：从下方进入时最小 0.85，最淡透明度 0.15
  var ENTER_MIN = 0.85;
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

  var lastY = window.pageYOffset || document.documentElement.scrollTop;
  var direction = 'down'; // start as 'down' so below-fold cards are hidden initially

  function update(cards, dir) {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var i, el, rect, scale, opacity;
    for (i = 0; i < cards.length; i++) {
      el = cards[i];
      rect = el.getBoundingClientRect();
      if (dir === 'down') {
        // Down scroll: cards fully below the viewport hide again, so they re-animate on re-entry
        if (el._revealed && rect.top >= vh) el._revealed = false;
        if (!el._revealed && rect.top >= vh) {
          scale = ENTER_MIN;
          opacity = OPACITY_MIN;
        } else if (!el._revealed) {
          // 普通卡片：顶部进入视口即由小到大
          el._revealed = true;
          scale = 1;
          opacity = 1;
        } else {
          scale = 1;
          opacity = 1;
        }
      } else {
        // Up scroll: keep every card at full size, never shrink or fade
        scale = 1;
        opacity = 1;
      }
      el.style.setProperty('--reveal-scale', scale.toFixed(3));
      el.style.setProperty('--reveal-opacity', opacity.toFixed(3));
    }
  }

  var cards = collect();
  if (!cards.length) return;

  // 页面加载后立即计算一次初始状态
  update(cards, direction);

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset || document.documentElement.scrollTop;
        if (y > lastY) direction = 'down';
        else if (y < lastY) direction = 'up';
        lastY = y;
        update(cards, direction);
        ticking = false;
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // 若主题启用 PJAX 局部刷新，刷新后重新收集卡片
  document.addEventListener('pjax:complete', function () {
    cards = collect();
    lastY = window.pageYOffset || document.documentElement.scrollTop;
    direction = 'down';
    update(cards, direction);
  });
})();