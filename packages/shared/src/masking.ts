export const maskName = (name: string | null | undefined) => {
  if (!name) return '';
  if (name.length < 2) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
};

export const maskPhone = (phone: string | null | undefined) => {
  if (!phone) return '';

  const parts = phone.split('-');
  if (parts.length === 3 && parts[1]) {
    return `${parts[0]}-${'*'.repeat(parts[1].length)}-${parts[2]}`;
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;

  const prefixLength = digits.startsWith('02') ? 2 : 3;
  const middleLength = digits.length - prefixLength - 4;
  if (middleLength <= 0) return phone;

  return `${digits.slice(0, prefixLength)}${'*'.repeat(middleLength)}${digits.slice(-4)}`;
};
