import * as THREE from 'three/webgpu'
import { scene } from './scene'

export function setLight(){
  const amb = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(amb)

  // {
  //   const l = new THREE.DirectionalLight(0xffffff, 10)
  //   l.position.set(0,0,10)
  //   scene.add(l)
  // }
  // {
  //   const l = new THREE.DirectionalLight(0xffffff, 10)
  //   l.position.set(0,0,-10)
  //   scene.add(l)
  // }

  {
    const l = new THREE.PointLight(0xffffff, 10, 10, .1)
    l.position.set(0,0,0)
    scene.add(l)
  }
}