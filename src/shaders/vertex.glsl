void main() {
    // modelMatrix transforms the coordinates local to the model into world space
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    // viewMatrix transform the world coordinates into the world space viewed by the camera (view space)
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;
}