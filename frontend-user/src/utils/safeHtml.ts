import DOMPurify from 'dompurify';

const decodeHtmlEntities = (value: string) => {
  if (typeof window === 'undefined') {
    return value;
  }

  const textarea = window.document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

export const sanitizeBoardInput = (value: string) =>
  DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export const toSafePlainText = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const sanitized = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return decodeHtmlEntities(sanitized);
};
