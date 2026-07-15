# WBGT Monitor — 코드 전용 최종 수정본

이미지 파일은 포함하지 않았습니다.
기존 GitHub 저장소의 `images` 폴더는 삭제하지 말고 그대로 유지하세요.

수정 내용:
- 상단 날짜/시간 영역이 우측 화면 영역을 침범하지 않도록 완전히 제한
- 중앙 제목도 지정 영역 밖으로 넘치지 않게 처리
- WBGT 글씨를 감싸는 타원형 배경색이 현재 단계 배경색과 동일하게 변경
- 실시간 데이터 연동 및 GitHub Actions 유지

덮어쓸 파일:
- index.html
- style.css
- script.js
- data.json
- scripts/update_data.py
- .github/workflows/update-weather.yml
