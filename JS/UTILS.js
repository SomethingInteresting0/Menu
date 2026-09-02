/* =========================
   오디오 요소 (MP3 재생)
========================= */
const hoverAudio = new Audio('./ASSETS/audio/Hover.mp3');
const clickAudio = new Audio('./ASSETS/audio/Click.mp3');

// 볼륨 조절 (0.0 ~ 1.0)
hoverAudio.volume = 0.3; // 올렸을 때 소리
clickAudio.volume = 0.6; // 클릭 소리

// 마우스 올렸을 때 재생 함수
export function playHoverSound() {
  hoverAudio.currentTime = 0; // 빠른 마우스 이동 시 소리 씹힘 방지
  hoverAudio.play().catch(e => console.log("오디오 재생 오류:", e));
}

// 클릭했을 때 재생 함수
export function playClickSound() {
  clickAudio.currentTime = 0; // 연타 시 소리 씹힘 방지
  clickAudio.play().catch(e => console.log("오디오 재생 오류:", e));
}

/* =========================
   Toast
========================= */
export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}

/* =========================
   탭
========================= */
export function showTab(event, tabName) {
  // 1. 모든 탭 콘텐츠 비활성화
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  // 2. 선택한 탭 콘텐츠 활성화 & 스크롤 최상단 이동
  const targetTab = document.getElementById(tabName);
  
  if (targetTab) {
    targetTab.classList.add("active");

    const scrollArea = targetTab.querySelector("ul");
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }

  // 3. 모든 탭 버튼 비활성화
  document.querySelectorAll(".tab-buttons button").forEach(button => {
    button.classList.remove("active");
  });

  // 4. 클릭된 버튼 요소 찾아 활성화 (event.currentTarget 사용)
  if (event) {
    const clickedButton = event.currentTarget; 
    if (clickedButton) {
      clickedButton.classList.add("active");
    }
  }

  // 랜덤 추천이 활성화된 상태에서 '메뉴 리스트(list)' 탭 버튼을 누른 경우!
  const randomArea = document.getElementById("random-recommendation");
  if (tabName === "list" && randomArea && randomArea.classList.contains("active")) {
    if (typeof window.clearAllFilterTags === "function") {
      window.clearAllFilterTags();
    }
  }
}