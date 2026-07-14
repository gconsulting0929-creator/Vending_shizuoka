# 静岡市 WBGT Monitor v10

실시간 데이터 연결 수정본입니다.

- 온도·습도: 気象庁 アメダス 静岡（50331）
- WBGT: 環境省 静岡（50331）
- GitHub Actions: 10분마다 갱신
- 화면의 更新時刻: 환경성 WBGT 관측 시각
- WBGT 값으로 단계·배경색·문구·캐릭터 자동 변경

## 업로드 후

1. 저장소에 전체 폴더 구조 그대로 업로드
2. Actions → Update Shizuoka Weather
3. Run workflow 실행
4. 초록색 체크 확인
5. data.json을 열어 실제 값 확인

Push 권한 오류 시:
Settings → Actions → General → Workflow permissions →
Read and write permissions → Save
