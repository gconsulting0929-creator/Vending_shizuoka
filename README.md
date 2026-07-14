# 静岡市 WBGT Monitor

GitHub Pages용 실시간 WBGT 모니터입니다.

## 데이터

- 온도·습도: 気象庁 アメダス 静岡（50331）
- WBGT: 環境省 熱中症予防情報サイト 静岡（50331）
- GitHub Actions가 10분마다 `data.json`을 갱신
- 웹페이지는 1분마다 `data.json`을 다시 읽음

## 처음 올린 뒤 실행

1. GitHub 저장소에 모든 파일과 폴더를 업로드합니다.
2. `Actions` 탭을 엽니다.
3. `Update Shizuoka Weather`를 선택합니다.
4. `Run workflow`를 눌러 처음 한 번 수동 실행합니다.
5. 초록색 체크가 뜨면 `data.json`이 실데이터로 바뀝니다.

## GitHub Actions 권한 오류가 날 때

`Settings → Actions → General → Workflow permissions`에서
`Read and write permissions`를 선택한 뒤 저장합니다.

## 출처 표기

표시 데이터는 気象庁 및 環境省의 공개 정보를 사용합니다.
