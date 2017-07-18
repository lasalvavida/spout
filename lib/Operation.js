import Enum from 'es6-enum'

const Type = Enum(
  "NEGATE",
  "ADD",
  "SUBTRACT",
  "MULTIPLY",
  "DIVIDE"
)

class Operation {
  constructor(type) {
    this._type = type
    this.inputs = []
  }

  static get Type() {
    return Type;
  }

  get type() {
    return this._type
  }
}

export { Operation as default }
