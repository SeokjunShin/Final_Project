/**
 * 날짜 포맷팅 유틸리티
 * ISO 날짜 문자열에서 T 문자를 제거하고 읽기 쉬운 형식으로 변환
 */

/**
 * ISO 날짜 문자열을 포맷팅 (T 제거)
 * @param dateString ISO 날짜 문자열 (예: "2024-02-26T14:30:00")
 * @param showTime 시간 포함 여부 (기본: true)
 * @returns 포맷팅된 날짜 문자열 (예: "2024-02-26 14:30:00" 또는 "2024-02-26")
 */
export const formatDateTime = (dateString: string | null | undefined, showTime = true): string => {
  if (!dateString) return '-';
  
  try {
    // T를 공백으로 대체
    let formatted = dateString.replace('T', ' ');
    
    // 밀리초(.xxx) 및 타임존 정보 제거
    formatted = formatted.replace(/\.\d{3}(Z|[+-]\d{2}:\d{2})?$/, '');
    formatted = formatted.replace(/Z$/, '');
    
    if (!showTime) {
      // 날짜만 반환 (시간 부분 제거)
      formatted = formatted.split(' ')[0];
    } else {
      // 시간 부분이 있으면 초 단위까지만
      formatted = formatted.substring(0, 19);
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
