# Introduction

PlayCanvas Decimator that works on Mesh Instances either in the Editor or in the Engine.

## Installation

```shell
npm install --save playcanvas-decimator
```

## Usage

```javascript
import decimate from 'playcanvas-decimator';

let mesh = decimate(numberOfFaces, mesh.meshInstances[0])

```

## Face removal

Faces are removed based on curvature and the UV offset.

