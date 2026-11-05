// Main Interactive Logic for Girlfriend's 21st Birthday Website
// Long-Distance Relationship: Tunisia 🇹🇳 to Cebu, Philippines 🇵🇭

document.addEventListener('DOMContentLoaded', () => {
  const config = window.BIRTHDAY_CONFIG || {};

  // 1. Populate Custom Config Fields
  const gfNameEls = document.querySelectorAll('.dynamic-gf-name');
  gfNameEls.forEach(el => el.textContent = config.girlfriendName || "My Palangga");

  const nicknameEls = document.querySelectorAll('.dynamic-nickname');
  nicknameEls.forEach(el => el.textContent = config.nickname || "Langga");

  const bfNameEls = document.querySelectorAll('.dynamic-bf-name');
  bfNameEls.forEach(el => el.textContent = config.boyfriendName || "Your Boyfriend");

  // Populate Love Letter Content cleanly (No underscores anywhere)
  const letterBody = document.getElementById('letterBodyText');
  if (letterBody && config.loveLetter) {
    letterBody.textContent = config.loveLetter;
  }

  // 2. Audio & Welcome Gate Handling (Plays "Happy Birthday to You" directly)
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const vinylRecord = document.getElementById('vinylRecord');
  const audioStatusText = document.getElementById('audioStatusText');
  const welcomeGate = document.getElementById('welcomeGate');
  const enterSiteBtn = document.getElementById('enterSiteBtn');

  function startBirthdaySong() {
    if (window.soundEngine) {
      window.soundEngine.startMusic();
      if (vinylRecord) vinylRecord.classList.add('spinning');
      if (audioStatusText) audioStatusText.textContent = "Playing Happy Birthday 🎶";
    }
  }

  // Welcome Gate dismiss & direct music trigger
  if (enterSiteBtn && welcomeGate) {
    enterSiteBtn.addEventListener('click', () => {
      startBirthdaySong();
      welcomeGate.classList.add('dismissed');
      if (window.fx) {
        window.fx.burstConfetti(window.innerWidth / 2, window.innerHeight * 0.45, 30);
      }
    });
  }

  // Attempt direct autoplay immediately on page load
  try {
    startBirthdaySong();
  } catch(e) {
    console.log("Browser autoplay policy prevented direct audio without interaction");
  }

  // Music toggle button in header
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.toggleMusic((isPlaying) => {
          if (isPlaying) {
            vinylRecord.classList.add('spinning');
            audioStatusText.textContent = "Playing Happy Birthday 🎶";
          } else {
            vinylRecord.classList.remove('spinning');
            audioStatusText.textContent = "Play Song 🎵";
          }
        });
      }
    });
  }

  // 3. Interactive Birthday Cake & Candles
  const blowCandlesBtn = document.getElementById('blowCandlesBtn');
  const cakeStage = document.getElementById('cakeStage');
  const wishUnlockedCard = document.getElementById('wishUnlockedCard');
  let candlesBlown = false;

  const candlesRow = document.getElementById('candlesRow');
  if (candlesRow) {
    candlesRow.innerHTML = '';
    const candleCount = 7;
    for (let i = 0; i < candleCount; i++) {
      const candle = document.createElement('div');
      candle.className = 'candle';
      candle.innerHTML = `
        <div class="candle-flame"></div>
      `;
      candle.addEventListener('click', () => {
        extinguishCandle(candle);
      });
      candlesRow.appendChild(candle);
    }
  }

  function extinguishCandle(candle) {
    if (!candle.classList.contains('blown')) {
      candle.classList.add('blown');
      if (window.soundEngine) window.soundEngine.playBlowCandles();
      checkAllCandles();
    }
  }

  function checkAllCandles() {
    const allCandles = document.querySelectorAll('.candle');
    const remaining = Array.from(allCandles).filter(c => !c.classList.contains('blown'));
    if (remaining.length === 0 && !candlesBlown) {
      onAllCandlesBlown();
    }
  }

  function onAllCandlesBlown() {
    candlesBlown = true;
    if (blowCandlesBtn) {
      blowCandlesBtn.textContent = "✨ Wishes Sent Across the Miles! ✨";
      blowCandlesBtn.style.background = "linear-gradient(135deg, #48bb78 0%, #38a169 100%)";
    }
    if (wishUnlockedCard) {
      wishUnlockedCard.style.display = 'block';
    }
    if (window.fx) {
      const rect = cakeStage.getBoundingClientRect();
      window.fx.burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
      setTimeout(() => window.fx.kissShower(15), 500);
    }
  }

  if (blowCandlesBtn) {
    blowCandlesBtn.addEventListener('click', () => {
      const allCandles = document.querySelectorAll('.candle');
      allCandles.forEach((c, idx) => {
        setTimeout(() => {
          c.classList.add('blown');
        }, idx * 80);
      });
      if (window.soundEngine) window.soundEngine.playBlowCandles();
      setTimeout(onAllCandlesBlown, 600);
    });
  }

  // 4. Secret Gift Box & Love Letter Modal
  const giftBoxInteractive = document.getElementById('giftBoxInteractive');
  const letterModal = document.getElementById('letterModal');
  const closeLetterBtn = document.getElementById('closeLetterBtn');
  const closeLetterBtnBottom = document.getElementById('closeLetterBtnBottom');
  const downloadLetterBtn = document.getElementById('downloadLetterBtn');

  function openLetter() {
    if (window.soundEngine) window.soundEngine.playClick();
    if (letterModal) {
      letterModal.classList.add('open');
      if (window.fx) window.fx.kissShower(15);
    }
  }

  function closeLetter() {
    if (letterModal) {
      letterModal.classList.remove('open');
      if (window.soundEngine) window.soundEngine.playClick();
    }
  }

  if (giftBoxInteractive) {
    giftBoxInteractive.addEventListener('click', openLetter);
  }
  if (closeLetterBtn) {
    closeLetterBtn.addEventListener('click', closeLetter);
  }
  if (closeLetterBtnBottom) {
    closeLetterBtnBottom.addEventListener('click', closeLetter);
  }

  if (letterModal) {
    letterModal.addEventListener('click', (e) => {
      if (e.target === letterModal) closeLetter();
    });
  }

  // Download / Save Letter cleanly
  if (downloadLetterBtn) {
    downloadLetterBtn.addEventListener('click', () => {
      const cleanName = (config.girlfriendName || "Palangga").replace(/[^a-zA-Z0-9]/g, ' ').trim();
      const textToSave = config.loveLetter || "Happy 21st Birthday, Langga! Gihigugma tika kaayo.";
      const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Birthday-Love-Letter-21st-${cleanName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      if (window.soundEngine) window.soundEngine.playStamp();
    });
  }

  // 5. Populate 21 Reasons Grid & Flip Interaction
  const reasonsGrid = document.getElementById('reasonsGrid');
  const reasonsCounter = document.getElementById('reasonsCounter');
  const reasonsList = config.reasons || [];

  if (reasonsGrid && reasonsList.length > 0) {
    reasonsGrid.innerHTML = '';
    reasonsList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'reason-card';
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-front">
            <div class="reason-number-badge">${item.num}</div>
            <div class="card-front-title">${item.title}</div>
            <div class="card-front-tap">✨ Click to reveal ✨</div>
          </div>
          <div class="card-face card-back">
            <div class="card-back-title">#${item.num} - ${item.title}</div>
            <div class="card-back-text">${item.text}</div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        card.classList.toggle('is-flipped');
        if (window.soundEngine) window.soundEngine.playClick();
        if (window.fx) {
          const rect = card.getBoundingClientRect();
          window.fx.heartSpark(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        const allFlipped = document.querySelectorAll('.reason-card.is-flipped').length;
        if (reasonsCounter) {
          reasonsCounter.textContent = `${allFlipped} / ${reasonsList.length}`;
        }

        if (allFlipped === reasonsList.length && !card.dataset.completed) {
          card.dataset.completed = "true";
          setTimeout(() => {
            alert("💖 You discovered all 21 reasons! Even with 10,000 km between Tunisia and Cebu, my heart will always belong to you. Palangga kaayo tika, Langga!");
            if (window.fx) window.fx.birthdayExtravaganza();
          }, 400);
        }
      });

      reasonsGrid.appendChild(card);
    });
  }

  // 6. Kilig Meter
  const loveSlider = document.getElementById('loveSlider');
  const meterVal = document.getElementById('meterVal');
  const meterStatus = document.getElementById('meterStatus');

  if (loveSlider && meterVal && meterStatus) {
    loveSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (val < 25) {
        meterVal.textContent = `${val}%`;
        meterStatus.textContent = "Error: Too low! My love is way bigger than that! 😂";
      } else if (val < 65) {
        meterVal.textContent = `${val}%`;
        meterStatus.textContent = "Getting warmer... but keep sliding! 💕";
      } else if (val < 99) {
        meterVal.textContent = `${val}%`;
        meterStatus.textContent = "Bigger than all the 10,000 km between us! ✨";
      } else {
        meterVal.textContent = `1,000,000% ∞`;
        meterStatus.textContent = "🔥 OVERFLOW! KILIG TO THE MAX! INFINITY & BEYOND! 🚀💖";
        if (window.fx) window.fx.kissShower(15);
      }
    });
  }

  // 7. Fun Quiz & Runaway Button
  const quizOptions = document.querySelectorAll('.quiz-q-1 .quiz-btn');
  const quizFeedback1 = document.getElementById('quizFeedback1');
  quizOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      if (quizFeedback1) {
        quizFeedback1.style.display = 'block';
        quizFeedback1.textContent = "🎉 100% CORRECT! You are truly the most gorgeous girl in the universe! 🥰";
        if (window.soundEngine) window.soundEngine.playStamp();
        if (window.fx) window.fx.kissShower(15);
      }
    });
  });

  const runawayBtn = document.getElementById('runawayBtn');
  const yesBtn = document.getElementById('stayBtn');
  const quizFeedback2 = document.getElementById('quizFeedback2');

  if (runawayBtn) {
    const moveRunaway = () => {
      const parent = runawayBtn.parentElement;
      const maxX = parent.offsetWidth - runawayBtn.offsetWidth;
      const maxY = 100;
      const randX = Math.random() * (maxX - 20);
      const randY = (Math.random() - 0.5) * maxY;

      runawayBtn.style.position = 'relative';
      runawayBtn.style.left = `${randX}px`;
      runawayBtn.style.top = `${randY}px`;
      if (window.soundEngine) window.soundEngine.playPop();
    };

    runawayBtn.addEventListener('mouseover', moveRunaway);
    runawayBtn.addEventListener('touchstart', moveRunaway, { passive: true });
    runawayBtn.addEventListener('click', moveRunaway);
  }

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      if (quizFeedback2) {
        quizFeedback2.style.display = 'block';
        quizFeedback2.textContent = "🥺 I knew it! Distance can't stop us. I will wait and hold on until the day I finally hold you in my arms! Gihigugma tika kaayo!";
        if (window.soundEngine) window.soundEngine.playStamp();
        if (window.fx) window.fx.kissShower(18);
      }
    });
  }

  // 8. Floating Love Dock Controls
  const dockKissBtn = document.getElementById('dockKissBtn');
  const dockHugBtn = document.getElementById('dockHugBtn');
  const dockConfettiBtn = document.getElementById('dockConfettiBtn');
  const dockLetterBtn = document.getElementById('dockLetterBtn');

  if (dockKissBtn) {
    dockKissBtn.addEventListener('click', () => {
      if (window.fx) window.fx.kissShower(15);
      if (window.soundEngine) window.soundEngine.playClick();
    });
  }

  if (dockHugBtn) {
    dockHugBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playChime(523.25, 0.8, 0.15);
      if (window.fx) window.fx.kissShower(15);
    });
  }

  if (dockConfettiBtn) {
    dockConfettiBtn.addEventListener('click', () => {
      if (window.fx) window.fx.burstConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 25);
      if (window.soundEngine) window.soundEngine.playPop();
    });
  }

  if (dockLetterBtn) {
    dockLetterBtn.addEventListener('click', openLetter);
  }
});
