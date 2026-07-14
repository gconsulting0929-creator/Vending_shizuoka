# 静岡市 WBGT Monitor — Final

PPT 시안을 기준으로 최종 위치를 조정한 실시간 데이터 연동판입니다.

## 데이터
- 온도·습도: 気象庁 アメダス 静岡（50331）
- WBGT: 環境省 静岡（50331）
- GitHub Actions가 10분마다 `data.json` 갱신
- 화면은 1분마다 `data.json` 재조회
- `更新時刻`에는 환경성 WBGT 관측 시각 표시
- WBGT 수치에 따라 5단계 배경색·문구·캐릭터 자동 변경

## 업로드
저장소에 아래 구조를 그대로 덮어쓰세요.

- index.html
- style.css
- script.js
- data.json
- images/
- scripts/update_data.py
- .github/workflows/update-weather.yml

## 최초 실행
Actions → Update Shizuoka Weather → Run workflow

Push 권한 오류 시:
Settings → Actions → General → Workflow permissions →
Read and write permissions → Save
