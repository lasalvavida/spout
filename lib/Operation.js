import Enum from 'es6-enum'

const Type = Enum(
  "ASSIGN",
  "NEGATE",
  "ADD",
  "SUBTRACT",
  "MULTIPLY",
  "DIVIDE"
)

class Operation {
  constructor(type) {
    this.type = type
    this.inputs = []
    this.output = undefined
  }

  static get Type() {
    return Type;
  }

  get type() {
    return this.type
  }
}

export { Operation as default }
