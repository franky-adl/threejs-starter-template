// tried to use code from this,:
// https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
// which is apparently a three.js implementation of this:
// https://roystan.net/articles/toon-shader/
// but i think they made an update to the included libraries so it's? not compatible anymore?
// unsure tho, could be worth looking into ?
// otw we can try implementing roystan from scratch ourselves like they did
// feel free to delete all and start over bc this is all me experimenting w changing the 
// tutorial code and its not in a valuable state to save or anything so just rewrite!


#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform vec3 uColor;


varying vec3 vNormal;
varying vec3 vViewDir;
// uniform float uGlossiness;


void main() {
  // shadow map 
  DirectionalLightShadow directionalShadow = directionalLightShadows[0];

float shadow = getShadow(
    directionalShadowMap[0],
    directionalShadow.shadowMapSize,
    directionalShadow.shadowBias,
    directionalShadow.shadowRadius,
    vDirectionalShadowCoord[0]
  );

  // directional light
  float NdotL = dot(vNormal, directionalLights[0].direction);
  float lightIntensity = smoothstep(0.0, 0.01, NdotL * shadow);
  vec3 directionalLight;

  // no additional banding
  // directionalLight = directionalLights[0].color * lightIntensity;

  // with banding 
  if (NdotL < 0.40) {
    directionalLight = directionalLights[0].color * lightIntensity * 0.1;
  } else if (abs(NdotL) < 0.70) {
    directionalLight = directionalLights[0].color * lightIntensity * 0.3;
  } else if (abs(NdotL) < 0.90) {
    directionalLight = directionalLights[0].color * lightIntensity * 0.6;
  } else if (NdotL < 1.0) {
    directionalLight = directionalLights[0].color * lightIntensity;
  }

  // with banding alternate
  //   if (NdotL < 0.40) {
  //   directionalLight = (directionalLights[0].color + vec3(0.0, 7.0, -0.5))  * lightIntensity * 0.1;
  // } else if (abs(NdotL) < 0.70) {
  //   directionalLight = (directionalLights[0].color + vec3(0.5, 5.0, -1.0)) * lightIntensity * 0.3;
  // } else if (abs(NdotL) < 0.90) {
  //   directionalLight = (directionalLights[0].color + vec3(1.0, 3.0, -1.5))  * lightIntensity * 0.6;
  // } else if (NdotL < 1.0) {
  //   directionalLight = (directionalLights[0].color + vec3(2.0, 2.0, -2.0)) * lightIntensity;
  // }

  // specular reflection
  vec3 halfVector = normalize(directionalLights[0].direction + vViewDir);
  float NdotH = dot(vNormal, halfVector);

  float glossiness = 5.0; // adjust to preference, could be a GUI feature

  float specularIntensity = pow(NdotH * lightIntensity, 1000.0 / glossiness);
  float specularIntensitySmooth = smoothstep(0.05, 0.1, specularIntensity);

  vec3 specular = specularIntensitySmooth * directionalLights[0].color;

  // // rim lighting but it seems like a cheese way to do it, can prob improve
  float rimDot = 1.0 - dot(vViewDir, vNormal);
  float rimAmount = 0.6;

  float rimThreshold = 0.5;
  float rimIntensity = rimDot * pow(0.5, rimThreshold);
  rimIntensity = smoothstep(rimAmount - 0.01, rimAmount + 0.01, rimIntensity);

  vec3 rim = rimIntensity * directionalLights[0].color;

  gl_FragColor = vec4(uColor  * (ambientLightColor + directionalLight + specular + rim), 1.0);
  // gl_FragColor = vec4(uColor + rim + specular +, 1.0);



}