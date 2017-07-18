import Operation from './Operation'
import Variable from './Variable'

const SyntaxQualifiers = {
  'varying': Variable.Qualifier.VARYING,
  'uniform': Variable.Qualifier.UNIFORM,
  'attribute': Variable.Qualifier.ATTRIBUTE
}

const SyntaxTypes = {
  'bool': Variable.Type.BOOL,
  'int': Variable.Type.INT,
  'uint': Variable.Type.UINT,
  'float': Variable.Type.FLOAT,
  'double': Variable.Type.DOUBLE
}

class Parser {
  static parse(glsl) {
    glsl = Parser.preprocess(glsl)
    blocks = Parser.splitBlocks(glsl)
    return Parser.parseBlocks(blocks)
  }

  static parseBlocks(blocks) {
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i]
      var instructions = block.split(';')
      for (var j = 0; j < instructions.length; j++) {
        var instruction = instructions[j].trim()
        Parser.parseInstruction(instruction)
      }
    }
  }

  static parseInstruction(instruction, scope = {}) {
    if (instruction.indexOf('=') >= 0) {
      var splitInstruction = instruction.split('=')
      var targetString = splitInstruction[0].trim()
      var sourceString = splitInstruction[1].trim()
      var target = Parser.parseInstruction(targetString, scope)
      var source = Parser.parseInstruction(sourceString, scope)
      target.value = source
      return target
    }
    else if (instruction.indexOf('/') >= 0) {
      var splitInstruction = instruction.split('/')
      var dividend = splitInstruction[0].trim()
      var divisor = splitInstruction[1].trim()
      var divide = new Operation(Operation.Type.DIVIDE)
      divide.inputs.push(Parser.parseInstruction(dividend, scope))
      divide.inputs.push(Parser.parseInstruction(divisor, scope))
      return divide
    }
    else if (instruction[0] == '-') {
      var negate = new Operation(Operation.Type.NEGATE)
      var expression = instruction.substring(1).trim()
      negate.inputs.push(Parser.parseInstruction(expression, scope))
      return negate
    }
    else {
      var tokens = instruction.split(/\s+/)
      if (tokens.length > 1) {
        var tokenIndex = 0
        var token = tokens[tokenIndex]
        var qualifier = Variable.Qualifier.LOCAL
        if (SyntaxQualifiers.hasOwnProperty(token)) {
          qualifier = SyntaxQualifiers[token]
          tokenIndex++
          token = tokens[tokenIndex]
        }
        if (SyntaxTypes.hasOwnProperty(token)) {
          var type = SyntaxTypes[token]
          tokenIndex++
          token = tokens[tokenIndex]
          return new Variable(type, token, qualifier)
        }
        if (token.indexOf('vec') >= 0) {
          var type = Variable.Type.FLOAT
          if (token[0] == 'b') {
            type = Variable.Type.BOOL
          }
          else if (token[0] == 'i') {
            type = Variable.Type.INT
          }
          else if (token[0] == 'u') {
            type = Variable.Type.UINT
          }
          else if (token[0] == 'd') {
            type = Variable.Type.DOUBLE
          }
          var n = 0
          if (token[0] == 'v') {
            n = parseInt(token[3])
          }
          else {
            n = parseInt(token[4])
          }
          tokenIndex++
          token = tokens[tokenIndex]
          var variable = new Variable(Variable.Type.VECTOR, token, qualifier)
          var members = []
          for (var i = 0; i < n; i++) {
            members.push(new Variable(type))
          }
          variable.members = members
          return variable
        }
      }
      else {
        var token = tokens[0]
        if (scope.hasOwnProperty(token)) {
          return scope[token]
        }
        return token
      }
    }
  }

  static splitBlocks(glsl, blocks = [], depth = 0) {
    var inString = false
    var inChar = false
    var blockIndex = 0
    for (var i = 0; i < glsl.length; i++) {
      var char = glsl[i]
      if (!inString && !inChar) {
        if (char === '\"') {
          inString = true
        }
        else if (char === '\'') {
          inChar = true
        }
        else if (char === '{') {
          var block = glsl.substring(0, i).trim()
          blocks.push(block)
          var nextSection = glsl.substring(i + 1)
          var nested = []
          blockIndex = i + 1 + Parser.splitBlocks(nextSection, nested, depth + 1)
          i = blockIndex
          blocks.push(nested)
        }
        else if (char === '}' && depth > 0) {
          var end = glsl.substring(blockIndex, i).trim()
          if (end.length > 0) {
            blocks.push(end)
          }
          return i + 1
        }
      }
      else if (inString) {
        if (char === '\"') {
          inString = false
        }
      }
      else if (inChar) {
        if (char === '\'') {
          inChar = false
        }
      }
    }
    var end = glsl.substring(blockIndex).trim()
    if (end.length > 0) {
      blocks.push(end)
    }
    return blocks
  }

  static preprocess(glsl) {
    var macros = []
    var lines = glsl.split(/\r?\n/)
    var processedLines = []
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]
      for (var j = 0; j < macros.length; j++) {
        var macro = macros[j]
        line = line.replace(macro.find, macro.replace)
      }
      line = line.trim()
      if (line.length > 0) {
        if (line[0] === '#') {
          line = line.substring(1).trim()
          var words = line.split(/\s+/)
          if (words[0] === 'define') {
            macros.push({
              find: new RegExp(words[1], 'g'),
              replace: words[2]
            })
          }
        }
        else {
          processedLines.push(line)
        }
      }
    }
    return processedLines.join('\n')
  }
}

export { Parser as default }
