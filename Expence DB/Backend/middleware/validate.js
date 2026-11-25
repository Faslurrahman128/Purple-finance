export function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
}

export function requirePositiveNumber(value, field='amount') {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    const error = new Error(`${field} must be greater than 0`);
    error.status = 400;
    throw error;
  }
}
