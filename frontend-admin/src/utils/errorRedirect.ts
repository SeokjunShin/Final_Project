const ERROR_PAGE_PATH = '/error';
const REDIRECT_STATUSES = new Set([400, 401, 403, 404, 500]);

export const shouldRedirectToCommonErrorPage = (status?: number) =>
  status !== undefined && REDIRECT_STATUSES.has(status);

export const redirectToCommonErrorPage = () => {
  if (window.location.pathname === ERROR_PAGE_PATH) {
    return;
  }

  window.location.replace(ERROR_PAGE_PATH);
};
