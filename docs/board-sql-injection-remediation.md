# `/board` 게시판 SQL Injection 취약점 조치 이행 점검 정리

## 1. 점검 대상

- 대상 URL: `/board`
- 대상 기능: 게시판 문의 화면의 게시글 검색, 상세조회, 등록, 수정, 삭제
- 취약점 유형: SQL Injection

## 2. 기존 취약점 진단 결과 요약

기존 `/board` 기능은 사용자 입력값이 SQL 문자열에 직접 결합되는 구조였다.  
그 결과 검색창에 `' OR 1=1 #`, `UNION SELECT ...` 등의 구문을 입력했을 때 검색 조건과 관계없이 전체 게시물이 조회되거나, 서버가 비정상 입력에 대해서도 `HTTP 200 OK`를 반환하는 문제가 있었다.

또한 `BoardService.java`에서 `EntityManager.createNativeQuery()`를 사용하면서 `keyword`, `category`, `id` 값을 문자열로 직접 이어 붙이고 있었기 때문에 SQL Injection 공격에 취약한 상태였다.

## 3. 최초 대응 방안과 조치 이행 비교

| 대응 방안 | 이행 여부 | 점검 결과 |
| --- | --- | --- |
| 1. Prepared Statement 또는 JPA 파라미터 바인딩 적용할 것 | 이행 완료 | 문자열 결합 기반 Native SQL을 제거하고, JPA Repository + 파라미터 바인딩 방식으로 변경하였다. |
| 2. 입력값에 대한 서버 사이드 화이트리스트 필터링 적용할 것 | 이행 완료 | `keyword`, `category`, `id`에 대해 서버에서 허용 형식과 허용값 검증을 수행하도록 변경하였다. |
| 3. DB 계정 최소 권한 원칙 적용할 것 | 부분 이행 | 코드/설정/예시 SQL은 반영하였으나, 실제 운영 DB 계정 권한 변경은 운영 환경에서 별도 적용이 필요하다. |

## 4. 전체 수정 내용

### 4.1 SQL 실행 방식 변경

기존에는 `BoardService`에서 SQL문을 문자열로 직접 조합한 뒤 `EntityManager.createNativeQuery()`로 실행하고 있었다.  
현재는 `BoardRepository`를 신설하여 JPA `@Query` 기반 조회로 변경하였고, 검색 조건인 `keyword`, `category`, `userName`은 모두 파라미터 바인딩으로 처리하도록 수정하였다.

또한 등록, 수정, 삭제도 직접 SQL을 생성하지 않고 `JpaRepository`의 `save()`, `findById()`, `delete()`를 사용하도록 변경하였다.

### 4.2 서버 사이드 입력값 검증 추가

검색 및 상세조회에 사용되는 입력값에 대해 서버에서 직접 검증하도록 보완하였다.

- `keyword`
  - 공백 제거 후 최대 100자까지 허용
  - 문자, 숫자, 공백, 일부 일반적인 문장부호만 허용
  - SQL 제어문이나 특수문자 기반 우회 입력은 차단
- `category`
  - 허용값만 통과하도록 화이트리스트 적용
  - 허용값: `전체`, `사이트 문의`, `금융 문의`
- `id`
  - 숫자 형식만 허용
  - `1 OR 1=1` 같은 입력은 `400 Bad Request`로 차단
- 등록/수정 요청 본문
  - 제목, 내용 필수값 검증
  - 제목/내용/답변/허용 사용자 목록 길이 제한 검증
  - 허용 사용자 이름 형식 검증

### 4.3 예외 처리 방식 정리

허용되지 않은 검색어, 잘못된 게시글 ID, 유효하지 않은 카테고리 등의 경우 서버가 그대로 쿼리를 실행하지 않고 `BadRequestException`을 발생시키도록 변경하였다.  
권한이 없는 사용자가 비공개 게시글을 조회하거나 수정/삭제를 시도하는 경우에는 `AccessDeniedException`으로 차단하도록 정리하였다.

### 4.4 운영 설정 보완

DB 최소 권한 원칙을 반영할 수 있도록 운영 설정도 함께 정리하였다.

- `application.yml`의 `ddl-auto`를 환경변수 기반으로 변경
- 운영 예시 환경파일에 `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` 추가
- 애플리케이션 전용 계정 `mycard_app` 기준의 최소 권한 SQL 예시 추가

## 5. 적용 방식

### 5.1 Prepared Statement 또는 JPA 파라미터 바인딩 적용 방식

본 조치에서는 직접 `PreparedStatement`를 작성하는 대신, Spring Data JPA의 파라미터 바인딩 방식을 적용하였다.

- 변경 전
  - `SELECT * FROM boards WHERE ... title LIKE '%" + keyword + "%' ...`
  - 사용자 입력이 SQL 문자열에 직접 삽입됨
- 변경 후
  - `@Query`와 `:keyword`, `:category`, `:userName` 파라미터 사용
  - 사용자 입력은 SQL 구조가 아니라 값으로만 전달됨

이 방식으로 `' OR 1=1 #`, `UNION SELECT ...` 같은 입력이 들어와도 SQL 구문 자체로 해석되지 않고 일반 문자열 값으로만 처리된다.

### 5.2 서버 사이드 화이트리스트 필터링 적용 방식

입력값 검증은 클라이언트가 아니라 서버 서비스 계층에서 수행되도록 적용하였다.  
즉, 프론트엔드에서 우회 입력을 보내더라도 서버가 최종적으로 허용 여부를 판단하도록 구현하였다.

- 검색어: 허용 문자 패턴 검증
- 카테고리: 허용된 목록만 인정
- 게시글 ID: 숫자 여부 검증
- 요청 본문: 길이, 필수값, 이름 형식 검증

### 5.3 DB 계정 최소 권한 원칙 적용 방식

애플리케이션 계정은 실제 서비스 수행에 필요한 최소 권한만 가져야 하므로, 운영 기준으로는 다음과 같이 분리하는 것이 맞다.

- 애플리케이션 계정: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- 스키마 변경 계정: Flyway 또는 별도 배포 계정

이번 조치에서는 이를 반영할 수 있도록 운영용 예시 SQL과 환경 설정 파일을 추가하였다.  
다만 실제 권한 부여는 운영 DB 서버에서 별도로 수행해야 하므로, 이 항목은 문서 및 설정 예시 반영까지 완료된 상태이다.

## 6. 수정 파일

### 백엔드

- `backend/src/main/java/com/mycard/api/service/BoardService.java`
- `backend/src/main/java/com/mycard/api/repository/BoardRepository.java`
- `backend/src/main/java/com/mycard/api/controller/BoardController.java`
- `backend/src/main/java/com/mycard/api/dto/board/BoardRequest.java`
- `backend/src/main/java/com/mycard/api/entity/Board.java`
- `backend/src/main/resources/application.yml`

### 운영/인프라

- `infra/env/mycard-api.env.example`
- `infra/sql/mysql-least-privilege.example.sql`

### 문서

- `docs/board-sql-injection-remediation.md`

## 7. 파일별 수정 전 / 수정 후 코드 비교

### 7.1 `backend/src/main/java/com/mycard/api/service/BoardService.java`

#### 수정 전

```java
@Transactional(readOnly = true)
public List<BoardResponse> findAll(String keyword, String category, UserPrincipal userPrincipal) {
    String queryString = "SELECT * FROM boards WHERE 1=1";

    if (keyword != null && !keyword.isEmpty()) {
        queryString += " AND (title LIKE '%" + keyword + "%' OR content LIKE '%" + keyword + "%')";
    }

    if (category != null && !category.isEmpty() && !category.equals("전체")) {
        queryString += " AND category = '" + category + "'";
    }

    List<Board> boards = entityManager.createNativeQuery(queryString, Board.class).getResultList();
    return boards.stream().map(BoardResponse::from).collect(Collectors.toList());
}
```

#### 수정 후

```java
@Transactional(readOnly = true)
public List<BoardResponse> findAll(String keyword, String category, UserPrincipal userPrincipal) {
    String normalizedKeyword = normalizeSearchKeyword(keyword);
    String normalizedCategory = normalizeCategoryFilter(category);
    String userName = currentUserName(userPrincipal);

    List<Board> boards;
    if (isStaff(userPrincipal)) {
        boards = boardRepository.searchAll(normalizedKeyword, normalizedCategory);
    } else if (!StringUtils.hasText(userName)) {
        boards = boardRepository.searchPublic(normalizedKeyword, normalizedCategory);
    } else {
        boards = boardRepository.searchVisibleToUser(normalizedKeyword, normalizedCategory, userName);
    }

    return boards.stream()
            .filter(board -> canView(board, userPrincipal))
            .map(BoardResponse::from)
            .collect(Collectors.toList());
}
```

#### 핵심 변경 사항

- SQL 문자열 직접 결합 제거
- `EntityManager.createNativeQuery()` 제거
- 검색어/카테고리 서버 검증 후 Repository 호출
- 권한 조건도 서비스 로직에서 재검증

### 7.2 `backend/src/main/java/com/mycard/api/repository/BoardRepository.java`

#### 수정 전

```java
// 별도 Repository 없음
// BoardService에서 Native SQL 직접 생성 및 실행
```

#### 수정 후

```java
public interface BoardRepository extends JpaRepository<Board, Long> {

    @Query("""
            SELECT b
            FROM Board b
            WHERE (:keyword IS NULL
                    OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:category IS NULL OR b.category = :category)
            ORDER BY b.id DESC
            """)
    List<Board> searchAll(@Param("keyword") String keyword, @Param("category") String category);
}
```

#### 핵심 변경 사항

- 게시판 전용 Repository 신설
- `:keyword`, `:category` 파라미터 바인딩 사용
- SQL Injection 발생 지점을 서비스에서 저장소 계층의 안전한 조회 구조로 전환

### 7.3 `backend/src/main/java/com/mycard/api/controller/BoardController.java`

#### 수정 전

```java
@Tag(name = "자유게시판", description = "자유게시판 API (SQL Injection 취약점 포함)")

@PostMapping
public ResponseEntity<BoardResponse> createBoard(
        @RequestBody BoardRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal) {
    return ResponseEntity.ok(boardService.create(request, userPrincipal.getFullName()));
}
```

#### 수정 후

```java
@Tag(name = "문의게시판", description = "문의게시판 API")

@PostMapping
public ResponseEntity<BoardResponse> createBoard(
        @Valid @RequestBody BoardRequest request,
        @AuthenticationPrincipal UserPrincipal userPrincipal) {
    return ResponseEntity.ok(boardService.create(request, userPrincipal.getFullName()));
}
```

#### 핵심 변경 사항

- 문서 설명에서 취약 상태 문구 제거
- `@Valid` 적용으로 DTO 검증 강제

### 7.4 `backend/src/main/java/com/mycard/api/dto/board/BoardRequest.java`

#### 수정 전

```java
public class BoardRequest {
    private String title;
    private String content;
    private String category;
    private String allowedUsers;
    private String answer;
    private boolean isPrivate;
}
```

#### 수정 후

```java
public class BoardRequest {
    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 255, message = "제목은 255자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    @Size(max = 5000, message = "내용은 5000자 이하여야 합니다.")
    private String content;

    @Size(max = 100, message = "카테고리는 100자 이하여야 합니다.")
    private String category;

    @Size(max = 1000, message = "열람 허용 대상자 목록은 1000자 이하여야 합니다.")
    private String allowedUsers;

    @Size(max = 5000, message = "답변은 5000자 이하여야 합니다.")
    private String answer;
}
```

#### 핵심 변경 사항

- 제목/내용 필수값 검증 추가
- 길이 제한 검증 추가
- 비정상적인 대용량 입력값 차단

### 7.5 `backend/src/main/java/com/mycard/api/entity/Board.java`

#### 수정 전

```java
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Board {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

#### 수정 후

```java
@Builder
public class Board {

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

#### 핵심 변경 사항

- 게시판 엔티티의 시간값 관리 방식을 Hibernate 표준 어노테이션으로 정리
- Repository 기반 저장 방식과 일관되게 동작하도록 수정

### 7.6 `backend/src/main/resources/application.yml`

#### 수정 전

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

#### 수정 후

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: ${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
```

#### 핵심 변경 사항

- 운영 환경에서 `ddl-auto`를 고정값이 아닌 환경변수로 제어 가능
- 운영 시 `validate` 사용을 통한 스키마 변경 최소화 기반 마련

### 7.7 `infra/env/mycard-api.env.example`

#### 수정 전

```env
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
```

#### 수정 후

```env
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
```

#### 핵심 변경 사항

- 운영 예시 환경설정에 `validate` 기준 추가
- 애플리케이션 계정이 임의로 스키마를 변경하지 않도록 운영 기준 명시

### 7.8 `infra/sql/mysql-least-privilege.example.sql`

#### 수정 전

```sql
-- 파일 없음
```

#### 수정 후

```sql
CREATE USER IF NOT EXISTS 'mycard_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE ON mycard.* TO 'mycard_app'@'%';

FLUSH PRIVILEGES;
```

#### 핵심 변경 사항

- 최소 권한 DB 계정 적용 예시 추가
- 애플리케이션 계정 권한을 DML 중심으로 제한하는 운영 가이드 제공

### 7.9 `docs/board-sql-injection-remediation.md`

#### 수정 전

```md
취약점 조치 결과를 간단히 정리한 수준으로,
파일별 수정 근거와 코드 비교 내용은 포함하지 않은 상태
```

#### 수정 후

```md
- 최초 대응 방안과 조치 이행 비교표 추가
- 전체 수정 내용과 적용 방식 정리
- 파일별 수정 전 / 수정 후 코드 비교 섹션 추가
- 재점검 기준과 최종 판단 명시
```

#### 핵심 변경 사항

- 보고서 제출용 문서 형식으로 보완
- 조치 이행 근거와 기술적 수정 내용을 한 문서에서 설명 가능하도록 정리

## 8. 재점검 기준

조치 후에는 아래와 같은 결과가 나와야 한다.

- `' OR 1=1 #` 입력 시
  - 전체 게시물 우회 조회가 발생하지 않아야 함
  - 서버는 허용되지 않은 검색어로 판단하여 차단하거나 정상 문자열로만 처리해야 함
- `1 UNION SELECT ...` 입력 시
  - 쿼리 구조가 변조되지 않아야 함
  - 데이터 노출 또는 비정상 응답이 발생하지 않아야 함
- `/board/1 OR 1=1` 요청 시
  - 숫자가 아닌 ID이므로 `400 Bad Request`로 차단되어야 함

## 9. 최종 판단

`/board` 게시판 SQL Injection 취약점에 대해, 최초에 제시한 대응 방안 3개 중 2개는 코드 차원에서 이행 완료되었다.

- `Prepared Statement 또는 JPA 파라미터 바인딩 적용`: 이행 완료
- `입력값에 대한 서버 사이드 화이트리스트 필터링 적용`: 이행 완료
- `DB 계정 최소 권한 원칙 적용`: 운영 반영 전 단계까지 수행, 실제 운영 DB 적용 필요

따라서 본 건은 **애플리케이션 소스코드 기준으로는 SQL Injection 대응 조치가 완료되었으며**,  
**운영 DB 권한 설정까지 반영되면 대응 방안 3개가 모두 충족되는 상태**로 판단할 수 있다.
