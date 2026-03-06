document.addEventListener('DOMContentLoaded', () => {
  const infoSection = document.getElementById('info-section');
  const infoForm = document.getElementById('info-form');
  const imageInput = document.getElementById('image-input');
  const inputSection = document.getElementById('input-section');
  const analysisSection = document.getElementById('analysis-section');
  const resultSection = document.getElementById('result-section');
  const imagePreview = document.getElementById('image-preview'); // Final analysis preview
  const btnRetry = document.getElementById('btn-retry');

  // Step Elements
  const cameraStream = document.getElementById('camera-stream');
  const cameraCanvas = document.getElementById('camera-canvas');
  const stepPreview = document.getElementById('step-preview');
  const guideOverlay = document.getElementById('guide-overlay');
  const guidePath = document.getElementById('guide-path');
  const captureTitle = document.getElementById('capture-title');
  const captureDesc = document.getElementById('capture-desc');
  const captureBtnText = document.getElementById('capture-btn-text');
  
  const btnCapture = document.getElementById('btn-capture');
  const btnSwitchCamera = document.getElementById('btn-switch-camera');
  const fallbackUploadLabel = document.getElementById('fallback-upload-label');
  
  const btnNextStep = document.getElementById('btn-next-step');
  const btnRetake = document.getElementById('btn-retake');
  const stepDots = [
    document.getElementById('step-1-dot'),
    document.getElementById('step-2-dot'),
    document.getElementById('step-3-dot')
  ];

  // Results elements
  const resCavity = document.querySelector('#result-cavity .status-badge');
  const resTartar = document.querySelector('#result-tartar .status-badge');
  const resAlignment = document.querySelector('#result-alignment .status-badge');
  const overallFeedback = document.getElementById('overall-feedback');

  // Camera stream track & state
  let currentStream = null;
  let useFrontCamera = true; 
  let userData = {};

  // Capture Process State
  let currentStep = 1;
  const capturedImages = {
    step1: null,
    step2: null,
    step3: null
  };

  const stepConfig = {
    1: {
      title: "정면 사진 촬영",
      desc: "어금니를 가볍게 물고 입술을 벌려 치아 정면이 잘 보이게 찍어주세요.",
      btnText: "정면 사진 찍기",
      // Realistic representation of upper and lower teeth biting together (central incisors to premolars)
      guidePath: `
        M 10,50 
        C 10,20 90,20 90,50 
        C 90,80 10,80 10,50 Z 
        M 10,50 L 90,50 
        M 50,23 L 50,77 
        M 38,24 L 38,76 
        M 62,24 L 62,76 
        M 26,27 L 26,73 
        M 74,27 L 74,73 
        M 16,35 L 16,65 
        M 84,35 L 84,65`
    },
    2: {
      title: "상악(위쪽) 아치 촬영",
      desc: "입을 크게 벌리고 고개를 뒤로 젖혀 위쪽 치아 전체가 보이게 찍어주세요.",
      btnText: "위쪽 치아 찍기",
      guidePath: "M 20,80 Q 50,10 80,80"
    },
    3: {
      title: "하악(아래쪽) 아치 촬영",
      desc: "입을 크게 벌리고 고개를 숙여 아래쪽 치아 전체가 보이게 찍어주세요.",
      btnText: "아래쪽 치아 찍기",
      guidePath: "M 20,20 Q 50,90 80,20"
    }
  };

  // Modal logic
  const modalLinks = document.querySelectorAll('.btn-text-link[data-modal]');
  const closeButtons = document.querySelectorAll('.modal-close');
  const overlays = document.querySelectorAll('.modal-overlay');

  modalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-modal');
      const targetModal = document.getElementById(targetId);
      if (targetModal) {
        targetModal.classList.add('active');
      }
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay').classList.remove('active');
    });
  });

  overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Dev skip logic
  const btnDevSkip = document.getElementById('btn-dev-skip');
  if (btnDevSkip) {
    btnDevSkip.addEventListener('click', () => {
      userData = { name: "개발자", phone: "010-0000-0000", region: "서울" };
      showSection(inputSection);
    });
  }

  // Camera functions
  async function startCamera() {
    stopCamera(); 
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: useFrontCamera ? 'user' : 'environment',
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false
        });
        currentStream = stream;
        cameraStream.srcObject = stream;
        
        if (useFrontCamera) {
          cameraStream.style.transform = 'scaleX(-1)';
        } else {
          cameraStream.style.transform = 'scaleX(1)';
        }
        
        fallbackUploadLabel.classList.add('hidden');
      } catch (err) {
        console.error("Camera access denied:", err);
        fallbackUploadLabel.classList.remove('hidden');
      }
    } else {
      fallbackUploadLabel.classList.remove('hidden');
    }
  }

  if (btnSwitchCamera) {
    btnSwitchCamera.addEventListener('click', () => {
      useFrontCamera = !useFrontCamera;
      startCamera();
    });
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
  }

  btnCapture.addEventListener('click', () => {
    if (currentStream) {
      cameraCanvas.width = cameraStream.videoWidth;
      cameraCanvas.height = cameraStream.videoHeight;
      const ctx = cameraCanvas.getContext('2d');
      
      if (useFrontCamera) {
        ctx.translate(cameraCanvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      const imageData = cameraCanvas.toDataURL('image/jpeg', 0.95);
      processCapturedImage(imageData);
    } else {
      alert("카메라가 활성화되지 않았습니다.");
    }
  });

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processCapturedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  function processCapturedImage(imageDataUrl) {
    if (useFrontCamera) {
      stepPreview.style.transform = 'scaleX(-1)';
    } else {
      stepPreview.style.transform = 'scaleX(1)';
    }

    stepPreview.src = imageDataUrl;
    stepPreview.classList.remove('hidden');
    guideOverlay.style.display = 'none';
    cameraStream.style.display = 'none';
    
    capturedImages[`step${currentStep}`] = imageDataUrl;

    btnCapture.classList.add('hidden');
    fallbackUploadLabel.classList.add('hidden');
    btnNextStep.classList.remove('hidden');
    btnRetake.classList.remove('hidden');
  }

  function showSection(sectionToShow) {
    const sections = [infoSection, inputSection, analysisSection, resultSection];
    
    sections.forEach(sec => {
      if (sec !== sectionToShow) {
        sec.classList.remove('active');
        setTimeout(() => {
          sec.classList.add('hidden');
        }, 500);
      }
    });

    if (sectionToShow === inputSection) {
      startCamera();
    } else {
      stopCamera();
    }

    sectionToShow.classList.remove('hidden');
    setTimeout(() => {
      sectionToShow.classList.add('active');
    }, 50);
  }

  infoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const agreeTerms = document.getElementById('agree-terms').checked;
    const agreeSensitive = document.getElementById('agree-sensitive').checked;
    const agreePrivacy = document.getElementById('agree-privacy').checked;
    const agreeMarketing = document.getElementById('agree-marketing').checked;

    if (!agreeTerms || !agreeSensitive || !agreePrivacy || !agreeMarketing) {
      alert("모든 필수 동의 항목에 체크해야 합니다.");
      return;
    }

    userData = {
      name: document.getElementById('user-name').value,
      phone: document.getElementById('user-phone').value,
      region: document.getElementById('user-region').value
    };
    
    showSection(inputSection);
  });

  btnRetake.addEventListener('click', () => {
    capturedImages[`step${currentStep}`] = null;
    stepPreview.classList.add('hidden');
    stepPreview.src = '';
    guideOverlay.style.display = 'block';
    cameraStream.style.display = 'block';
    btnCapture.classList.remove('hidden');
    btnNextStep.classList.add('hidden');
    btnRetake.classList.add('hidden');
    if (!currentStream) startCamera();
  });

  btnNextStep.addEventListener('click', () => {
    if (currentStep < 3) {
      stepDots[currentStep - 1].classList.remove('active');
      stepDots[currentStep - 1].classList.add('completed');
      currentStep++;
      stepDots[currentStep - 1].classList.add('active');
      
      const config = stepConfig[currentStep];
      captureTitle.textContent = config.title;
      captureDesc.textContent = config.desc;
      captureBtnText.textContent = config.btnText;
      guidePath.setAttribute('d', config.guidePath);
      
      stepPreview.classList.add('hidden');
      stepPreview.src = '';
      guideOverlay.style.display = 'block';
      cameraStream.style.display = 'block';
      btnCapture.classList.remove('hidden');
      btnNextStep.classList.add('hidden');
      btnRetake.classList.add('hidden');
      
      if (currentStep === 3) btnNextStep.textContent = "AI 분석 시작하기";
      if (!currentStream) startCamera();
    } else {
      stopCamera();
      imagePreview.src = capturedImages.step1; 
      startAnalysis();
    }
  });

  function startAnalysis() {
    showSection(analysisSection);
    setTimeout(() => {
      generateMockResults();
      showSection(resultSection);
    }, 4000);
  }

  function generateMockResults() {
    const hasCavity = Math.random() > 0.4;
    const hasTartar = Math.random() > 0.5;
    
    resCavity.textContent = hasCavity ? '의심 (1곳)' : '양호';
    resCavity.className = 'status-badge ' + (hasCavity ? 'badge-warning' : 'badge-success');

    resTartar.textContent = hasTartar ? '치석 발견' : '깨끗함';
    resTartar.className = 'status-badge ' + (hasTartar ? 'badge-warning' : 'badge-success');

    resAlignment.textContent = '정상 교합';
    resAlignment.className = 'status-badge badge-success';

    if (hasCavity || hasTartar) {
      overallFeedback.innerHTML = `${userData.name || '고객'}님, 분석 결과 <b>${hasCavity ? '초기 충치 의심 부위' : ''}${hasCavity && hasTartar ? '와 ' : ''}${hasTartar ? '치석' : ''}이 발견</b>되었습니다.`;
    } else {
      overallFeedback.innerHTML = `놀랍습니다 ${userData.name || '고객'}님! 전반적으로 <b>치아 관리가 매우 훌륭하게</b> 이루어지고 있습니다.`;
    }
  }

  btnRetry.addEventListener('click', () => {
    currentStep = 1;
    capturedImages.step1 = null;
    capturedImages.step2 = null;
    capturedImages.step3 = null;
    stepDots.forEach((dot, index) => {
      dot.className = 'progress-step';
      if (index === 0) dot.classList.add('active');
    });
    const config = stepConfig[1];
    captureTitle.textContent = config.title;
    captureDesc.textContent = config.desc;
    captureBtnText.textContent = config.btnText;
    guidePath.setAttribute('d', config.guidePath);
    stepPreview.classList.add('hidden');
    guideOverlay.style.display = 'block';
    cameraStream.style.display = 'block';
    btnCapture.classList.remove('hidden');
    btnNextStep.classList.add('hidden');
    btnNextStep.textContent = "다음 단계로";
    btnRetake.classList.add('hidden');
    showSection(inputSection);
  });
});