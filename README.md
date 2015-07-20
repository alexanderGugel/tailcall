![](http://img.shields.io/badge/stability-experimental-orange.svg?style=flat)
[![Build Status](https://travis-ci.org/alexanderGugel/tailcall.svg?branch=master)](https://travis-ci.org/alexanderGugel/tailcall)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

# tailcall

`tailcall` is a browserify transform and command line utility that can be used for eliminating tail calls in recursive functions (TCO = tail call optimization). This prevents excessive growth of the used call stack and generally speaking increases performance (in most cases).

Tail call optimization is are part of the ECMAScript 6 spec:
[Tail call optimization in ECMAScript 6
](http://www.2ality.com/2015/06/tail-call-optimization.html)

`tailcall` uses [`acorn`](https://www.npmjs.com/package/acorn) to generate and traverse the AST.

## Example

Input (tail recursive factorial function):

```js
function fact (n, acc) {
  acc = acc != null ? acc : 1
  if (n < 2) return 1 * acc
  return fact(n - 1, acc * n)
}
```

Output (no more recursive tail calls):

```js
function fact(n, acc) {
    var __n, __acc, __;
    while (true) {
        acc = acc != null ? acc : 1;
        __n = n - 1;
        __acc = acc * n;
        n = __n;
        acc = __acc;
        if (n < 2)
            return 1 * acc;
    }
}
```

## Install

With [npm](https://npmjs.org) do:

```
npm install tailcall
```

## Usage via [`browserify`](https://github.com/substack/node-browserify)

```
browserify -t tailcall index.js
```

or add it to your `package.json`:

```json
{
  "browserify": {
    "transform": ["tailcall"]
  }
}
```

## CLI

Usage of the command line utility usually requires a global install (via `npm i -g tailcall`) or a npm script.

```
tailcall index.js
```

```
usage:

  tailcall file

    Eliminate tail recursive function calls from `file`, printing the
    transformed file contents to stdout.

  tailcall
  tailcall -

    Eliminate tail recursive function calls from `file`, printing the
    transformed file contents to stdout.
```

## License

Licensed under the ISC license. See `LICENSE` file for further info.
