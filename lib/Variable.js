import Enum from 'es6-enum'

const Permissions = Enum(
  "R",
  "W",
  "RW"
)

const Type = Enum(
  "BOOL",
  "INT",
  "UINT",
  "FLOAT",
  "DOUBLE",
  "VECTOR"
)

const Qualifier = Enum(
  "VARYING",
  "UNIFORM",
  "ATTRIBUTE",
  "LOCAL"
)

class Variable {
  constructor(type, name = undefined, qualifier = Qualifier.LOCAL, permissions = Permissions.RW) {
    this._name = name
    this._permissions = permissions
    this.members = undefined
    this._qualifier = qualifier
    this._type = type
    this.value = undefined
  }

  static get Permissions() {
    return Permissions
  }

  static get Qualifier() {
    return Qualifier
  }

  static get Type() {
    return Type
  }

  get name() {
    return this._name
  }

  get permissions() {
    return this._permissions
  }

  get qualifier() {
    return this._qualifier
  }

  get type() {
    return this._type
  }
}

export { Variable as default }
