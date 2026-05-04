const state = {
  foods: [],
  loaded: false
};

let selected = {
  category: [],
  type: [],
  taste: [],
  situation: []
};

const DOM = {
  result: document.getElementById("result"),
  history: document.getElementById("history"),
  message: document.getElementById("message"),
  template: document.getElementById("food-card-template")
};

fetch("foods.json")
  .then(res => {
    if (!res.ok) throw new Error("파일 없음");
    return res.json();
  })
  .then(data => {
    state.foods = data;
    state.loaded = true;

    search();
  })
  .catch(err => {
    console.error(err);
  });

function getFilters() {
  return selectedTags; // 🔥 변경
}

function filterFoods(foods) {
  return foods.filter(f => {

    if (selected.category.length > 0 &&
        !selected.category.some(tag => f.tags.includes(tag))) {
      return false;
    }

    if (selected.type.length > 0 &&
        !selected.type.some(tag => f.tags.includes(tag))) {
      return false;
    }

    if (selected.taste.length > 0 &&
        !selected.taste.some(tag => f.tags.includes(tag))) {
      return false;
    }

    if (selected.situation.length > 0 &&
        !selected.situation.some(tag => f.tags.includes(tag))) {
      return false;
    }

    return true;
  });
}

function isRecent(timeString) {
  const now = new Date();
  const past = new Date(timeString);

  const diff = now - past;
  const hours = diff / (1000 * 60 * 60);

  return hours <= 24;
}

function decorateFoods(list, tags) {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  return list.map(f => {
    const recent = history.some(h =>
      h.name === f.name && isRecent(h.time)
    );

    return {
      ...f,
      reason: makeReason(f, tags, recent)
    };
  });
}

function showTab(e, tabName) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });

  const targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.classList.add("active");

    const scrollArea = targetTab.querySelector("ul");
    if (scrollArea) scrollArea.scrollTop = 0;
  }

  document.querySelectorAll(".tab-buttons button").forEach(btn => {
    btn.classList.remove("active");
  });

  if (e && e.target) {
    e.target.classList.add("active");
  }
}

function randomPick() {
  if (!state.loaded) {
    alert("데이터 로딩중");
    return;
  }

  const f = state.foods[Math.floor(Math.random() * state.foods.length)];

  showTab(null, "list");

  render([{
    ...f,
    reason: f.tags.join(", ")
  }]);
}

function search() {
  if (!state.loaded) {
    if (DOM.message) DOM.message.textContent = "데이터 로딩중";
    return;
  }

  const tags = Object.values(selected).flat();

  let filtered;
  let decorated;

  if (tags.length === 0) {
    filtered = state.foods;

    decorated = filtered.map(f => ({
      ...f,
      reason: f.tags.join(", ")
    }));
  } else {
    filtered = filterFoods(state.foods);

    if (filtered.length === 0) {
      if (DOM.message) DOM.message.textContent = "검색 결과 없음";
      DOM.result.innerHTML = "";
      return;
    }

    decorated = decorateFoods(filtered, tags);
  }

  if (DOM.message) DOM.message.textContent = "";

  render(decorated);
}

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

function render(list) {
  DOM.result.innerHTML = "";

  const fragment = document.createDocumentFragment();

  list.forEach(f => {
    const clone = DOM.template.content.cloneNode(true);

    clone.querySelector(".card-title").textContent = f.name;
    clone.querySelector(".card-reason").textContent = f.reason || "";

    const img = clone.querySelector(".card-image");
    img.src = f.image || "";
    img.alt = f.name;

    clone.querySelector(".card").onclick = () => {
      saveHistory(f.name);
      renderHistory();

      showToast(`${f.name} 선택됨`);
    };


    fragment.appendChild(clone);
  });

  DOM.result.appendChild(fragment);
}

function saveHistory(foodName) {
  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.push({
    name: foodName,
    time: new Date().toISOString()
  });

  if (history.length > 10) {
    history = history.slice(-10);
  }

  localStorage.setItem("history", JSON.stringify(history));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const ul = document.getElementById("history");

  ul.innerHTML = "";

  history.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.className = "history-item";

    li.textContent = `${item.name} - ${formatDate(item.time)}`;

    ul.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem("history");
  renderHistory();
}

function makeReason(f, tags, historyMatched) {
  let text = "";

  if (tags.length > 0) {
    const matchedTags = tags.filter(tag => f.tags.includes(tag)); // 🔥 핵심 수정
    text = matchedTags.join(", ");
  }

  if (historyMatched) {
    text += (text ? " " : "") + "(최근 메뉴)";
  }

  return text;
}

/* 🔥 태그 클릭 + 자동 검색 */
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("tag-btn")) return;

  const tag = e.target.dataset.tag;
  const group = e.target.dataset.group;

  const arr = selected[group];

  if (arr.includes(tag)) {
    selected[group] = arr.filter(t => t !== tag);
    e.target.classList.remove("active");
  } else {
    selected[group].push(tag);
    e.target.classList.add("active");
  }

  renderSelectedTags();
  search();
});

/* 🔥 선택된 태그 UI */
function renderSelectedTags() {
  const container = document.getElementById("selected-tags");
  if (!container) return;

  container.innerHTML = "";

  Object.values(selected).flat().forEach(tag => {
    const el = document.createElement("div");
    el.className = "selected-tag";
    el.innerHTML = `${tag} <span>✕</span>`;

    el.onclick = () => {
      for (let key in selected) {
        selected[key] = selected[key].filter(t => t !== tag);
      }

      document.querySelectorAll(".tag-btn").forEach(btn => {
        if (btn.dataset.tag === tag) {
          btn.classList.remove("active");
        }
      });

      renderSelectedTags();
      search();
    };

    container.appendChild(el);
  });
}

document.getElementById("clear-tags").onclick = () => {
  selected = {
    category: [],
    type: [],
    taste: [],
    situation: []
  };

  document.querySelectorAll(".tag-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  renderSelectedTags();
  search();
};

function showToast(msg) {
  const toast = document.getElementById("toast");

  toast.textContent = msg;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}

function closeFloating() {
  document.getElementById("floatingInfo").style.display = "none";
}

window.search = search;
window.randomPick = randomPick;

renderHistory();