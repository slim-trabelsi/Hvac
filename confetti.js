// Ultra-Smooth, Zero-Lag Effects Engine
// Uses hardware-accelerated CSS animations for zero-stutter 60fps performance!

(function() {
  const container = document.createElement('div');
  container.id = 'fx-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';
  document.body ? document.body.appendChild(container) : window.addEventListener('DOMContentLoaded', () => document.body.appendChild(container));

  // CSS injection for smooth GPU transforms
  const style = document.createElement('style');
  style.textContent = `
    .fx-kiss-item {
      position: absolute;
      user-select: none;
      pointer-events: none;
      will-change: transform, opacity;
      animation: floatKiss 2s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
    }
    @keyframes floatKiss {
      0% {
        opacity: 0;
        transform: translate3d(var(--startX), var(--startY), 0) scale(0.4) rotate(0deg);
      }
      15% {
        opacity: 1;
        transform: translate3d(var(--midX), var(--midY), 0) scale(1.2) rotate(var(--rot));
      }
      100% {
        opacity: 0;
        transform: translate3d(var(--endX), var(--endY), 0) scale(1.5) rotate(calc(var(--rot) * 2));
      }
    }
    .fx-confetti-piece {
      position: absolute;
      width: 10px;
      height: 14px;
      border-radius: 2px;
      pointer-events: none;
      will-change: transform, opacity;
      animation: fallConfetti 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes fallConfetti {
      0% {
        opacity: 1;
        transform: translate3d(var(--x), var(--y), 0) rotate(0deg) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate3d(calc(var(--x) + var(--drift)), calc(var(--y) + 380px), 0) rotate(720deg) scale(0.6);
      }
    }
  `;
  document.head.appendChild(style);

  const colors = ['#ff4d6d', '#ff758f', '#ffccd5', '#ffd700', '#f72585', '#ffffff'];

  window.fx = {
    // Zero-lag kiss shower using GPU-accelerated CSS animations
    kissShower: function(count = 15) {
      const symbols = ['💋', '💖', '🥰', '😘', '✨'];
      const targetCount = Math.min(count, 18); // Keep particle count clean and lag-free

      for (let i = 0; i < targetCount; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'fx-kiss-item';
          el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

          const startX = Math.random() * (window.innerWidth - 60) + 30;
          const startY = window.innerHeight * (0.55 + Math.random() * 0.35);
          const endX = startX + (Math.random() - 0.5) * 140;
          const endY = startY - (180 + Math.random() * 220);
          const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 50;
          const midY = (startY + endY) / 2;
          const rot = (Math.random() - 0.5) * 45 + 'deg';
          const fontSize = (24 + Math.random() * 16) + 'px';

          el.style.fontSize = fontSize;
          el.style.setProperty('--startX', `${startX}px`);
          el.style.setProperty('--startY', `${startY}px`);
          el.style.setProperty('--midX', `${midX}px`);
          el.style.setProperty('--midY', `${midY}px`);
          el.style.setProperty('--endX', `${endX}px`);
          el.style.setProperty('--endY', `${endY}px`);
          el.style.setProperty('--rot', rot);

          container.appendChild(el);
          setTimeout(() => el.remove(), 2100);
        }, i * 65);
      }
    },

    // Crisp celebratory confetti
    burstConfetti: function(originX = window.innerWidth / 2, originY = window.innerHeight / 2, count = 25) {
      const targetCount = Math.min(count, 30);
      for (let i = 0; i < targetCount; i++) {
        const piece = document.createElement('div');
        piece.className = 'fx-confetti-piece';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const drift = (Math.random() - 0.5) * 260 + 'px';
        const angle = (Math.PI * 2 * i) / targetCount;
        const radius = Math.random() * 60 + 20;
        const startX = originX + Math.cos(angle) * radius;
        const startY = originY + Math.sin(angle) * radius;

        piece.style.setProperty('--x', `${startX}px`);
        piece.style.setProperty('--y', `${startY}px`);
        piece.style.setProperty('--drift', drift);

        container.appendChild(piece);
        setTimeout(() => piece.remove(), 2300);
      }
    },

    // Gentle heart spark
    heartSpark: function(x, y) {
      const el = document.createElement('div');
      el.className = 'fx-kiss-item';
      el.textContent = '💖';
      el.style.fontSize = '20px';
      el.style.setProperty('--startX', `${x}px`);
      el.style.setProperty('--startY', `${y}px`);
      el.style.setProperty('--midX', `${x + (Math.random() - 0.5) * 30}px`);
      el.style.setProperty('--midY', `${y - 40}px`);
      el.style.setProperty('--endX', `${x + (Math.random() - 0.5) * 60}px`);
      el.style.setProperty('--endY', `${y - 90}px`);
      el.style.setProperty('--rot', '0deg');
      container.appendChild(el);
      setTimeout(() => el.remove(), 1900);
    },

    // Grand finale
    birthdayExtravaganza: function() {
      window.fx.kissShower(15);
      window.fx.burstConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 30);
    }
  };
})();
