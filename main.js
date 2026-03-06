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

  // User data store
  let userData = {};

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
    stopCamera(); // Ensure previous stream is stopped before starting a new one
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: useFrontCamera ? 'user' : 'environment',
            width: { ideal: 1920, max: 2560 },  // Lower ideal to 1080p for performance, max 1440p
            height: { ideal: 1080, max: 1440 },
            frameRate: { ideal: 30, max: 60 } // Request higher framerate for smoother UI
          },
          audio: false
        });
        currentStream = stream;
        cameraStream.srcObject = stream;
        
        // Mirror the video if it's the front camera for a natural feel
        if (useFrontCamera) {
          cameraStream.style.transform = 'scaleX(-1)';
        } else {
          cameraStream.style.transform = 'scaleX(1)';
        }
        
        fallbackUploadLabel.classList.add('hidden'); // Hide fallback if camera works
      } catch (err) {
        console.error("Camera access denied or not available:", err);
        fallbackUploadLabel.classList.remove('hidden'); // Show fallback input
      }
    } else {
      fallbackUploadLabel.classList.remove('hidden');
    }
  }

  // Handle camera switch
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

  // Handle capture from live camera
  btnCapture.addEventListener('click', () => {
    if (currentStream) {
      // Set canvas size to match video feed
      cameraCanvas.width = cameraStream.videoWidth;
      cameraCanvas.height = cameraStream.videoHeight;
      const ctx = cameraCanvas.getContext('2d');
      
      // Mirror the canvas capture if using front camera to match live preview
      if (useFrontCamera) {
        ctx.translate(cameraCanvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      // Draw current video frame onto canvas
      ctx.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);
      
      // Reset transform for future operations
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Convert to image data URL with higher quality (0.95)
      const imageData = cameraCanvas.toDataURL('image/jpeg', 0.95);
      processCapturedImage(imageData);
    } else {
      alert("카메라가 활성화되지 않았습니다. 권한을 확인하거나 앨범에서 선택해주세요.");
    }
  });

  // Handle fallback file upload
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
    // Mirror preview if front camera is used to match live feed
    if (useFrontCamera) {
      stepPreview.style.transform = 'scaleX(-1)';
    } else {
      stepPreview.style.transform = 'scaleX(1)';
    }

    // Show preview, hide guide and camera feed
    stepPreview.src = imageDataUrl;
    stepPreview.classList.remove('hidden');
    guideOverlay.style.display = 'none';
    cameraStream.style.display = 'none';
    
    // Save image to current step
    capturedImages[`step${currentStep}`] = imageDataUrl;

    // Switch buttons
    btnCapture.classList.add('hidden');
    fallbackUploadLabel.classList.add('hidden');
    btnNextStep.classList.remove('hidden');
    btnRetake.classList.remove('hidden');
  }

  // Handle section switching and camera state
  function showSection(sectionToShow) {
    // Hide all sections first
    const sections = [infoSection, inputSection, analysisSection, resultSection];
    
    sections.forEach(sec => {
      if (sec !== sectionToShow) {
        sec.classList.remove('active');
        setTimeout(() => {
          sec.classList.add('hidden');
        }, 500);
      }
    });

    // Start/Stop camera based on section
    if (sectionToShow === inputSection) {
      startCamera();
    } else {
      stopCamera();
    }

    // Show target section
    sectionToShow.classList.remove('hidden');
    setTimeout(() => {
      sectionToShow.classList.add('active');
    }, 50);
  }

  // Handle Info Form Submit
  infoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const agreeTerms = document.getElementById('agree-terms').checked;
    const agreeSensitive = document.getElementById('agree-sensitive').checked;
    const agreePrivacy = document.getElementById('agree-privacy').checked;
    const agreeMarketing = document.getElementById('agree-marketing').checked;

    if (!agreeTerms || !agreeSensitive || !agreePrivacy || !agreeMarketing) {
      alert("모든 필수 동의 항목에 체크해야 다음 단계로 진행할 수 있습니다.");
      return;
    }

    // Save user data (for later DB use)
    userData = {
      name: document.getElementById('user-name').value,
      phone: document.getElementById('user-phone').value,
      region: document.getElementById('user-region').value
    };
    
    // Move to photo upload section
    showSection(inputSection);
  });

  btnRetake.addEventListener('click', () => {
    capturedImages[`step${currentStep}`] = null;
    
    // Reset UI for current step
    stepPreview.classList.add('hidden');
    stepPreview.src = '';
    guideOverlay.style.display = 'block';
    cameraStream.style.display = 'block';
    
    btnCapture.classList.remove('hidden');
    fallbackUploadLabel.classList.add('hidden'); // Hide fallback unless camera fails
    btnNextStep.classList.add('hidden');
    btnRetake.classList.add('hidden');
    
    // Ensure camera is running
    if (!currentStream) {
      startCamera();
    }
  });

  btnNextStep.addEventListener('click', () => {
    if (currentStep < 3) {
      // Move to next step
      stepDots[currentStep - 1].classList.remove('active');
      stepDots[currentStep - 1].classList.add('completed');
      
      currentStep++;
      
      stepDots[currentStep - 1].classList.add('active');
      
      // Update UI texts and guide
      const config = stepConfig[currentStep];
      captureTitle.textContent = config.title;
      captureDesc.textContent = config.desc;
      captureBtnText.textContent = config.btnText;
      guidePath.setAttribute('d', config.guidePath);
      
      // Reset UI for new capture
      stepPreview.classList.add('hidden');
      stepPreview.src = '';
      guideOverlay.style.display = 'block';
      cameraStream.style.display = 'block';
      
      btnCapture.classList.remove('hidden');
      fallbackUploadLabel.classList.add('hidden');
      btnNextStep.classList.add('hidden');
      btnRetake.classList.add('hidden');
      
      // Change next button text on last step
      if (currentStep === 3) {
        btnNextStep.textContent = "AI 분석 시작하기";
      }
      
      // Ensure camera is running
      if (!currentStream) {
        startCamera();
      }
    } else {
      // All 3 steps done, stop camera and start analysis
      stopCamera();
      // Use the front image (step 1) for the scanning animation as representation
      imagePreview.src = capturedImages.step1; 
      startAnalysis();
    }
  });

  function startAnalysis() {
    showSection(analysisSection);

    // Simulate AI processing time with visual feedback
    setTimeout(() => {
      generateMockResults();
      showSection(resultSection);
    }, 4000); // 4 seconds animation
  }

  function generateMockResults() {
    // Randomize results slightly for dynamic feel
    const hasCavity = Math.random() > 0.4;
    const hasTartar = Math.random() > 0.5;
    
    const cavityStatus = hasCavity ? '의심 (1곳)' : '양호';
    const tartarStatus = hasTartar ? '치석 발견' : '깨끗함';
    const alignmentStatus = '정상 교합';

    resCavity.textContent = cavityStatus;
    resCavity.className = 'status-badge ' + (hasCavity ? 'badge-warning' : 'badge-success');

    resTartar.textContent = tartarStatus;
    resTartar.className = 'status-badge ' + (hasTartar ? 'badge-warning' : 'badge-success');

    resAlignment.textContent = alignmentStatus;
    resAlignment.className = 'status-badge badge-success';

    if (hasCavity || hasTartar) {
      overallFeedback.innerHTML = `${userData.name || '고객'}님, 분석 결과 <b>${hasCavity ? '초기 충치 의심 부위' : ''}${hasCavity && hasTartar ? '와 ' : ''}${hasTartar ? '치석' : ''}이 발견</b>되었습니다. 스케일링 및 정확한 진단을 위해 가까운 치과 방문을 권장드립니다.`;
    } else {
      overallFeedback.innerHTML = `놀랍습니다 ${userData.name || '고객'}님! 전반적으로 <b>치아 관리가 매우 훌륭하게</b> 이루어지고 있습니다. 현재의 올바른 양치 습관을 계속 유지해주세요.`;
    }
  }

  btnRetry.addEventListener('click', () => {
    // Reset process
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
    stepPreview.src = '';
    guideOverlay.style.display = 'block';
    cameraStream.style.display = 'block';
    
    btnCapture.classList.remove('hidden');
    fallbackUploadLabel.classList.add('hidden');
    btnNextStep.classList.add('hidden');
    btnNextStep.textContent = "다음 단계로";
    btnRetake.classList.add('hidden');

    showSection(inputSection);
  });
});