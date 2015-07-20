function fact (n, acc) {
  acc = acc != null ? acc : 1
  if (n < 2) return 1 * acc
  return fact(n - 1, acc * n)
}

for (var n = 0; n < 10; n++) {
  console.log(n + ': ' + fact(n))
}
