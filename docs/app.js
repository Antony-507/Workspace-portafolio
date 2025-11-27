const auth = {
  isAuthenticated: false,
  login(username, password) {
    if ((username === 'Antony' && password === '507') || (username === 'admin' && password === 'admin123')) {
      this.isAuthenticated = true;
      sessionStorage.setItem('usuario', username);
      sessionStorage.setItem('role', (username === 'Antony' || username === 'admin') ? 'Manager' : 'Visitor');
      return true;
    }
    return false;
  },
  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('guestMode');
  },
  checkAuth() {
    if (this.isAuthenticated) return true;
    const u = sessionStorage.getItem('usuario');
    if (u) { this.isAuthenticated = true; return true; }
    return false;
  }
};

function protectContent() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  const videos = document.querySelectorAll('video');
  videos.forEach(v => { v.setAttribute('controlslist','nodownload'); v.setAttribute('oncontextmenu','return false;'); });
}

function loadGallery() {
  if(!auth.checkAuth()) return;
  const gallery = document.getElementById('gallery');
  if(!gallery) return;
  const images = [ 'Recursos/file_00000000640061f5acfd89d3f55d55a3.png', 'Recursos/Logo2.png' ];
  images.forEach(src => { const div=document.createElement('div'); div.className='gallery-item'; const img=document.createElement('img'); img.src=src; img.alt='Imagen del portafolio'; div.appendChild(img); gallery.appendChild(div); });
  protectContent();
}

window.addEventListener('DOMContentLoaded', loadGallery);
