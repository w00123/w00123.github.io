function hideLoader() {
  const loader = document.querySelector('.loading-animation');
  if (loader) {
    loader.style.transition = 'opacity 0.3s ease';
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(hideLoader, 100);
});

setTimeout(hideLoader, 3000);
