// 전체 음식 데이터 및 로딩 상태
export const state = {
  foods: [],
  loaded: false
};

// 사용자가 선택한 필터 태그
export const selected = {
  category: [],
  type: [],
  taste: [],
  situation: []
};

// 태그 선택 초기화 (참조 깨짐 방지를 위해 객체 내부 배열만 비우는 함수)
export function resetSelected() {
  selected.category = [];
  selected.type = [];
  selected.taste = [];
  selected.situation = [];
}