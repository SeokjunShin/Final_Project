/**
 * 날짜 포맷팅 유틸리티
 * ISO 날짜 문자열에서 T 문자를 제거하고 읽기 쉬운 형식으로 변환
 */

/**
 * ISO 날짜 문자열을 한국어 형식으로 포맷팅
 * @param dateString ISO 날짜 문자열 (예: "2024-02-26T14:30:00")
 * @param showTime 시간 포함 여부 (기본: true)
 * @returns 포맷팅된 날짜 문자열 (예: "2024-02-26 14:30:00" 또는 "2024-02-26")
 */
export const formatDateTime = (dateString: string | null | undefined, showTime = true): string => {
  if (!dateString) return '-';
  
  try {
    // T를 공백으로 대체하고 밀리초 부분 제거
    let formatted = dateString.replace('T', ' ');
    
    // 밀리초(.xxx) 및 타임존 정보 제거
    formatted = formatted.replace(/\.\d{3}(Z|[+-]\d{2}:\d{2})?$/, '');
    formatted = formatted.replace(/Z$/, '');
    
    if (!showTime) {
      // 날짜만 반환 (시간 부분 제거)
      formatted = formatted.split(' ')[0];
    }
    
    return formatted;
  } catch {
    return dateString;
  }
};

/**
 * ISO 날짜 문자열을 한국어 날짜 형식으로 포맷팅
 * @param dateString ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: "2024년 2월 26일")
 */
export const formatDateKorean = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * ISO 날짜 문자열을 간단한 날짜 형식으로 포맷팅
 * @param dateString ISO 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: "2024-02-26")
 */
export const formatDate = (dateString: string | null | undefined): string => {
  return formatDateTime(dateString, false);
};

/**
 * 상대적 시간 표시 (예: "3분 전", "2시간 전", "어제")
 * @param dateString ISO 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    
    return formatDate(dateString);
  } catch {
    return dateString;
  }
};
