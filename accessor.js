function Accessor(offset, stride, buffer, type, components) {
    this.stride = stride || 1
    switch (type) {
        case pc.ELEMENTTYPE_INT8:
            this.data = new Int8Array(buffer, offset)
            break
        case pc.ELEMENTTYPE_UINT8:
            this.data = new Uint8Array(buffer, offset)
            break
        case pc.ELEMENTTYPE_INT16:
            this.data = new Int16Array(buffer, offset)
            this.stride /= 2
            break
        case pc.ELEMENTTYPE_UINT16:
            this.data = new Uint16Array(buffer, offset)
            this.stride /= 2
            break
        case pc.ELEMENTTYPE_INT32:
            this.data = new Int32Array(buffer, offset)
            this.stride /= 4
            break
        case pc.ELEMENTTYPE_UINT32:
            this.data = new Uint32Array(buffer, offset)
            this.stride /= 4
            break
        case pc.ELEMENTTYPE_FLOAT32:
            this.data = new Float32Array(buffer, offset)
            this.stride /= 4
            break
    }

    switch (components) {

        case 2:
            this.get = this.vec2
            break
        case 3:
            this.get = this.vec3
            break
        case 4:
            this.get = this.vec4
            break
        default:
            this.get = this._get
            break
    }

}

Accessor.prototype._get = function (index, offset) {
    return this.data[index * this.stride + offset]
}
Accessor.prototype.vec3 = function (index) {
    return new pc.Vec3(this._get(index), this._get(index, 1), this._get(index, 2))
}
Accessor.prototype.vec4 = function (index) {
    return new pc.Vec4(this._get(index), this._get(index, 1), this._get(index, 2), this._get(index, 3))
}
Accessor.prototype.vec2 = function (index) {
    return new pc.Vec2(this._get(index), this._get(index, 1))
}
Object.defineProperties(Accessor.prototype, {
    length: {
        get: function () {
            return this.data.length / this.stride
        }
    }
})

export default Accessor
