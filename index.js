import Accessor from './accessor'
import Face from './face'
import flatten from 'lodash/flatten'

const validTypes = {
    "POSITION": true,
    "NORMAL": true,
    "TANGENT": true,
    "TEXCOORD0": true,
    "TEXCOORD1": true,
    "BLENDWEIGHT": true,
    "BLENDINDICES": true,
    "COLOR": true
}

function prepare(meshInstance, settings) {
    let vertices = new Map()
    let vb = meshInstance.mesh.vertexBuffer
    let locked = vb.lock()
    let format = vb.getFormat()
    let data = {}
    for (let j = 0; j < format.elements.length; j++) {
        let element = format.elements[j]
        if (validTypes[element.name]) {
            data[element.name] = new Accessor(element.offset, format.size, locked, element.type, element.components)
        }
    }

    settings.normal = !!data.NORMAL
    settings.uv0 = !!data.TEXCOORD0
    settings.uv1 = !!data.TEXCOORD1
    settings.color = !!data.COLOR
    settings.blendWeights = !!data.BLENDWEIGHT
    settings.blendIndices = !!data.BLENDINDICES

    let verticesCount = data.POSITION.length
    for (let i = 0; i < verticesCount; i++) {
        vertices.add(i, new Vertex({
            index: i,
            n: data.NORMAL ? data.NORMAL.get(i) : new pc.Vec3,
            v: data.POSITION ? data.POSITION.get(i) : new pc.Vec3,
            uv0: data.TEXCOORD0 ? data.TEXCOORD0.get(i) : new pc.Vec2,
            uv1: data.TEXCOORD1 ? data.TEXCOORD1.get(i) : new pc.Vec2,
            color: data.COLOR ? data.COLOR.get(i) : new pc.Vec3,
            bw: data.BLENDWEIGHT ? data.BLENDWEIGHT.get(i) : new pc.Vec4,
            bi: data.BLENDINDICES ? data.BLENDINDICES.get(i) : new pc.Vec4
        }))
    }

    return vertices
}

function calculateFaces(meshInstance, vertices) {
    let allVertices = vertices.values()
    let faces = new Set
    let ib = meshInstance.mesh.indexBuffer
    let ibLocked = ib.lock()
    let indexes = new Accessor(0, 1, ibLocked, pc.ELEMENTTYPE_UINT16, 1)
    for (let i = 0, l = indexes.length; i < l; i += 3) {
        let face = new Face({
            vertices: [
                indexes.get(i),
                indexes.get(i + 1),
                indexes.get(i + 2)
            ]
        }, allVertices)

        face.v0.faces.add(face)
        face.v1.faces.add(face)
        face.v2.faces.add(face)
        face.v0.neighbours.add(face.v1)
        face.v0.neighbours.add(face.v2)
        face.v1.neighbours.add(face.v0)
        face.v1.neighbours.add(face.v2)
        face.v2.neighbours.add(face.v1)
        face.v2.neighbours.add(face.v0)
        faces.add(face)

    }
    return faces
}

function specifyPreserved(vertices) {
    vertices.values().forEach(v => {
        v.neighbours.forEach(u => {
            let faces = 0
            v.faces.forEach(f => {
                if (f.hasVertex(u)) faces++
            })
            if (faces < 2) {
                v.preserve = true
                u.preserve = true
            }
        })
    })
}

function calculateErrors(vertices) {
    let allVertices = vertices.values();
    allVertices.forEach(v => v.calculateError(vertices))
}

function removeFaces(numberOfFaces, vertices, faces) {
    while (faces.length > numberOfFaces) {
        let u = lowestCost(vertices)
        if (!u || u.removalCost > 10000) break
        let v = u.removalCandidate
        collapse(faces, u, v)
    }
}

function collapse(vertices, faces, u, v) {
    let removeFaces = []
    v.n.add(u.n).scale(0.5)
    u.faces.forEach(face => {
        if (face.hasVertex(v)) {
            removeFaces.push(face)
        }
    })
    removeFaces.forEach(face => {
        u.faces.remove(face)
        faces.remove(face)
        u.neighbours.forEach(neighbour => {
            neighbour.faces.remove(face)
        })
    })
    u.faces.forEach(face => {
        face.replace(u, v)
    })
    vertices.remove(u.index)
    u.neighbours.forEach(neighbour => {
        neighbour.calculateError(vertices)
    })
}

function lowestCost(vertices) {
    let lowestCost = Infinity
    let lowest = null
    vertices.values().forEach(v => {
        if (v.removalCost < lowestCost) {
            lowestCost = v.removalCost
            lowest = v
        }
    })
    return lowest
}

function buildMesh(vertices, faces, settings) {
    let remap = new Map
    let index = 0
    let verts = vertices.values();
    verts.forEach(v => {
        remap.set(v.index, index++)
    })

    let pos = verts.map(v => v.v)
    let normals = verts.map(v => v.n)
    let uvs = verts.map(v => v.uv0)
    let uvs1 = verts.map(v => v.uv1)
    let indices = flatten(faces.map(face => f.vertices)).map(v => remap.get(v))

    let mesh = pc.createMesh(pc.app.graphicsDevice, pos, {
        normals: settings.normals ? normals : null,
        indices,
        uvs: settings.uv0 ? uvs : null,
        uvs1: settings.uv1 ? uvs1 : null,
        colors: settings.color ? verts.map(v => v.color) : null,
        tangents: pc.calculateTangents(pos, normals, uvs, indices),
        blendWeights: settings.blendWeights ? verts.map(v => v.blendWeight) : null,
        blendIndices: settings.blendIndices ? verts.map(v => v.blendIndices) : null,
    })

    return mesh
}

function decimate(numberOfFaces, meshInstance) {
    let settings = {}
    let vertices = prepare(meshInstance, settings)
    let faces = calculateFaces(meshInstance, vertices)
    specifyPreserved(vertices)
    removeFaces(numberOfFaces, vertices, faces)
    return buildMesh(vertices, faces, settings)
}


export default decimate

