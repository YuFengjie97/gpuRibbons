import { abs, rotate, attribute, cos, cross, fract, dot, float, floor, Fn, 
  fwidth, hash, instancedArray, instanceIndex, max, metalness, min, mix, mod, mx_noise_float, 
  mx_noise_vec3, normalLocal, normalView, positionLocal, pow, select, sin, 
  smoothstep, step, time, transformedNormalView, uniform, uv, varying, 
  vec3, vec4, vertexIndex, 
  vec2,
  cameraPosition,
  length,
  texture,
  cosh,
  PI2,
  PI} from "three/tsl"
import * as THREE from "three/webgpu"


import {scene, renderer, camera} from '@/world/scene'
import { emitter } from "@/utils/emitter"

export default function Ribbons(){

  // const loader = new THREE.TextureLoader();
  // const map = loader.load( import.meta.env.BASE_URL + 'img/trace_01.png' );


  const COUNT = 4000
  const segNum = 100
  const rowVerNum = segNum + 1
  const geo = new THREE.PlaneGeometry(1,1, segNum, 1)

  const ribbonWidthSmooth = uniform(true)
  const ribbonWidth = uniform(.2)
  const pathScale = uniform(.5)
  const pathSpeed = uniform(.1)
  const pathAmp = uniform(10)

  const norScale = uniform(.1)

  const seedScale = uniform(3)
  const seedAmp = uniform(1)

  const posBuffer = instancedArray(rowVerNum * COUNT, 'vec3')
  const norBuffer = instancedArray(rowVerNum * COUNT, 'vec3')
  const tanBuffer = instancedArray(rowVerNum * COUNT, 'vec3')
  const biTanBuffer = instancedArray(rowVerNum * COUNT, 'vec3')

  const mat = new THREE.MeshBasicNodeMaterial()
  mat.side = THREE.DoubleSide
  // mat.depthWrite = false
  // mat.transparent = true
  // mat.blending = THREE.AdditiveBlending
  // mat.metalness = 0
  // mat.roughness = 1.
  // mat.opacity = 1
  // mat.thickness = 1.5
  // mat.ior = 1.5
  // mat.transmission = 1
  // mat.transparent = true

  const vCol = varying(vec3(0))

  mat.positionNode = Fn(() => {
    const idx = float(instanceIndex)
    const verIdx = float(vertexIndex)
    const side = select((verIdx.div(rowVerNum)).greaterThan(.9999), 1, -1)
    const pointIdx = idx.mul(rowVerNum).add(mod(verIdx, rowVerNum))
    const len01 = mod(verIdx, rowVerNum).div(rowVerNum)

    const pos = posBuffer.element(pointIdx)
    const biTan = biTanBuffer.element(pointIdx)


    vCol.assign(
      sin(vec3(3,2,1)
            .add(idx.mul(.1))
            // .add(dot(pos, vec3(.4)))
      ).mul(.5).add(.5)
    )

    const reduceWidth = max(0.1, smoothstep(0., 1, len01).mul(smoothstep(1, .6, len01)))
    const w = select(ribbonWidthSmooth, ribbonWidth.mul(reduceWidth), ribbonWidth) 

    return (pos.add(side.mul(biTan).mul(w)))
  })()

  mat.normalNode = Fn(() => {
    const idx = float(instanceIndex)
    const verIdx = float(vertexIndex)
    const pointIdx = idx.mul(rowVerNum).add(mod(verIdx, rowVerNum))

    return norBuffer.element(pointIdx)
  })()

  mat.colorNode = Fn(() => {
    // const d = length(uv().sub(.5))
    // const glow = float(.1).div(d)
    // return vec4(vCol.mul(glow), glow)

    // const d = texture(map, uv()).r.mul(2)
    // return vec4(vCol.mul(d), 1)

    return vCol
  })()

  const hash31 = Fn(([p]: [THREE.Node<'float'>]) => {
    const scale = vec3(443.897, 441.423, 437.195);
    const st = vec3(p).mul(scale);

    const r = fract(sin(st));

    return r;
  });

  const path = Fn(([progress, seed]: [THREE.Node<'float'>, THREE.Node<'vec3'>]) => {
    const v = progress.mul(pathScale.mul(.01)).add(seed).add(time.mul(pathSpeed))
    const n = mx_noise_vec3(v.xy).mul(pathAmp)

    return n
  })

  const getNor = Fn(([v, progress]: [THREE.Node<'vec3'>, progress: THREE.Node<'float'>]) => {
    const help = v.add(vec3(.3,-.2,.1)).normalize()
    const n = cross(v, help).normalize()

    return n
  });

  const compute = Fn(() => {
    const idx = float(instanceIndex)
    const ribbonIdx = floor(idx.div(rowVerNum))
    const ribbonProgress = mod(idx, rowVerNum)
    // const seed = hash31(ribbonIdx).mul(3)
    const seed = mx_noise_vec3(vec2(1.1,1.2).mul(ribbonIdx).mul(seedScale)).mul(seedAmp)

    const pos = path(ribbonProgress, seed)
    const posPre = path(ribbonProgress.sub(1), seed)
    const tan = posPre.sub(pos).normalize()

    const nor = getNor(tan, idx)
    const biTan = cross(tan, nor).normalize()

    posBuffer.element(idx).assign(pos)
    tanBuffer.element(idx).assign(tan)
    norBuffer.element(idx).assign(nor)
    biTanBuffer.element(idx).assign(biTan)
  })().compute(rowVerNum * COUNT)


  emitter.on('animate', () => {
    renderer.compute(compute)
  })

  const ins = new THREE.InstancedMesh(geo, mat, COUNT)
  ins.frustumCulled = false

  scene.add(ins)
}