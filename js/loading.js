window.addEventListener('load', function() {
  const loader = document.querySelector('.loading-animation');
  if (loader) {
    // 先淡出
    loader.style.transition = 'opacity 0.3s ease';
    loader.style.opacity = '0';

    // 0.3秒后彻底隐藏
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
});
