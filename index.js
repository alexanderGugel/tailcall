var acorn = require('acorn')
var walk = require('acorn/dist/walk')
var through = require('through')
var path = require('path')
var escodegen = require('escodegen')

function eliminateTailCalls (ast) {

  var optimizeableFunctionDeclarationNodes = []

  walk.ancestor(ast, {
    CallExpression: function (node, ancestors) {
      if (
        ancestors.length < 3 ||
        ancestors[ancestors.length - 2].type !== 'ReturnStatement'
      ) return

      var returnStatementNode = ancestors[ancestors.length - 2]

      var functionDeclarationNode = null

      for (var i = ancestors.length - 1; i >= 0; i--) {
        if (
          ancestors[i].type === 'FunctionDeclaration' &&
          ancestors[i].id.name === node.callee.name
        ) {
          functionDeclarationNode = ancestors[i]
          if (functionDeclarationNode) break
        }
      }

      if (!functionDeclarationNode) return

      if (!functionDeclarationNode.__markedAsOptimizeable__) {
        functionDeclarationNode.__markedAsOptimizeable__ = true
        optimizeableFunctionDeclarationNodes.push(functionDeclarationNode)
      }

      var returnStatementNodeIndex = ancestors[ancestors.length - 3].body.indexOf(returnStatementNode)

      var args = [
        returnStatementNodeIndex,
        1
      ]

      for (
        var j = 0;
        j < Math.max(functionDeclarationNode.params.length, node.arguments.length);
        j++
      ) {
        var param = functionDeclarationNode.params[j]
        var arg = node.arguments[j]

        if (!param) {
          param = { name: '' }
        }

        if (!arg) {
          arg = {
            type: 'Identifier',
            start: 12,
            end: 21,
            name: 'undefined'
          }
        }

        args.push({
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: { type: 'Identifier', name: '__' + param.name },
            right: arg
          }
        })
      }

      for (
        var k = 0;
        k < Math.min(functionDeclarationNode.params.length, node.arguments.length);
        k++
      ) {
        param = functionDeclarationNode.params[k]

        args.push({
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: { type: 'Identifier', name: param.name },
            right: { type: 'Identifier', name: '__' + param.name }
          }
        })
      }

      var returnStatementNodeAncestorBody = ancestors[ancestors.length - 3].body
      var injectContinue = returnStatementNodeIndex < returnStatementNodeAncestorBody.length - 1

      returnStatementNodeAncestorBody.splice.apply(returnStatementNodeAncestorBody, args)

      if (injectContinue) {
        args.push({ type: 'ContinueStatement' })
      }

    }
  })

  optimizeableFunctionDeclarationNodes.forEach(function (node) {
    var blockStatementBody = node.body.body

    node.body.body = [{
      type: 'VariableDeclaration',
      declarations: (node.params.map(function (param) {
        return param.name
      }).concat([''])).map(function (name) {
        return {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: '__' + name
          }
        }
      }),
      kind: 'var'
    },
    {
      type: 'WhileStatement',
      test: {
        type: 'Literal',
        value: true,
        raw: 'true'
      },
      body: {
        type: 'BlockStatement',
        body: blockStatementBody
      }
    }]
  })

  return ast
}

function transform (file) {
  if (path.extname(file) !== '.js') return through()

  var source = ''
  var stream = through(write, end)

  function write (buf) {
    source += buf
  }

  function end () {
    try {
      var ast = acorn.parse(source)

      ast = eliminateTailCalls(ast)

      var code = escodegen.generate(ast)
      this.queue(code)
    } catch (e) {
      return stream.emit('error', e)
    }

    this.queue(null)
  }

  return stream
}

module.exports = transform
