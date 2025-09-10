Array.prototype.myReducer = (callback, initialValue) => {
  let calctor = initialValue
  for(let i = 0; i < this.length; i++) {
    if(calctor === undefined) {
      calctor = this[i]
    } else {
      calctor = callback(calctor, this[i], i, this)
    }
  }
  return calctor
}
  
