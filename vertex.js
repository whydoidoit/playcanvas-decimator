import calculateNormal from './calculate-normal'

function Vertex(options) {
    this.faces = new Set
    this.neighbours = new Set
    this.tvertices = [0, 0, 0]
    Object.assign(this, options)
}

Object.defineProperties(Vertex.prototype, {
    hasNormal: {
        get: function() {
            return this.n && this.n.lengthSq()
        }
    },
    area: {
        get: function() {
            let totalArea = 0
            let maxArea = 0
            this.faces.forEach(f=>{
                let a= f.area
                if(a > maxArea) {
                    maxArea = a
                }
                totalArea += a
            })
            return totalArea
        }
    }
})

Vertex.prototype.calculateError = function (vertices) {
    let triangle = new Triangle()
    this.removalCandidate = null
    this.removalCost = Infinity
    if (this.preserve) return
    this.neighbours.forEach(u => {
        if (u.preserve) return
        let additionalError = 0
        let ok = true
        this.faces.every(f => {
            this.tvertices = (f.vertices.slice(0))
                .forEach((v, i) => {
                    if (v == this.index) {
                        this.tvertices[i] = u.index
                    }
                })
            var updatedNormal = calculateNormal(vertices.get(this.tvertices[0]), vertices.get(this.tvertices[1]), vertices.get(this.tvertices[2]))
            if (updatedNormal.lengthSq() > 0.01 && updatedNormal.dot(f.normal) < 0) {
                ok = false
                return false
            }
            triangle.v1 = vertices.get(this.tvertices[0])
            triangle.v2 = vertices.get(this.tvertices[1])
            triangle.v3 = vertices.get(this.tvertices[2])
            let bary = triangle.bary(this.v)
            if (bary.x >= 0 && bary.y >= 0 && bary.x >= 0) {
                let uv = triangle.calculateUV(bary, [vertices.get(this.tvertices[0]).uv0, vertices.get(this.tvertices[1]).uv0, vertices.get(this.tvertices[2]).uv0,])
                additionalError = Math.max(additionalError, uv.sub(this.uv0).length())
            }

            return true
        })
        if (!ok) return
        let curvature = 0
        let candidateFaces = u.faces.map(f => f.hasVertex(this))
        if (candidateFaces.length >= 2) {
            u.faces.forEach(face => {
                var minCurve = 1
                candidateFaces.forEach(s=>{
                    let dot = face.normal.dot(s.normal) * this.hasNormal ? this.n.dot(u.n) : 1
                    minCurve = Math.min(minCurve, (1-dot)/2)
                })
                curvature = Math.max(curvature, minCurve)
            })

            let error = (1+additionalError) * (curvature*2) * this.area

            if(error < removalCost) {
                this.removalCost = error
                this.removalCandidate = u
            }
        }

    })
}

export default Vertex
