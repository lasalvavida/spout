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

const OperatorPriority = [
  '+',
  '-',
  '*',
  '/',
  '='
]

const SyntaxOperators = {
  '+': Operation.Type.ADD,
  '-': Operation.Type.SUBTRACT,
  '*': Operation.Type.MULTIPLY,
  '/': Operation.Type.DIVIDE,
}

class Parser {
  static parse(glsl) {
    glsl = Parser.preprocess(glsl)
    var blocks = Parser.splitBlocks(glsl)
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
    var sections = Parser.splitBlocks(instruction, '(', ')')
    return Parser.parseInstructionSections(sections, scope)
  }

  static parseInstructionSections(sections, scope) {
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      if (Array.isArray(section)) {
        sections[i] = Parser.parseInstructionSections(section, scope)
      }
    }
    return Parser.parseInstructionSection(sections, scope)
  }

  static parseInstructionSection(section, scope) {
    var operation;
    var operator, token;
    var priority = 0
    var index = -1
    for (var i = 0; i < section.length; i++) {
      var part = section[i]
      if (typeof part === 'string' || part instanceof String) {
        for (var j = OperatorPriority.length - 1; j >= priority; j--) {
          var operatorToken = OperatorPriority[j]
          var findToken = part.indexOf(operatorToken)
          if (findToken >= 0) {
            index = i
            priority = j
            operator = SyntaxOperators[operatorToken]
            token = operatorToken
          }
        }
      }
    }
    if (index < 0) {
      var item = section[0]
      return Parser.parseDeclaration(item, scope)
    }
    else {
      var parsePart = section[index]
      var halves = parsePart.split(token, 2)
      var left = halves[0].trim()
      var right = halves[1].trim()
      if (left === '') {
        left = section[index - 1]
      }
      else {
        left = Parser.parseInstructionSection([left], scope)
      }
      if (right === '') {
        right = section[index + 1]
      }
      else {
        right = Parser.parseInstructionSection([right], scope)
      }
      if (token === '=') {
        left.value = right
        return left
      }
      if (token === '-' && left === undefined) {
        operation = new Operation(Operation.Type.NEGATE)
        operation.inputs.push(right)
      }
      else {
        operation = new Operation(operator)
        operation.inputs.push(left)
        operation.inputs.push(right)
      }
      return operation
    }
  }

  static parseDeclaration(instruction, scope) {
    var token, type;
    var tokens = instruction.split(/\s+/)
    if (tokens.length > 1) {
      var tokenIndex = 0
      token = tokens[tokenIndex]
      var qualifier = Variable.Qualifier.LOCAL
      if (SyntaxQualifiers.hasOwnProperty(token)) {
        qualifier = SyntaxQualifiers[token]
        tokenIndex++
        token = tokens[tokenIndex]
      }
      if (SyntaxTypes.hasOwnProperty(token)) {
        type = SyntaxTypes[token]
        tokenIndex++
        token = tokens[tokenIndex]
        return new Variable(type, token, qualifier)
      }
      if (token.indexOf('vec') >= 0) {
        type = Variable.Type.FLOAT
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
      token = tokens[0]
      if (scope.hasOwnProperty(token)) {
        return scope[token]
      }
      return token
    }
  }

  static splitBlocks(glsl, startBlock = '{', endBlock = '}', blocks = [], depth = 0) {
    var end;
    var inString = false
    var inChar = false
    var blockIndex = 0
    for (var i = 0; i < glsl.length; i++) {
      var char = glsl[i]
      if (!inString && !inChar) {
        if (char === '"') {
          inString = true
        }
        else if (char === '"') {
          inChar = true
        }
        else if (char === startBlock) {
          if (i > 0) {
            var block = glsl.substring(0, i).trim()
            blocks.push(block)
          }
          var nextSection = glsl.substring(i + 1)
          var nested = []
          blockIndex = i + 1 + Parser.splitBlocks(nextSection, startBlock, endBlock, nested, depth + 1)
          i = blockIndex
          blocks.push(nested)
        }
        else if (char === endBlock && depth > 0) {
          end = glsl.substring(blockIndex, i).trim()
          if (end.length > 0) {
            blocks.push(end)
          }
          return i + 1
        }
      }
      else if (inString) {
        if (char === '"') {
          inString = false
        }
      }
      else if (inChar) {
        if (char === '\'') {
          inChar = false
        }
      }
    }
    end = glsl.substring(blockIndex).trim()
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
