# `/board` 게시판 XSS 취약점 조치 이행 점검 정리

## 1. 점검 대상

- 대상 URL: `/board`
- 대상 기능: 문의게시판 목록, 상세조회, 글쓰기, 관리자 답변 등록
- 취약점 유형: Cross Site Scripting (XSS)

## 2. 기존 취약점 진단 결과 요약

기존 `/board` 화면은 사용자 입력값을 그대로 렌더링하는 구간이 존재했다.

- 게시글 제목이 `href={b.title}` 형태로 렌더링되어 속성 기반 Injection 가능성이 있었다.
- 게시글 본문과 관리자 답변이 `dangerouslySetInnerHTML`로 출력되고 있어, `<script>`, `<img onerror=...>`, `<svg onload=...>` 같은 악성 태그가 그대로 실행될 수 있었다.
- 관리 화면도 동일한 렌더링 구조를 사용하고 있어, 사용자 화면과 관리자 화면 모두 XSS 영향 범위에 포함되었다.

## 3. 최초 대응 방안과 조치 이행 비교

| 대응 방안 | 이행 여부 | 점검 결과 |
| --- | --- | --- |
| 1. 서버 사이드에서 HTML 특수문자 이스케이프 처리 적용 | 이행 완료 | `BoardResponse` 변환 단계에서 제목, 내용, 작성자, 답변 등 사용자 입력 필드를 `HtmlUtils.htmlEscape()`로 이스케이프하도록 변경하였다. |
| 2. 클라이언트에서 `dangerouslySetInnerHTML` 제거 | 이행 완료 | 사용자/관리자 게시판에서 HTML 직접 삽입 렌더링을 모두 제거하고, 일반 텍스트 렌더링으로 변경하였다. |
| 3. DOMPurify 라이브러리를 통한 악성 태그 필터링 적용 | 이행 완료 | 사용자/관리자 프론트엔드에 DOMPurify를 추가하고, 게시글/답변 입력값과 화면 표시값 모두 안전한 일반 텍스트 기준으로 정제하도록 적용하였다. |

## 4. 전체 수정 내용

### 4.1 서버 사이드 출력 이스케이프 적용

게시글 데이터가 API 응답으로 나가기 전에 서버에서 HTML 특수문자를 이스케이프하도록 변경하였다.

- 적용 위치: `BoardResponse.from(Board board)`
- 적용 대상: `title`, `content`, `authorName`, `allowedUsers`, `answer`, `answerAuthorName`
- 적용 방식: `HtmlUtils.htmlEscape()`

이로 인해 게시글에 `<script>alert(1)</script>`가 저장되어 있더라도 API 응답에서는 `&lt;script&gt;alert(1)&lt;/script&gt;` 형태로 반환된다.

### 4.2 클라이언트 HTML 직접 렌더링 제거

기존에는 상세조회 팝업에서 본문과 답변을 `dangerouslySetInnerHTML`로 출력하고 있었다.  
현재는 이를 모두 제거하고, `Typography` 기반 일반 문자열 렌더링으로 변경하였다.

또한 제목 목록에서도 `href={b.title}` 형태를 제거하고, 게시글 상세 모달을 여는 일반 버튼 컴포넌트로 변경하였다.

### 4.3 DOMPurify 기반 입력/표시 정제 적용

프론트엔드에는 `safeHtml.ts` 유틸리티를 추가하여 DOMPurify를 공통으로 사용하도록 구성하였다.

- `sanitizeBoardInput()`
  - 글쓰기/답변 저장 시 입력값에서 허용되지 않은 태그와 속성을 제거
- `toSafePlainText()`
  - 서버에서 이스케이프된 문자열을 DOMPurify로 한 번 더 정제
  - 필요한 경우 HTML 엔티티를 디코딩한 뒤 일반 텍스트로만 표시

이 방식으로 사용자 입력이 태그 형태로 들어오더라도 화면에서는 실행되지 않고, 일반 문자열로만 보이게 된다.

### 4.4 사용자 화면과 관리자 화면 동시 보완

`/board`의 실제 영향 범위는 사용자 포털뿐 아니라 관리자 게시판 관리 화면까지 포함되므로 두 화면을 함께 수정하였다.

- 사용자 화면: 게시글 목록/상세조회/글쓰기
- 관리자 화면: 게시글 목록/상세조회/새 글 작성/답변 저장

## 5. 적용 방식

### 5.1 서버 사이드 HTML 특수문자 이스케이프 처리 적용 방식

본 조치에서는 게시글 엔티티 자체를 가공하는 대신, API 응답 DTO 변환 단계에서 출력 이스케이프를 적용하였다.

- 변경 전
  - 사용자가 입력한 원본 문자열이 그대로 응답 본문에 포함됨
- 변경 후
  - `BoardResponse.from()`에서 `HtmlUtils.htmlEscape()` 적용 후 응답

이 방식은 저장 데이터와 출력 데이터를 분리하면서, 화면 렌더링 이전 단계에서 1차 방어를 수행하는 구조이다.

### 5.2 `dangerouslySetInnerHTML` 제거 방식

- 변경 전
  - `dangerouslySetInnerHTML={{ __html: selectedBoard.content }}`
  - `dangerouslySetInnerHTML={{ __html: selectedBoard.answer }}`
- 변경 후
  - `Typography` 컴포넌트에 일반 문자열을 직접 바인딩
  - `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'`로 텍스트 가독성 유지

이 변경으로 브라우저가 게시글 본문을 HTML로 해석하지 않고 문자열로만 처리하게 된다.

### 5.3 DOMPurify 적용 방식

DOMPurify는 사용자 입력을 클라이언트에서 저장하기 전에 한 번 정제하고, 서버 응답을 화면에 표시하기 전에도 한 번 더 정제하는 용도로 사용하였다.

- 입력 정제: `sanitizeBoardInput()`
- 표시 정제: `toSafePlainText()`
- 옵션: `ALLOWED_TAGS: []`, `ALLOWED_ATTR: []`

즉, 태그와 속성은 허용하지 않고 텍스트만 남기는 방식으로 적용하였다.

## 6. 수정 파일

### 백엔드

- `backend/src/main/java/com/mycard/api/dto/board/BoardResponse.java`
- `backend/src/test/java/com/mycard/api/dto/board/BoardResponseTest.java`

### 프론트엔드

- `frontend-user/src/pages/InquiryBoardPage.tsx`
- `frontend-user/src/utils/safeHtml.ts`
- `frontend-user/package.json`
- `frontend-admin/src/pages/AdminInquiryBoardPage.tsx`
- `frontend-admin/src/utils/safeHtml.ts`
- `frontend-admin/package.json`

### 문서

- `docs/board-xss-remediation.md`

## 7. 파일별 수정 전 / 수정 후 코드 비교

### 7.1 `backend/src/main/java/com/mycard/api/dto/board/BoardResponse.java`

#### 수정 전

```java
public static BoardResponse from(Board board) {
    return BoardResponse.builder()
            .id(board.getId())
            .title(board.getTitle())
            .content(board.getContent())
            .authorName(board.getAuthorName())
            .answer(board.getAnswer())
            .answerAuthorName(board.getAnswerAuthorName())
            .build();
}
```

#### 수정 후

```java
private static String escapeHtml(String value) {
    return value == null ? null : HtmlUtils.htmlEscape(value);
}

public static BoardResponse from(Board board) {
    return BoardResponse.builder()
            .id(board.getId())
            .title(escapeHtml(board.getTitle()))
            .content(escapeHtml(board.getContent()))
            .authorName(escapeHtml(board.getAuthorName()))
            .allowedUsers(escapeHtml(board.getAllowedUsers()))
            .answer(escapeHtml(board.getAnswer()))
            .answerAuthorName(escapeHtml(board.getAnswerAuthorName()))
            .build();
}
```

#### 핵심 변경 사항

- 게시판 API 응답 필드에 서버 사이드 HTML 이스케이프 적용
- 클라이언트가 원본 HTML을 직접 받지 않도록 출력 단계 강화

### 7.2 `backend/src/test/java/com/mycard/api/dto/board/BoardResponseTest.java`

#### 수정 전

```java
// 관련 테스트 없음
```

#### 수정 후

```java
@Test
void fromEscapesHtmlSensitiveFields() {
    Board board = Board.builder()
            .title("<script>alert(1)</script>")
            .content("<img src=x onerror=alert(1)>content")
            .answer("<svg onload=alert(1)>answer</svg>")
            .build();

    BoardResponse response = BoardResponse.from(board);

    assertThat(response.getTitle()).isEqualTo("&lt;script&gt;alert(1)&lt;/script&gt;");
    assertThat(response.getContent()).isEqualTo("&lt;img src=x onerror=alert(1)&gt;content");
    assertThat(response.getAnswer()).isEqualTo("&lt;svg onload=alert(1)&gt;answer&lt;/svg&gt;");
}
```

#### 핵심 변경 사항

- 서버 사이드 이스케이프가 실제로 적용되는지 단위 테스트 추가

### 7.3 `frontend-user/src/pages/InquiryBoardPage.tsx`

#### 수정 전

```tsx
<TableCell>
  <a href={b.title} onClick={(e) => { e.preventDefault(); openBoardDetail(b.id); }}>
    {b.title}
  </a>
</TableCell>

<Box sx={{ mt: 2, p: 2 }}>
  <div dangerouslySetInnerHTML={{ __html: selectedBoard.content }} />
</Box>
```

#### 수정 후

```tsx
<TableCell>
  <Button
    variant="text"
    onClick={() => openBoardDetail(b.id)}
    sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', textTransform: 'none' }}
  >
    {toSafePlainText(b.title)}
  </Button>
</TableCell>

<Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, minHeight: 100 }}>
  <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
    {toSafePlainText(selectedBoard.content)}
  </Typography>
</Box>
```

#### 핵심 변경 사항

- 제목의 `href` 속성 기반 렌더링 제거
- 게시글 본문/답변의 `dangerouslySetInnerHTML` 제거
- 안전한 문자열 렌더링 유틸리티 적용

### 7.4 `frontend-admin/src/pages/AdminInquiryBoardPage.tsx`

#### 수정 전

```tsx
<TableCell>
  <a href={b.title} onClick={(e) => { e.preventDefault(); openBoardDetail(b.id); }}>
    {b.title}
  </a>
</TableCell>

<div dangerouslySetInnerHTML={{ __html: selectedBoard.answer }} />
```

#### 수정 후

```tsx
<TableCell>
  <Button
    variant="text"
    onClick={() => openBoardDetail(b.id)}
    sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', textTransform: 'none' }}
  >
    {toSafePlainText(b.title)}
  </Button>
</TableCell>

<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
  {toSafePlainText(selectedBoard.answer)}
</Typography>
```

#### 핵심 변경 사항

- 관리자 화면의 동일한 XSS 경로 제거
- 답변 저장/조회 모두 DOMPurify 기준으로 정제

### 7.5 `frontend-user/src/utils/safeHtml.ts`

#### 수정 전

```ts
// 파일 없음
```

#### 수정 후

```ts
import DOMPurify from 'dompurify';

export const sanitizeBoardInput = (value: string) =>
  DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export const toSafePlainText = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const sanitized = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return decodeHtmlEntities(sanitized);
};
```

#### 핵심 변경 사항

- 게시판 전용 안전 문자열 처리 유틸리티 추가
- 입력값 정제와 표시값 정제를 공통 함수로 일원화

### 7.6 `frontend-admin/src/utils/safeHtml.ts`

#### 수정 전

```ts
// 파일 없음
```

#### 수정 후

```ts
import DOMPurify from 'dompurify';

export const sanitizeBoardInput = (value: string) =>
  DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export const toSafePlainText = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const sanitized = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return decodeHtmlEntities(sanitized);
};
```

#### 핵심 변경 사항

- 관리자 포털도 동일한 보안 처리 로직 사용
- 사용자/관리자 간 처리 편차 제거

### 7.7 `frontend-user/package.json`

#### 수정 전

```json
{
  "dependencies": {
    "axios": "^1.8.2",
    "react": "^18.3.1"
  }
}
```

#### 수정 후

```json
{
  "dependencies": {
    "axios": "^1.8.2",
    "dompurify": "^3.3.3",
    "react": "^18.3.1"
  }
}
```

#### 핵심 변경 사항

- DOMPurify 의존성 추가

### 7.8 `frontend-admin/package.json`

#### 수정 전

```json
{
  "dependencies": {
    "axios": "^1.8.2",
    "react": "^18.3.1"
  }
}
```

#### 수정 후

```json
{
  "dependencies": {
    "axios": "^1.8.2",
    "dompurify": "^3.3.3",
    "react": "^18.3.1"
  }
}
```

#### 핵심 변경 사항

- 관리자 포털에도 DOMPurify 의존성 추가

## 8. 재점검 기준

조치 후에는 아래와 같은 결과가 나와야 한다.

- 제목에 `javascript:alert(1)` 또는 `<script>alert(1)</script>` 입력 시
  - 링크 속성으로 해석되지 않아야 함
  - 화면에는 일반 텍스트로만 표시되어야 함
- 본문에 `<img src=x onerror=alert(1)>` 입력 시
  - 상세조회 화면에서 스크립트가 실행되지 않아야 함
  - 악성 태그는 제거되거나 문자열로만 표시되어야 함
- 관리자 답변에 `<svg onload=alert(1)>` 입력 시
  - 사용자 화면과 관리자 화면 모두 실행되지 않아야 함
- 브라우저 개발자도구 기준
  - 게시글 상세 DOM에 `dangerouslySetInnerHTML` 기반 삽입 흔적이 없어야 함

## 9. 최종 판단

`/board` 게시판 XSS 취약점에 대해 최초에 제시한 대응 방안은 모두 코드 기준으로 이행 완료되었다.

- 서버 사이드 HTML 특수문자 이스케이프 처리 적용: 이행 완료
- 클라이언트 `dangerouslySetInnerHTML` 제거: 이행 완료
- DOMPurify 라이브러리를 통한 악성 태그 필터링 적용: 이행 완료

따라서 본 건은 **백엔드 출력 이스케이프 + 프론트엔드 안전 렌더링 + 클라이언트 입력 정제**가 모두 적용된 상태로 판단할 수 있다.
