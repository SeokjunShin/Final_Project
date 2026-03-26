const SECOND_AUTH_SESSION_KEY = 'second_auth_passed';
const SECOND_AUTH_REQUIRED_EVENT = 'mycard:second-auth-required';

export const isSecondAuthPassed = () =>
  sessionStorage.getItem(SECOND_AUTH_SESSION_KEY) === 'true';

export const markSecondAuthPassed = () => {
  sessionStorage.setItem(SECOND_AUTH_SESSION_KEY, 'true');
  window.dispatchEvent(new Event(SECOND_AUTH_REQUIRED_EVENT));
};

export const clearSecondAuthPassed = () => {
  sessionStorage.removeItem(SECOND_AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(SECOND_AUTH_REQUIRED_EVENT));
};

export const secondAuthRequiredEventName = SECOND_AUTH_REQUIRED_EVENT;
