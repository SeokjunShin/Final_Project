export const maskName = (name?: string | null): string => {
  if (!name || name.length < 2) {
    return name ?? '';
  }

  if (name.length === 2) {
    return `${name.charAt(0)}*`;
  }

  return `${name.charAt(0)}*${name.substring(2)}`;
};

export const maskPhone = (phone?: string | null): string => {
  if (!phone) {
    return '';
  }

  const digitMatches = phone.match(/\d/g);
  if (!digitMatches || digitMatches.length < 4) {
    return phone;
  }

  let hiddenDigits = 0;
  return phone
    .split('')
    .reverse()
    .map((char) => {
      if (/\d/.test(char) && hiddenDigits < 4) {
        hiddenDigits += 1;
        return '*';
      }
      return char;
    })
    .reverse()
    .join('');
};

export const maskAddress = (address?: string | null): string => {
  if (!address) {
    return '';
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return '';
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    return `${parts[0]} ${parts[1]} ****`;
  }

  if (parts.length === 2) {
    return `${parts[0]} ****`;
  }

  if (trimmed.length <= 4) {
    return '****';
  }

  return `${trimmed.slice(0, 4)}****`;
};
