import Enum from 'es6-enum'

const Type = Enum(
  "NEGATE",
  "ADD",
  "SUBTRACT",
  "MULTIPLY",
  "DIVIDE",
  "NOT",
  "EQUAL_TO",
  "NOT_EQUAL_TO",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL_TO",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL_TO",
  "AND",
  "BITWISE_AND",
  "OR",
  "BITWISE_OR",
  "SHIFT_LEFT_LOGICAL",
  "SHIFT_RIGHT_LOGICAL"
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
