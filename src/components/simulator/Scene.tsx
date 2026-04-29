import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box, Html, Line, OrbitControls, PerspectiveCamera, Sky, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { siteConfig, type CameraConfig, type OpeningConfig, type PedestrianConfig } from "@/config";
import { useCameraStore } from "./cameraStore";
import rearFacade from "@/assets/rear-facade.jpeg";
import frontFacade from "@/assets/front-construction.jpeg";

const deg = THREE.MathUtils.degToRad;
const BUILDING = siteConfig.building.dimensions;
const HALF_W = BUILDING.width_ft / 2;
const HALF_D = BUILDING.depth_ft / 2;
const EAVE = siteConfig.roof.eave_height_ft;

function horizontalToVerticalFov(horizontal: number, aspect = 16 / 9) {
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(deg(horizontal) / 2) / aspect));
}

function cameraEuler(camera: CameraConfig) {
  return new THREE.Euler(deg(camera.rotation.pitch), deg(camera.rotation.yaw), 0, "YXZ");
}

/* =====================================================================
 *  BUILDING
 * ===================================================================== */

function GambrelRoof() {
  const { width_ft } = BUILDING;
  const { eave_height_ft, lower_slope_angle, upper_slope_angle, lower_slope_run_ft, overhang_ft } = siteConfig.roof;
  const depth = BUILDING.depth_ft + overhang_ft * 2;
  const lowerRise = Math.tan(deg(lower_slope_angle)) * lower_slope_run_ft;
  const upperRun = width_ft / 2 - lower_slope_run_ft;
  const upperRise = Math.tan(deg(upper_slope_angle)) * upperRun;
  const yBreak = eave_height_ft + lowerRise;
  const yRidge = yBreak + upperRise;
  const xOuter = width_ft / 2 + overhang_ft;
  const zFront = -depth / 2;
  const zBack = depth / 2;
  const vertices = new Float32Array([
    -xOuter, eave_height_ft, zFront, -width_ft / 2 + lower_slope_run_ft, yBreak, zFront, 0, yRidge, zFront, width_ft / 2 - lower_slope_run_ft, yBreak, zFront, xOuter, eave_height_ft, zFront,
    -xOuter, eave_height_ft, zBack, -width_ft / 2 + lower_slope_run_ft, yBreak, zBack, 0, yRidge, zBack, width_ft / 2 - lower_slope_run_ft, yBreak, zBack, xOuter, eave_height_ft, zBack,
  ]);
  const indices = [0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 8, 3, 8, 4, 4, 8, 9, 0, 1, 2, 0, 2, 3, 0, 3, 4, 5, 9, 8, 5, 8, 7, 5, 7, 6];
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [vertices]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#454a4f" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function FacadeReferencePlanes() {
  const [frontMap, rearMap] = useTexture([frontFacade, rearFacade]);
  return (
    <>
      <mesh position={[0, 15.0, -HALF_D - 0.04]} rotation={[0, 0, 0]}>
        <planeGeometry args={[BUILDING.width_ft, BUILDING.floor_height_ft * BUILDING.floors]} />
        <meshBasicMaterial map={frontMap} transparent opacity={0.42} toneMapped={false} />
      </mesh>
      <mesh position={[0, 15.0, HALF_D + 0.04]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[BUILDING.width_ft, BUILDING.floor_height_ft * BUILDING.floors]} />
        <meshBasicMaterial map={rearMap} transparent opacity={0.42} toneMapped={false} />
      </mesh>
    </>
  );
}

function Opening({ opening }: { opening: OpeningConfig }) {
  const z = opening.facade === "front" ? -HALF_D - 0.08 : HALF_D + 0.08;
  const rotationY = opening.facade === "front" ? 0 : Math.PI;
  const isGarage = opening.type === "garage";
  const isDoor = opening.type === "door";
  return (
    <group position={[opening.x, opening.y, z]} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[opening.width, opening.height]} />
        <meshStandardMaterial color={isGarage ? "#bfc4c7" : isDoor ? "#e8e5dc" : "#9ec5d8"} roughness={0.38} metalness={isGarage ? 0.18 : 0.02} />
      </mesh>
      <Line points={[[-opening.width / 2, -opening.height / 2, 0.05], [opening.width / 2, -opening.height / 2, 0.05], [opening.width / 2, opening.height / 2, 0.05], [-opening.width / 2, opening.height / 2, 0.05], [-opening.width / 2, -opening.height / 2, 0.05]]} color="#f4f7f8" lineWidth={2} />
      {!isGarage && !isDoor && <Line points={[[0, -opening.height / 2, 0.06], [0, opening.height / 2, 0.06], [-opening.width / 2, 0, 0.06], [opening.width / 2, 0, 0.06]]} color="#f4f7f8" lineWidth={1.5} />}
    </group>
  );
}

function SidingLines({ z, rear = false }: { z: number; rear?: boolean }) {
  // ~1.15 ft starting offset, ~0.85 ft spacing (≈ 10" siding boards)
  const lines = Array.from({ length: 36 }, (_, i) => 1.15 + i * 0.85).filter((y) => y < EAVE);
  return (
    <group rotation={[0, rear ? Math.PI : 0, 0]}>
      {lines.map((y) => (
        <Line key={`${z}-${y}`} points={[[-HALF_W, y, z], [HALF_W, y, z]]} color="#8e969c" lineWidth={0.7} transparent opacity={0.55} />
      ))}
    </group>
  );
}

function Building() {
  return (
    <group>
      <Box args={[BUILDING.width_ft, EAVE, BUILDING.depth_ft]} position={[0, EAVE / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#9ea3a6" roughness={0.85} />
      </Box>
      <FacadeReferencePlanes />
      <SidingLines z={-HALF_D - 0.115} />
      <SidingLines z={HALF_D + 0.115} rear />
      {siteConfig.facades.front.openings.map((opening) => <Opening key={opening.id} opening={opening} />)}
      {siteConfig.facades.rear.openings.map((opening) => <Opening key={opening.id} opening={opening} />)}
      <GambrelRoof />
    </group>
  );
}

/* =====================================================================
 *  ENVIRONMENT — street, sidewalk, driveway, grass, fence
 * ===================================================================== */

function Ground() {
  const street = siteConfig.environment.street;
  const sidewalk = siteConfig.environment.sidewalk;
  const driveway = siteConfig.environment.driveway;
  const drivewayCenterZ = (driveway.z_min + driveway.z_max) / 2;
  const drivewayDepth = driveway.z_max - driveway.z_min;

  const asphaltTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#3d4248";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 1500; i += 1) {
        const v = 55 + Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgba(${v}, ${v + 3}, ${v + 5}, ${0.1 + Math.random() * 0.15})`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 4);
    return texture;
  }, []);

  return (
    <group>
      {/* Grass base layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[200, 165]} />
        <meshStandardMaterial color="#4a6b3c" roughness={0.95} />
      </mesh>

      {/* Street (Dewey St) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, street.z_center]} receiveShadow>
        <planeGeometry args={[street.length_ft, street.width_ft]} />
        <meshStandardMaterial map={asphaltTexture} color="#4a4f55" roughness={0.92} />
      </mesh>

      {/* Double yellow line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, street.z_center - 0.5]}>
        <planeGeometry args={[street.length_ft, 0.4]} />
        <meshStandardMaterial color="#d4b54a" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, street.z_center + 0.5]}>
        <planeGeometry args={[street.length_ft, 0.4]} />
        <meshStandardMaterial color="#d4b54a" roughness={0.6} />
      </mesh>

      {/* Sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, sidewalk.z_center]} receiveShadow>
        <planeGeometry args={[sidewalk.length_ft, sidewalk.width_ft]} />
        <meshStandardMaterial color="#a8aaa6" roughness={0.85} />
      </mesh>

      {/* Driveway (asphalt area inside the front fence) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, drivewayCenterZ]} receiveShadow>
        <planeGeometry args={[driveway.width_ft, drivewayDepth]} />
        <meshStandardMaterial map={asphaltTexture} color="#52575c" roughness={0.92} />
      </mesh>

      {/* Side strips (gravel / packed dirt) between building and neighbors */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-23.6, 0.012, 0]} receiveShadow>
        <planeGeometry args={[11.5, BUILDING.depth_ft + 13]} />
        <meshStandardMaterial color="#6d6258" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[23.6, 0.012, 0]} receiveShadow>
        <planeGeometry args={[11.5, BUILDING.depth_ft + 13]} />
        <meshStandardMaterial color="#6d6258" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Fence() {
  const fence = siteConfig.environment.front_perimeter_fence;
  const gateWidth = "gate_width_ft" in fence ? fence.gate_width_ft : 0;
  const halfFence = fence.width_ft / 2;
  const halfGate = gateWidth / 2;
  const fenceSections: [number, number][] = [[-halfFence, -halfGate], [halfGate, halfFence]];
  const posts = Array.from(new Set([-halfGate, halfGate, ...fenceSections.flatMap(([start, end]) => Array.from({ length: 4 }, (_, i) => Number((start + (i * (end - start)) / 3).toFixed(2))))]));
  return (
    <group position={[0, fence.height_ft / 2, fence.z]}>
      {fenceSections.map(([start, end]) => <Line key={`${start}-${end}`} points={[[start, fence.height_ft / 2, 0], [end, fence.height_ft / 2, 0], [end, -fence.height_ft / 2, 0], [start, -fence.height_ft / 2, 0], [start, fence.height_ft / 2, 0]]} color="#c7d0d6" lineWidth={2} />)}
      {posts.map((x) => <Box key={x} args={[0.16, fence.height_ft + 0.82, 0.16]} position={[x, 0, 0]}><meshStandardMaterial color="#b9c2c8" /></Box>)}
      {gateWidth > 0 && <Line points={[[-halfGate, -fence.height_ft / 2, 0.06], [halfGate, -fence.height_ft / 2, 0.06]]} color="#d7e0e6" lineWidth={2} transparent opacity={0.75} />}
      {fenceSections.flatMap(([start, end]) => Array.from({ length: Math.max(3, Math.ceil((end - start) / 1.8)) }, (_, i) => start + i * 1.8).map((x) => <Line key={`a-${start}-${x}`} points={[[x, -fence.height_ft / 2, 0.03], [Math.min(x + 1.8, end), fence.height_ft / 2, 0.03]]} color="#9da9b0" lineWidth={0.6} />))}
      {fenceSections.flatMap(([start, end]) => Array.from({ length: Math.max(3, Math.ceil((end - start) / 1.8)) }, (_, i) => start + i * 1.8).map((x) => <Line key={`b-${start}-${x}`} points={[[x, fence.height_ft / 2, 0.04], [Math.min(x + 1.8, end), -fence.height_ft / 2, 0.04]]} color="#9da9b0" lineWidth={0.6} />))}
    </group>
  );
}

function Tree({ tree }: { tree: typeof siteConfig.environment.front_obstacles[number] }) {
  return (
    <group position={tree.position}>
      <Box args={[1.48, tree.height_ft * 0.62, 1.48]} position={[0, tree.height_ft * 0.31, 0]} castShadow>
        <meshStandardMaterial color="#5b412d" roughness={0.95} />
      </Box>
      <mesh position={[0, tree.height_ft * 0.78, 0]} castShadow receiveShadow>
        <sphereGeometry args={[tree.radius_ft, 12, 10]} />
        <meshStandardMaterial color="#3d5e44" roughness={0.95} />
      </mesh>
      <mesh position={[tree.radius_ft * 0.5, tree.height_ft * 0.65, 1.0]} castShadow>
        <sphereGeometry args={[tree.radius_ft * 0.55, 10, 8]} />
        <meshStandardMaterial color="#446848" roughness={0.95} />
      </mesh>
    </group>
  );
}

function NeighborHouse({ neighbor }: { neighbor: typeof siteConfig.environment.neighbors[number] }) {
  const [w, h, d] = neighbor.size;
  const baseColor = neighbor.color === "green" ? "#7a9479" : "#8a8d8f";
  const trim = "#e6e8e9";
  const facingSign = neighbor.position[0] < 0 ? 1 : -1;
  const facingX = facingSign * (w / 2 + 0.08);

  const sideWindowRows = [h * 0.32, h * 0.62];
  const sideWindowCols = [-d * 0.32, -d * 0.08, d * 0.18, d * 0.42];
  const frontWindowRows = [h * 0.32, h * 0.62];
  const frontWindowCols = [-w * 0.28, w * 0.28];

  return (
    <group position={neighbor.position}>
      <Box args={neighbor.size} castShadow receiveShadow>
        <meshStandardMaterial color={baseColor} roughness={0.85} />
      </Box>

      {/* Subtle siding lines on the side facing our building */}
      <group position={[facingX, 0, 0]} rotation={[0, facingSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
        {Array.from({ length: 18 }, (_, i) => 0.82 + i * 1.05).filter((y) => y < h).map((y) => (
          <Line key={`siding-${y}`} points={[[-d / 2 + 0.16, y - h / 2, 0.005], [d / 2 - 0.16, y - h / 2, 0.005]]} color={baseColor === "#7a9479" ? "#5f7a5e" : "#6f7274"} lineWidth={0.5} transparent opacity={0.55} />
        ))}
      </group>

      {/* Side-facing windows (toward our building) */}
      {sideWindowRows.map((y) =>
        sideWindowCols.map((z) => (
          <group key={`sw-${y}-${z}`} position={[facingX, y - h / 2, z]} rotation={[0, facingSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[2.30, 3.12]} />
              <meshStandardMaterial color="#bcd4dd" roughness={0.35} metalness={0.1} />
            </mesh>
            <Line points={[[-1.15, -1.56, 0.02], [1.15, -1.56, 0.02], [1.15, 1.56, 0.02], [-1.15, 1.56, 0.02], [-1.15, -1.56, 0.02]]} color={trim} lineWidth={1.2} />
            <Line points={[[0, -1.56, 0.025], [0, 1.56, 0.025]]} color={trim} lineWidth={0.9} />
          </group>
        ))
      )}

      {/* Front-facing windows (street side) */}
      {frontWindowRows.map((y) =>
        frontWindowCols.map((x) => (
          <group key={`fw-${y}-${x}`} position={[x, y - h / 2, -d / 2 - 0.08]}>
            <mesh>
              <planeGeometry args={[2.79, 3.28]} />
              <meshStandardMaterial color="#bcd4dd" roughness={0.35} metalness={0.1} />
            </mesh>
            <Line points={[[-1.4, -1.64, 0.02], [1.4, -1.64, 0.02], [1.4, 1.64, 0.02], [-1.4, 1.64, 0.02], [-1.4, -1.64, 0.02]]} color={trim} lineWidth={1.2} />
            <Line points={[[0, -1.64, 0.025], [0, 1.64, 0.025]]} color={trim} lineWidth={0.9} />
          </group>
        ))
      )}

      {/* Front door */}
      <group position={[w * 0.28, -h / 2 + 3.45, -d / 2 - 0.1]}>
        <mesh>
          <planeGeometry args={[2.79, 6.73]} />
          <meshStandardMaterial color={baseColor === "#7a9479" ? "#3d5945" : "#5d4a36"} roughness={0.6} />
        </mesh>
        <Line points={[[-1.4, -3.36, 0.02], [1.4, -3.36, 0.02], [1.4, 3.36, 0.02], [-1.4, 3.36, 0.02], [-1.4, -3.36, 0.02]]} color={trim} lineWidth={1.3} />
      </group>

      {/* Roof slab */}
      <Box args={[w + 1, 0.82, d + 1]} position={[0, h / 2 + 0.4, 0]} castShadow>
        <meshStandardMaterial color="#3a3d40" roughness={0.95} />
      </Box>
    </group>
  );
}

/* =====================================================================
 *  PEDESTRIANS (low-poly, sized for feet units)
 * ===================================================================== */

function Person({ data }: { data: PedestrianConfig }) {
  const color = data.color ?? "#3a5a7a";
  const skin = "#d4a373";
  const totalHeight = 5.84; // 5'10"
  const headRadius = 0.43;
  const torsoLen = 2.85;
  const torsoCenterY = 3.6;
  return (
    <group position={data.position} rotation={[0, data.rotation_y ?? 0, 0]}>
      {/* Torso */}
      <mesh position={[0, torsoCenterY, 0]} castShadow>
        <capsuleGeometry args={[0.59, torsoLen - 0.18, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Pants */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.56, 2.95, 10]} />
        <meshStandardMaterial color="#2c2f36" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, totalHeight - headRadius, 0]} castShadow>
        <sphereGeometry args={[headRadius, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
    </group>
  );
}

function Dog({ data }: { data: PedestrianConfig }) {
  const color = data.color ?? "#a07a4a";
  return (
    <group position={data.position} rotation={[0, data.rotation_y ?? 0, 0]}>
      {/* Body (capsule horizontal along X) */}
      <group position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.39, 1.80, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
      {/* Head */}
      <mesh position={[1.38, 1.38, 0]} castShadow>
        <sphereGeometry args={[0.43, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Snout */}
      <mesh position={[1.80, 1.25, 0]} castShadow>
        <boxGeometry args={[0.39, 0.26, 0.30]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Ears */}
      <mesh position={[1.18, 1.80, 0.23]} castShadow>
        <coneGeometry args={[0.16, 0.33, 6]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[1.18, 1.80, -0.23]} castShadow>
        <coneGeometry args={[0.16, 0.33, 6]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Legs */}
      {[
        [-0.72, 0.52, 0.30],
        [-0.72, 0.52, -0.30],
        [0.72, 0.52, 0.30],
        [0.72, 0.52, -0.30],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 1.05, 6]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
      ))}
      {/* Tail */}
      <mesh position={[-1.05, 1.48, 0]} rotation={[0, 0, 0.7]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 0.82, 6]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
    </group>
  );
}

function Car({ data }: { data: PedestrianConfig }) {
  const color = data.color ?? "#2c3e50";
  return (
    <group position={data.position} rotation={[0, data.rotation_y ?? 0, 0]}>
      {/* Lower body — typical sedan ~14.5 ft long */}
      <Box args={[6.07, 1.80, 14.44]} position={[0, 1.48, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.5} />
      </Box>
      {/* Cabin */}
      <Box args={[5.58, 2.30, 7.87]} position={[0, 3.45, -0.49]} castShadow>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.5} />
      </Box>
      {/* Windows (slightly inset) */}
      <Box args={[5.64, 1.48, 7.38]} position={[0, 3.87, -0.49]}>
        <meshStandardMaterial color="#1a242c" roughness={0.2} metalness={0.7} />
      </Box>
      {/* Wheels */}
      {[
        [-3.02, 1.05, 4.59],
        [3.02, 1.05, 4.59],
        [-3.02, 1.05, -4.59],
        [3.02, 1.05, -4.59],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.05, 1.05, 0.72, 14]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* Headlights */}
      <mesh position={[-1.80, 1.80, 7.25]}>
        <boxGeometry args={[1.15, 0.59, 0.13]} />
        <meshStandardMaterial color="#f5f1d0" emissive="#fff7c2" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[1.80, 1.80, 7.25]}>
        <boxGeometry args={[1.15, 0.59, 0.13]} />
        <meshStandardMaterial color="#f5f1d0" emissive="#fff7c2" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function Pedestrians() {
  return (
    <group>
      {siteConfig.environment.pedestrians.map((entity) => {
        if (entity.type === "person") return <Person key={entity.id} data={entity} />;
        if (entity.type === "dog") return <Dog key={entity.id} data={entity} />;
        if (entity.type === "car") return <Car key={entity.id} data={entity} />;
        return null;
      })}
    </group>
  );
}

function Environment() {
  return (
    <group>
      <Ground />
      <Fence />
      {siteConfig.environment.front_obstacles.map((tree) => <Tree key={tree.id} tree={tree} />)}
      {siteConfig.environment.neighbors.map((neighbor) => <NeighborHouse key={neighbor.id} neighbor={neighbor} />)}
      <Pedestrians />
    </group>
  );
}

/* =====================================================================
 *  CAMERAS
 * ===================================================================== */

function Frustum({ camera, dim = false }: { camera: CameraConfig; dim?: boolean }) {
  const distance = camera.frustum_max_distance_ft;
  const halfW = Math.tan(deg(camera.fov_horizontal / 2)) * distance;
  const halfH = halfW * 0.56;
  const corners: [number, number, number][] = [
    [-halfW, -halfH, -distance],
    [halfW, -halfH, -distance],
    [halfW, halfH, -distance],
    [-halfW, halfH, -distance],
  ];
  const segments = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([a, b]) => [corners[a], corners[b]]).flat() as [number, number, number][];
  const color = dim ? "#7a6840" : "#ffc857";
  const opacity = dim ? 0.35 : 0.95;
  return (
    <group position={camera.position} rotation={cameraEuler(camera)}>
      {corners.map((corner, i) => (
        <Line key={i} points={[[0, 0, 0], corner]} color={color} lineWidth={dim ? 1 : 1.6} transparent opacity={opacity} />
      ))}
      <Line points={segments} color={color} lineWidth={dim ? 1 : 1.6} transparent opacity={opacity} />
    </group>
  );
}

function CoverageGroundFootprint({ camera }: { camera: CameraConfig }) {
  /**
   * Project the camera frustum corners onto the ground (y=0) and outline the
   * polygon there. This is the most useful single visual: where the camera
   * actually "sees" on the floor.
   */
  const distance = camera.frustum_max_distance_ft;
  const halfW = Math.tan(deg(camera.fov_horizontal / 2)) * distance;
  const halfH = halfW * 0.56;

  const points = useMemo(() => {
    const localCorners = [
      new THREE.Vector3(-halfW, -halfH, -distance),
      new THREE.Vector3(halfW, -halfH, -distance),
      new THREE.Vector3(halfW, halfH, -distance),
      new THREE.Vector3(-halfW, halfH, -distance),
    ];
    const origin = new THREE.Vector3(...camera.position);
    const euler = cameraEuler(camera);
    const matrix = new THREE.Matrix4().compose(origin, new THREE.Quaternion().setFromEuler(euler), new THREE.Vector3(1, 1, 1));

    const projected: [number, number, number][] = [];
    for (const corner of localCorners) {
      const world = corner.clone().applyMatrix4(matrix);
      const dir = world.clone().sub(origin);
      if (Math.abs(dir.y) < 1e-4) continue;
      const t = -origin.y / dir.y;
      if (t < 0) continue;
      const ground = origin.clone().add(dir.multiplyScalar(t));
      projected.push([ground.x, 0.07, ground.z]);
    }
    if (projected.length < 3) return null;
    projected.push(projected[0]);
    return projected;
  }, [camera, halfW, halfH, distance]);

  if (!points) return null;
  return <Line points={points} color="#ffc857" lineWidth={2.2} transparent opacity={0.85} />;
}

function SecurityCamera({ camera, selected, hidden }: { camera: CameraConfig; selected: boolean; hidden: boolean }) {
  const selectCamera = useCameraStore((state) => state.selectCamera);
  if (hidden) return null;
  return (
    <group position={camera.position} rotation={cameraEuler(camera)} onClick={(event) => { event.stopPropagation(); selectCamera(camera.id, "pov"); }}>
      {/* Hikvision bullet body */}
      <Box args={[1.25, 0.82, 2.03]} position={[0, 0, -0.59]} castShadow>
        <meshStandardMaterial color={selected ? "#ffd166" : "#e9eef2"} roughness={0.3} metalness={0.18} />
      </Box>
      {/* Lens housing */}
      <Box args={[0.52, 0.52, 0.66]} position={[0, 0, -1.90]}>
        <meshStandardMaterial color="#1d242b" roughness={0.45} />
      </Box>
      {/* Mounting arm */}
      <Box args={[0.18, 0.4, 0.18]} position={[0, 0.6, 0.3]}>
        <meshStandardMaterial color={selected ? "#ffd166" : "#dde2e6"} roughness={0.4} />
      </Box>
      <Html position={[0, 1.48, 0]} center distanceFactor={40}>
        <span className={`rounded-md border px-2 py-1 text-xs font-semibold shadow-sm ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/90 text-foreground"}`}>{camera.id}</span>
      </Html>
    </group>
  );
}

function ActivePovCamera() {
  const { size } = useThree();
  const camera = useCameraStore((state) => state.cameras.find((item) => item.id === state.selectedCameraId));
  const viewMode = useCameraStore((state) => state.viewMode);
  if (!camera) return null;
  return (
    <PerspectiveCamera
      makeDefault={viewMode === "pov"}
      position={camera.position}
      rotation={cameraEuler(camera)}
      fov={horizontalToVerticalFov(camera.fov_horizontal, size.width / Math.max(size.height, 1))}
      near={0.26}
      far={400}
    />
  );
}

function OrbitViewCamera() {
  const { camera } = useThree();
  const viewMode = useCameraStore((state) => state.viewMode);

  useEffect(() => {
    if (viewMode === "orbit") {
      camera.position.set(52.5, 42.7, 59.0);
      camera.lookAt(0, 14.76, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera, viewMode]);

  useFrame(() => {
    if (viewMode === "orbit") {
      camera.lookAt(0, 14.76, 0);
    }
  });

  return null;
}

/* =====================================================================
 *  SCENE ROOT
 * ===================================================================== */

function SceneContents() {
  const cameras = useCameraStore((state) => state.cameras);
  const selectedId = useCameraStore((state) => state.selectedCameraId);
  const viewMode = useCameraStore((state) => state.viewMode);
  const showAllFrustums = useCameraStore((state) => state.showAllFrustums);
  const controlsRef = useRef(null);

  return (
    <>
      <Sky sunPosition={[26.2, 39.4, 13.1]} turbidity={4} rayleigh={1.0} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[26.2, 46.0, 19.7]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} />
      <OrbitViewCamera />
      <ActivePovCamera />
      {viewMode === "orbit" && <OrbitControls ref={controlsRef} target={[0, 14.76, 0]} enableDamping minDistance={26} maxDistance={165} />}

      <Building />
      <Environment />

      {viewMode === "orbit" && cameras.map((camera) => {
        if (showAllFrustums) {
          return <Frustum key={`${camera.id}-frustum`} camera={camera} dim={camera.id !== selectedId} />;
        }
        if (camera.id === selectedId) {
          return <Frustum key={`${camera.id}-frustum`} camera={camera} />;
        }
        return null;
      })}
      {viewMode === "orbit" && cameras.filter((c) => c.id === selectedId).map((c) => <CoverageGroundFootprint key={`${c.id}-footprint`} camera={c} />)}

      {cameras.map((camera) => {
        const isActive = camera.id === selectedId;
        const hide = viewMode === "pov" && isActive;
        return <SecurityCamera key={camera.id} camera={camera} selected={isActive} hidden={hide} />;
      })}

      <Html position={[0, 0.3, -50.5]} center>
        <div className="rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm">N / Front — Dewey St</div>
      </Html>
    </>
  );
}

export function SecurityScene() {
  return (
    <Canvas shadows camera={{ position: [52.5, 42.7, 59.0], fov: 48, near: 0.26, far: 460 }} gl={{ antialias: true }} className="h-full w-full">
      <SceneContents />
    </Canvas>
  );
}
