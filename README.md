# 쇼핑 리스트 앱

순수 HTML/CSS/JS로 만든 쇼핑 리스트 웹 앱입니다.

## 기능

- 아이템 추가 (버튼 클릭 또는 Enter 키)
- 아이템 체크/체크 해제
- 아이템 삭제
- 완료 현황 표시 (`n / n 완료`)
- localStorage로 새로고침 후에도 데이터 유지

## 실행

`index.html` 파일을 브라우저에서 열면 바로 사용할 수 있습니다.

## 테스트

Playwright를 사용한 E2E 테스트가 포함되어 있습니다.

```bash
npm install playwright
node test.mjs
```
