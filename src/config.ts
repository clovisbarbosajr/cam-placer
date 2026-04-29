/**
 * Site config — 230 Dewey St, Bridgeport, CT
 * All linear units are FEET. All angles are degrees.
 *
 * Cameras: Hikvision ColorVu DS-2CD2087G2-LU (8MP / 4K bullet)
 *   2.8mm lens: HFOV 102°, DORI Recognize ~62 ft, Identify ~33 ft
 *   4mm lens:   HFOV 88°,  DORI Recognize ~69 ft, Identify ~36 ft
 *   Smart Hybrid Light: up to 131 ft of supplemental illumination
 */
export type FacadeName = "front" | "rear" | "left" | "right";

export type OpeningConfig = {
  id: string;
  type: "window" | "garage" | "door";
  facade: FacadeName;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CameraConfig = {
  id: string;
  target: string;
  position: [number, number, number];
  rotation: { pitch: number; yaw: number };
  fov_horizontal: number;
  frustum_max_distance_ft: number;
  /** Hikvision lens variant for spec display */
  lens_mm: 2.8 | 4 | 6;
  /** Optional install note shown in UI */
  install_note?: string;
};

export type PedestrianConfig = {
  id: string;
  type: "person" | "dog" | "car";
  position: [number, number, number];
  rotation_y?: number;
  color?: string;
  variant?: "walker" | "standing" | "owner";
};

export const siteConfig = {
  address: "230 Dewey St, Bridgeport, CT",
  units: "ft" as const,
  camera_model: "Hikvision ColorVu DS-2CD2087G2-LU (8MP)",
  building: {
    dimensions: { width_ft: 35.4, depth_ft: 56.4, floors: 3, floor_height_ft: 10.0 },
  },
  roof: {
    eave_height_ft: 30.0,
    // Real gambrel/mansard: steep lower slope, shallow upper slope
    lower_slope_angle: 72,
    upper_slope_angle: 14,
    lower_slope_run_ft: 11.2,
    overhang_ft: 1.15,
  },
  facades: {
    front: {
      z: -28.2,
      openings: [
        { id: "front-garage", type: "garage", facade: "front", x: 0, y: 4.76, width: 24.0, height: 9.0 },
        { id: "front-l2-left", type: "window", facade: "front", x: -12.1, y: 15.75, width: 4.1, height: 5.4 },
        { id: "front-l2-mid", type: "window", facade: "front", x: 0, y: 15.75, width: 5.4, height: 4.4 },
        { id: "front-l2-right", type: "window", facade: "front", x: 12.3, y: 15.75, width: 5.4, height: 4.4 },
        { id: "front-l3-left", type: "window", facade: "front", x: -11.65, y: 24.77, width: 4.76, height: 5.08 },
        { id: "front-l3-mid", type: "window", facade: "front", x: 0, y: 24.77, width: 4.76, height: 5.08 },
        { id: "front-l3-right", type: "window", facade: "front", x: 11.65, y: 24.77, width: 4.76, height: 5.08 },
      ] as OpeningConfig[],
    },
    rear: {
      z: 28.2,
      openings: [
        { id: "rear-door", type: "door", facade: "rear", x: -13.78, y: 3.77, width: 3.28, height: 7.38 },
        { id: "rear-l1-mid", type: "window", facade: "rear", x: -2.30, y: 5.74, width: 5.58, height: 4.10 },
        { id: "rear-l1-right", type: "window", facade: "rear", x: 10.83, y: 5.74, width: 5.58, height: 4.10 },
        { id: "rear-l2-left", type: "window", facade: "rear", x: -13.29, y: 15.49, width: 3.94, height: 5.25 },
        { id: "rear-l2-mid", type: "window", facade: "rear", x: 0, y: 15.49, width: 5.74, height: 4.76 },
        { id: "rear-l2-right", type: "window", facade: "rear", x: 11.81, y: 15.49, width: 5.74, height: 4.76 },
        { id: "rear-l3-left", type: "window", facade: "rear", x: -11.48, y: 25.0, width: 5.09, height: 5.09 },
        { id: "rear-l3-mid", type: "window", facade: "rear", x: 0, y: 25.0, width: 5.09, height: 5.09 },
        { id: "rear-l3-right", type: "window", facade: "rear", x: 11.48, y: 25.0, width: 5.09, height: 5.09 },
      ] as OpeningConfig[],
    },
  },
  environment: {
    front_perimeter_fence: { z: -66.0, width_ft: 82.0, height_ft: 4.76, gate_width_ft: 46.0 },
    side_property_lines: { west_x: -41.0, east_x: 41.0 },
    front_obstacles: [
      { id: "front-yard-tree", type: "tree", position: [34.0, 0, -57.5] as [number, number, number], radius_ft: 5.8, height_ft: 27.89 },
    ],
    neighbors: [
      { id: "west-neighbor-front", color: "gray", position: [-49.0, 10.5, -15.0] as [number, number, number], size: [14.0, 21.0, 23.5] as [number, number, number] },
      { id: "west-neighbor-rear", color: "gray", position: [-49.0, 10.0, 16.5] as [number, number, number], size: [13.2, 20.0, 22.0] as [number, number, number] },
      { id: "east-green-neighbor-front", color: "green", position: [49.0, 10.17, -15.0] as [number, number, number], size: [14.0, 20.34, 23.5] as [number, number, number] },
      { id: "east-green-neighbor-rear", color: "green", position: [49.0, 9.9, 16.5] as [number, number, number], size: [13.2, 19.8, 22.0] as [number, number, number] },
    ],
    street: {
      // Dewey St runs along the front of the building (parallel to X axis)
      z_center: -84.0,
      width_ft: 19,
      length_ft: 200,
    },
    sidewalk: {
      z_center: -71.0,
      width_ft: 6,
      length_ft: 200,
    },
    driveway: {
      z_min: -64.5,
      z_max: -30.2,
      width_ft: 76.0,
    },
    pedestrians: [
      { id: "ped-walker", type: "person", position: [11.48, 0, -72.8], rotation_y: -1.2, color: "#3a5a7a", variant: "walker" },
      { id: "ped-dog", type: "dog", position: [15.09, 0, -72.0], rotation_y: -1.2, color: "#a07a4a" },
      { id: "ped-standing", type: "person", position: [-26.5, 0, -58.0], rotation_y: 0.4, color: "#7a3a3a", variant: "standing" },
      { id: "car-driveway-left", type: "car", position: [-10.5, 0, -49.2], rotation_y: 0, color: "#2c3e50" },
      { id: "car-driveway-right", type: "car", position: [10.5, 0, -49.2], rotation_y: 0, color: "#42515f" },
    ] as PedestrianConfig[],
  },
  cameras: [
    // CAM-01 — West side wall (mid-wall, perpendicular)
    {
      id: "CAM-01",
      target: "Left side corridor — both ends + ground",
      position: [-18.35, 15.75, 0] as [number, number, number],
      rotation: { pitch: -42, yaw: 0 },
      fov_horizontal: 120,
      frustum_max_distance_ft: 62,
      lens_mm: 2.8,
      install_note: "Mid-wall at 15.75 ft. Hikvision DS-2CD2087G2-LU 2.8mm (102° HFOV). Covers both ends of the side corridor.",
    },
    // CAM-02 — East side wall (mid-wall, perpendicular, tight gap)
    {
      id: "CAM-02",
      target: "Right side corridor — both ends + ground",
      position: [18.35, 15.75, 0] as [number, number, number],
      rotation: { pitch: -42, yaw: 180 },
      fov_horizontal: 120,
      frustum_max_distance_ft: 62,
      lens_mm: 2.8,
      install_note: "Mid-wall at 15.75 ft. 2.8mm wide lens for the tight ~3 ft gap to the green neighbor.",
    },
    // CAM-03 — Rear (offset to cover service door at x=-13.78)
    {
      id: "CAM-03",
      target: "Rear yard + service door",
      position: [0, 14.76, 28.2] as [number, number, number],
      rotation: { pitch: -36, yaw: 180 },
      fov_horizontal: 102,
      frustum_max_distance_ft: 58,
      lens_mm: 2.8,
      install_note: "Offset to cover service door at x=-13.78 ft. 4mm lens for facial recognition at the door.",
    },
    // CAM-04 — Front, over the garage door (right side)
    {
      id: "CAM-04",
      target: "Front right after last window — gate + driveway",
      position: [16.6, 16.0, -28.2] as [number, number, number],
      rotation: { pitch: -38, yaw: 0 },
      fov_horizontal: 102,
      frustum_max_distance_ft: 55,
      lens_mm: 2.8,
      install_note: "Front facade, right side after the last window. 2.8mm captures the wider parking pad, gate, and entry path.",
    },
    // CAM-05 — Tree-mounted (replacing existing camera)
    {
      id: "CAM-05",
      target: "Tree-mounted overview (faces building)",
      position: [34.0, 18.04, -57.5] as [number, number, number],
      rotation: { pitch: -27, yaw: 145 },
      fov_horizontal: 102,
      frustum_max_distance_ft: 58,
      lens_mm: 2.8,
      install_note: "Mounted on tree trunk at 18 ft. 2.8mm wide lens for full front-facade overview + driveway.",
    },
  ] as CameraConfig[],
} as const;
