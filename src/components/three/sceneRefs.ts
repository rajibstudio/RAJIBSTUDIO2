import type * as THREE from "three";
import type { DepthOfFieldEffect } from "postprocessing";

/** Live object handles the camera director needs for anchored shots and focus control. */
export const sceneRefs: {
  stillCamera: THREE.Object3D | null;
  photographerHead: THREE.Object3D | null;
  dof: DepthOfFieldEffect | null;
} = {
  stillCamera: null,
  photographerHead: null,
  dof: null,
};
