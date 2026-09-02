import { state, selected, resetSelected } from "./state.js";
import { playHoverSound, playClickSound, showToast, showTab } from "./utils.js";

/* =========================
   DOM 요소
========================= */
const DOM = {
  result: document.getElementById("result"),
  history: document.getElementById("history"),
  message: document.getElementById("message"),
  template: document.getElementById("food-card-template"),

  // 랜덤 추천
  randomRecommendation: document.getElementById("random-recommendation"),
  randomImage: document.getElementById("random-image"),
  randomFoodName: document.getElementById("random-food-name"),
  randomDescription: document.getElementById("random-description"),
  randomTags: document.getElementById("random-tags"),
  randomSelect: document.getElementById("random-select"),
  randomButton: document.getElementById("random-button"),

  // 음식 상세 팝업
  foodModal: document.getElementById("food-modal"),
  foodModalImage: document.getElementById("food-modal-image"),
  foodModalTitle: document.getElementById("food-modal-title"),
  foodModalDescription: document.getElementById("food-modal-description"),
  foodModalTags: document.getElementById("food-modal-tags"),
  foodModalSelect: document.getElementById("food-modal-select"),
  foodModalClose: document.getElementById("food-modal-close"),

  // 선택된 태그
  selectedTags: document.getElementById("selected-tags"),
  clearTags: document.getElementById("clear-tags"),

  // 토스트
  toast: document.getElementById("toast"),
};

/* =========================
   음식 데이터 불러오기
========================= */
fetch("./js/foods.json")
  .then(res => {
    if (!res.ok) {
      throw new Error("foods.json 파일을 불러올 수 없습니다.");
    }
    return res.json();
  })
  .then(data => {
    state.foods = data.map(food => {
      // 슬래시와 띄어쓰기를 모두 언더바('_')로 치환
      const fileName = food.name
        .replaceAll('/', '_')
        .replaceAll(' ', '_'); // 띄어쓰기를 '_'로 변경

      return {
        ...food,
        image: `ASSETS/food_images/${fileName}.jpg`
    };
  });

    state.loaded = true;
    search();

  })
  .catch(err => {
    console.error(err);

    if (DOM.message) {
      DOM.message.textContent = "음식 데이터를 불러오지 못했습니다.";
    }
  });

// 화면 크기가 900px 이상으로 커지면 모든 details를 자동으로 펼침
window.addEventListener('resize', () => {
  if (window.innerWidth >= 900) {
    document.querySelectorAll('details.filter-category').forEach(details => {
      details.setAttribute('open', '');
    });
  }
});

/* =========================
   음식 필터
========================= */
function filterFoods(foods) {
  return foods.filter(food => {

    if (
      selected.category.length > 0 &&
      !selected.category.some(tag => food.tags.includes(tag))
    ) {
      return false;
    }

    if (
      selected.type.length > 0 &&
      !selected.type.some(tag => food.tags.includes(tag))
    ) {
      return false;
    }

    if (
      selected.taste.length > 0 &&
      !selected.taste.some(tag => food.tags.includes(tag))
    ) {
      return false;
    }

    if (
      selected.situation.length > 0 &&
      !selected.situation.some(tag => food.tags.includes(tag))
    ) {
      return false;
    }

    return true;
  });
}

/* =========================
   최근 선택 여부
========================= */
function isRecent(timeString) {
  const now = new Date();
  const past = new Date(timeString);

  const diff = now - past;
  const hours = diff / (1000 * 60 * 60);

  return hours >= 0 && hours <= 24;
}

/* =========================
   음식 결과에 부가 정보 추가
========================= */
function decorateFoods(list, tags) {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  return list.map(food => {
    const recent = history.some(historyItem =>
      historyItem.name === food.name &&
      isRecent(historyItem.time)
    );

    return {
      ...food,
      reason: makeReason(food, tags, recent)
    };
  });
}

/* =========================
   랜덤 추천
========================= */
export function randomPick() {
  if (!state.loaded) {
    alert("데이터 로딩중");
    return;
  }

  if (state.foods.length === 0) {
    return;
  }

  const food = state.foods[Math.floor(Math.random() * state.foods.length)];

  showTab(null, "list");

  randomRender(food);
}

/* =========================
   음식 검색
========================= */
export function search() {
  if (!state.loaded) {
    if (DOM.message) {
      DOM.message.textContent = "데이터 로딩중";
    }
    return;
  }

  if (DOM.randomRecommendation) {
    DOM.randomRecommendation.classList.remove("active");
  }

  const tags = Object.values(selected).flat();

  let filtered;
  let decorated;

  // 필터가 없는 경우
  if (tags.length === 0) {
    filtered = state.foods;
    decorated = filtered.map(food => ({
      ...food,
      reason: ""
    }));
  }
  // 필터가 있는 경우
  else {
    filtered = filterFoods(state.foods);

    if (filtered.length === 0) {
      if (DOM.message) {
        DOM.message.textContent = "검색 결과 없음";
      }

      if (DOM.result) {
        DOM.result.innerHTML = "";
      }

      return;
    }

    decorated = decorateFoods(filtered, tags);
  }

  if (DOM.message) {
    DOM.message.textContent = "";
  }

  render(decorated);
}

/* =========================
   날짜 포맷
========================= */
function formatDate(timeString) {
  const date = new Date(timeString);
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  const day = days[date.getDay()];
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();

  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}년 ${mm}월 ${dd}일 (${day}) ${hh}:${min}`;
}

/* =========================
   음식 카드 렌더링
========================= */
function render(list) {
  if (!DOM.result || !DOM.template) {
    return;
  }

  DOM.result.innerHTML = "";

  const fragment = document.createDocumentFragment();

  list.forEach(food => {
    const clone = DOM.template.content.cloneNode(true);

    const card = clone.querySelector(".card");
    const title = clone.querySelector(".card-title");
    const reason = clone.querySelector(".card-reason");
    const image = clone.querySelector(".card-image");
    const body = clone.querySelector(".card-body");

    // 음식 이름
    if (title) {
      title.textContent = food.name;
    }

    // 추천 이유
    if (reason) {
      reason.textContent = food.reason || "";
    }

    // 추천 이유가 없으면 세로 중앙 정렬
    if (body) {
      if (food.reason) {
        body.classList.add("has-reason");
      } else {
        body.classList.remove("has-reason");
      }
    }

    // 음식 이미지
    if (image) {
      image.src = food.image || "";
      image.alt = food.name;
    }

    // 음식 카드 클릭 → 상세 팝업
    if (card) {
      card.onclick = () => {
        openFoodModal(food);
      };
    }

    fragment.appendChild(clone);
  });

  DOM.result.appendChild(fragment);
}

/* =========================
   랜덤 추천 전용 렌더링
========================= */
function randomRender(food) {
  if (!DOM.result) {
    return;
  }

  //일반 메뉴 리스트 숨기기
  DOM.result.innerHTML = "";

  // 랜덤 추천 영역 표시
  DOM.randomRecommendation.classList.add("active");

  /* 음식 이미지 */
  if (DOM.randomImage) {
    DOM.randomImage.src = food.image || "";
    DOM.randomImage.alt = food.name;
  }

  /* 음식 이름 */
  if (DOM.randomFoodName) {
    DOM.randomFoodName.textContent = food.name;
  }

  /* 음식 설명 */
  if (DOM.randomDescription) {
    DOM.randomDescription.textContent =
      food.description || "이 음식에 대한 설명이 없습니다.";
  }

  /* 태그 */
  if (DOM.randomTags) {
    DOM.randomTags.innerHTML = "";

    if (food.tags) {
      food.tags.forEach(tag => {
        const tagElement = document.createElement("span");
        tagElement.className = "random-tag";
        tagElement.textContent = tag;
        DOM.randomTags.appendChild(tagElement);
      });
    }
  }

  /* 메뉴 선택 */
  if (DOM.randomSelect) {
    DOM.randomSelect.onclick = () => {
      saveHistory(food.name);
      renderHistory();
      showToast(`${food.name} 선택됨`);
    };
  }
}

/* =========================
   음식 상세 팝업 열기
========================= */
function openFoodModal(food) {
  if (!DOM.foodModal) {
    return;
  }

  // 이미지
  if (DOM.foodModalImage) {
    DOM.foodModalImage.src = food.image || "";
    DOM.foodModalImage.alt = food.name;
  }

  // 음식 이름
  if (DOM.foodModalTitle) {
    DOM.foodModalTitle.textContent = food.name;
  }

  // 음식 설명
  if (DOM.foodModalDescription) {
    DOM.foodModalDescription.textContent =
      food.description || "이 음식에 대한 설명이 없습니다.";
  }

  // 태그
  if (DOM.foodModalTags) {
    DOM.foodModalTags.innerHTML = "";

    const tags = food.tags || [];

    tags.forEach(tag => {
      const tagElement = document.createElement("span");
      tagElement.className = "food-modal-tag";
      tagElement.textContent = tag;
      DOM.foodModalTags.appendChild(tagElement);
    });
  }

  // 메뉴 고르기 버튼
  if (DOM.foodModalSelect) {
    DOM.foodModalSelect.onclick = () => {
      saveHistory(food.name);
      renderHistory();
      closeFoodModal();
      showToast(`${food.name} 선택됨`);
    };
  }

  // 팝업 열기
  DOM.foodModal.classList.add("active");
  document.body.classList.add("modal-open");
}

/* =========================
   음식 상세 팝업 닫기
========================= */
export function closeFoodModal() {
  if (!DOM.foodModal) {
    return;
  }

  DOM.foodModal.classList.remove("active");
  document.body.classList.remove("modal-open");
}

/* =========================
   음식 팝업 이벤트
========================= */

// X 버튼
if (DOM.foodModalClose) {
  DOM.foodModalClose.addEventListener("click", closeFoodModal);
}

// 팝업 바깥쪽 클릭
if (DOM.foodModal) {
  DOM.foodModal.addEventListener("click", event => {
    if (event.target === DOM.foodModal) {
      closeFoodModal();
    }
  });
}

// ESC 키
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeFoodModal();
  }
});

/* =========================
   식사 기록 저장
========================= */
function saveHistory(foodName) {
  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.push({
    name: foodName,
    time: new Date().toISOString()
  });

  // 최근 50개만 저장
  if (history.length > 50) {
    history = history.slice(-50);
  }

  localStorage.setItem("history", JSON.stringify(history));
}

/* =========================
   식사 기록 표시
========================= */
function renderHistory() {
  if (!DOM.history) {
    return;
  }

  const history = JSON.parse(localStorage.getItem("history")) || [];

  DOM.history.innerHTML = "";

  history
    .slice()
    .reverse()
    .forEach(item => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.textContent = `${item.name} - ${formatDate(item.time)}`;
      DOM.history.appendChild(li);
    });
}

/* =========================
   식사 기록 초기화
========================= */
export function clearHistory() {
  localStorage.removeItem("history");
  renderHistory();
}

/* =========================
   음식 추천 이유
========================= */
function makeReason(food, tags, historyMatched) {
  let text = "";

  if (tags.length > 0) {
    const matchedTags = tags.filter(tag => food.tags.includes(tag));
    text = matchedTags.join(", ");
  }

  if (historyMatched) {
    text += (text ? " " : "") + "(최근 메뉴)";
  }

  return text;
}

/* =========================
   필터 태그 클릭 & 오디오 이벤트
========================= */
document.addEventListener("click", event => {

  if (!event.target.classList.contains("tag-btn")) {
    return;
  }

  // 모든 버튼에서 클릭 소리 재생
  playClickSound();

  const tag = event.target.dataset.tag;
  const group = event.target.dataset.group;

  if (!selected[group]) {
    return;
  }

  const arr = selected[group];

  if (arr.includes(tag)) {
    selected[group] = arr.filter(t => t !== tag);
    event.target.classList.remove("active");
  } else {
    selected[group].push(tag);
    event.target.classList.add("active");
  }

  renderSelectedTags();
  search();
});

// 태그 버튼 호버 사운드
document.addEventListener("mouseover", event => {
  if (event.target.classList.contains("tag-btn")) {
    playHoverSound();
  }
});


/* =========================
   선택된 태그 UI
========================= */
function renderSelectedTags() {
  if (!DOM.selectedTags) {
    return;
  }

  DOM.selectedTags.innerHTML = "";

  Object.values(selected)
    .flat()
    .forEach(tag => {
      const element = document.createElement("div");
      element.className = "selected-tag";
      element.innerHTML = `${tag} <span>✕</span>`;

      element.onclick = () => {
        for (const key in selected) {
          selected[key] = selected[key].filter(t => t !== tag);
        }

        document.querySelectorAll(".tag-btn").forEach(button => {
          if (button.dataset.tag === tag) {
            button.classList.remove("active");
          }
        });

        renderSelectedTags();
        search();
      };

      DOM.selectedTags.appendChild(element);
    });
}

/* =========================
   전체 태그 초기화
========================= */
export function clearAllFilterTags() {
  resetSelected();

  document.querySelectorAll(".tag-btn").forEach(button => {
    button.classList.remove("active");
  });

  renderSelectedTags();
  search();
}

if (DOM.clearTags) {
  DOM.clearTags.onclick = clearAllFilterTags;
}

/* =========================
   전역 함수 바인딩 (HTML inline onclick용)
========================= */
window.search = search;
window.randomPick = randomPick;
window.showTab = showTab;
window.closeFoodModal = closeFoodModal;
window.clearHistory = clearHistory;
window.clearAllFilterTags = clearAllFilterTags;

/* =========================
   초기화 실행
========================= */
renderHistory();