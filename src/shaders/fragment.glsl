uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  gl_FragColor = vec4(vec3(1.0, uv), 1.0);

  // transform color from linear colorSpace to sRGBColorSpace
  gl_FragColor = linearToOutputTexel( gl_FragColor );
}