
//* check if a string is not undefined, null or empty
/*
  returns {
    valid: true | false,
    reason: string or undefined if valid is true 
  }
*/
function validate(string) {
  //* typeof undefined returns 'undefined' typeof null returns 'object' 
  if (typeof string !== 'string') {
    return {
      valid: false,
      reason: `Expected string, got ${typeof string}`
    }
  }

  //* if the string is empty 
  if (string.length === 0) {
    return {
      valid: false,
      reason: 'String is empty'
    }
  }

  //* if it passes all checks return an object with a true 'valid' key 
  return {
    valid: true
  }
}

//* export the function
module.exports = {
  validate
}