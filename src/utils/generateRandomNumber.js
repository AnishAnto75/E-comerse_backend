export const generateRandom12DigitNumber = ()=>{
    const date = new Date();
    const datePart = String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0')

  const randomPart = Math.floor(Math.random() * 100000000).toString().padStart(6, '0')
  return datePart + randomPart
}

export const generateRandom10DigitNumber = ()=>{
    const date = new Date();
    const datePart = String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0')

  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(4, '0')
  return datePart + randomPart
}

export const generateRandom8DigitNumber = ()=>{
    const date = new Date();
    const datePart = String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0')

  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(2, '0')
  return datePart + randomPart
}
