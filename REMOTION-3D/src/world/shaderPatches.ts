// Anti flicker: three r186 PCF shadows rotate their 5-tap Vogel disk per pixel with
// interleaved gradient noise. That dither is fine 1 to 2 px speckle that crawls on moving
// objects, so it is replaced by a fixed 3x3 grid (hardware PCF keeps each tap bilinear).
import * as THREE from "three";

const CHUNK = "shadowmap_pars_fragment";
const chunks = THREE.ShaderChunk as unknown as Record<string, string>;

// Matches the directional/spot PCF block (comments are stripped in the built module)
const re = /float phi = interleavedGradientNoise\( gl_FragCoord\.xy \) \* PI2;\s*shadow = \([\s\S]*?\) \* 0\.2;/;

const GRID = `// Fixed 3x3 grid, no per-pixel noise (stable over time)
				shadow = 0.0;
				for ( int i = - 1; i <= 1; i ++ ) {
					for ( int j = - 1; j <= 1; j ++ ) {
						shadow += texture( shadowMap, vec3( shadowCoord.xy + vec2( float( i ), float( j ) ) * radius * 0.6, shadowCoord.z ) );
					}
				}
				shadow *= ( 1.0 / 9.0 );`;

export let shadowPatchApplied = false;
if (re.test(chunks[CHUNK])) {
  chunks[CHUNK] = chunks[CHUNK].replace(re, GRID);
  shadowPatchApplied = true;
} else {
  console.warn("shaderPatches: PCF block not found, shadows keep the stock dithered sampling");
}
