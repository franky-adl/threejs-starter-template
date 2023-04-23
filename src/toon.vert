// tried to use code from this,:
// https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
// which is apparently a three.js implementation of this:
// https://roystan.net/articles/toon-shader/
// but i think they made an update to the included libraries so it's? not compatible anymore?
// unsure tho, could be worth looking into ?
// otw we can try implementing roystan from scratch ourselves like they did
// feel free to delete all and start over bc this is all me experimenting w changing the 
// tutorial code and its not in a valuable state to save or anything so just rewrite!

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 clipPosition = projectionMatrix * viewPosition;

  vNormal = normalize(normalMatrix * normal);

  gl_Position = clipPosition;
}