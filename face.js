import calculateNormal from './calculate-normal'

function Face(options, allVertices) {
    this.vertices = [0, 0, 0]
    this.removed = false
    this.normal = new pc.Vec3
    this.allVertices = allVertices
    Object.assign(this, options)
}

Face.prototype.hasVertex = function (v) {
    if (v instanceof Vertex) {
        return this.vertices.findIndex(vert => this.allVertices.get(vert) == v) !== -1

    } else {
        return this.vertices.indexOf(v) !== -1
    }
}

Face.prototype.replace = function(u,v) {
    delete this.calculatedArea
    v.faces.push(this)
    u.faces.splice(u.faces.indexOf(this), 1)
    let uid = u.index
    let vid = v.index
    for(let i = 0; i < 3; i++) {
        let c = this.allVertices.get(this.vertices[i])
        u.neighbours.remove(c)
        c.neighbours.remove(u)
        if(this.vertices[i] == uid) {
            this.vertices[i] = vid
        }
    }
    for(let i = 0; i < 3; i++) {
        let c = this.allVertices.get(this.vertices[i])
        for(let j = 0; j < 3; j++) {
            if(i !== j) {
                let x = this.allVertices.get(this.vertices[j])
                c.neighbours.add(x)
            }
        }
    }
}



Object.defineProperties(Face.prototype, {
    normal: {
        get: function () {
            calculateNormal(this.v0.v, this.v1.v, this.v2.v)
        }
    },
    area: {
        get: function () {
            if (this.calculatedArea) {
                return this.lastArea
            }
            let v1 = this.allVertices.get(this.vertices[0]).v
            let v2 = this.allVertices.get(this.vertices[1]).v
            let v3 = this.allVertices.get(this.vertices[2]).v
            this.lastArea = V().cross(V(v3).sub(v1), V(v2).sub(v1)).length() / 2
            this.calculatedArea = true
            return this.lastArea
        }
    },
    v0: {
        get: function () {
            return this.allVertices.get(this.vertices[0])
        }
    },
    v1: {
        get: function () {
            return this.allVertices.get(this.vertices[1])
        }
    },
    v2: {
        get: function () {
            return this.allVertices.get(this.vertices[2])
        }
    },
    v: {
        get: function () {
            return [this.v0, this.v1, this.v2]
        }
    }
})

export default Face
