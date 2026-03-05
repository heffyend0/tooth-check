document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('image-input');
  const inputSection = document.getElementById('input-section');
  const analysisSection = document.getElementById('analysis-section');
  const resultSection = document.getElementById('result-section');
  const imagePreview = document.getElementById('image-preview');
  const btnRetry = document.getElementById('btn-retry');

  // Results elements
  const resCavity = document.querySelector('#result-cavity .status-badge');
  const resTartar = document.querySelector('#result-tartar .status-badge');
  const resAlignment = document.querySelector('#result-alignment .status-badge');
  const overallFeedback = document.getElementById('overall-feedback');

  function showSection(sectionToShow) {
    // Hide all sections first
    const sections = [inputSection, analysisSection, resultSection];
    
    sections.forEach(sec => {
      if (sec !== sectionToShow) {
        sec.classList.remove('active');
        setTimeout(() => {
          sec.classList.add('hidden');
        }, 500); // match CSS transition duration
      }
    });

    // Show target section
    sectionToShow.classList.remove('hidden');
    // small delay to allow display block to apply before animating opacity
    setTimeout(() => {
      sectionToShow.classList.add('active');
    }, 50);
  }

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagePreview.src = event.target.result;
        startAnalysis();
      };
      reader.readAsDataURL(file);
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
      overallFeedback.innerHTML = `분석 결과, <b>${hasCavity ? '초기 충치 의심 부위' : ''}${hasCavity && hasTartar ? '와 ' : ''}${hasTartar ? '치석' : ''}이 발견</b>되었습니다. 스케일링 및 정확한 진단을 위해 가까운 치과 방문을 권장드립니다.`;
    } else {
      overallFeedback.innerHTML = `놀랍습니다! 전반적으로 <b>치아 관리가 매우 훌륭하게</b> 이루어지고 있습니다. 현재의 올바른 양치 습관을 계속 유지해주세요.`;
    }
  }

  btnRetry.addEventListener('click', () => {
    imageInput.value = '';
    showSection(inputSection);
  });
});