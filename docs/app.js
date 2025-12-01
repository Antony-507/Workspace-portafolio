const auth = {
  isAuthenticated: false,
  login() { return false; },
  logout() { this.isAuthenticated = false; sessionStorage.removeItem('usuario'); sessionStorage.removeItem('role'); sessionStorage.removeItem('guestMode'); },
  checkAuth() { if (this.isAuthenticated) return true; const u = sessionStorage.getItem('usuario'); if (u) { this.isAuthenticated = true; return true; } return false; }
};

function protectContent() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  const videos = document.querySelectorAll('video');
  videos.forEach(video => { video.setAttribute('controlslist', 'nodownload'); video.setAttribute('oncontextmenu', 'return false;'); });
}

function loadGallery() {
  if(!auth.checkAuth()) { return; }
  const gallery = document.getElementById('gallery');
  if(!gallery) return;
  const images = [ 'Recursos/file_00000000640061f5acfd89d3f55d55a3.png', 'Recursos/Logo2.png' ];
  images.forEach(imgSrc => { const imgContainer = document.createElement('div'); imgContainer.className = 'gallery-item'; const img = document.createElement('img'); img.src = imgSrc; img.alt = 'Imagen del portafolio'; imgContainer.appendChild(img); gallery.appendChild(imgContainer); });
  protectContent();
}

window.addEventListener('DOMContentLoaded', () => { loadGallery(); });
