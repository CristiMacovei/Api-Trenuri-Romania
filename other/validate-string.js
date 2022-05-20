function validate(string) {
  if (typeof string !== 'string') {
    return {
      valid: false,
      reason: `Expected string, got ${typeof string}`
    }
  }

  if (string.length === 0) {
    return {
      valid: false,
      reason: 'String is empty'
    }
  }

  return {
    valid: true
  }
}

module.exports = {
  validate
}