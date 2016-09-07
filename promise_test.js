var p1 = new Promise((resolve) => {
  setTimeout(resolve, 1000, 'hello')
})

p1.then((value) => {
  console.log(value)
})
