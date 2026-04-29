import { Camera, Download, Eye, EyeOff, RotateCcw, SlidersHorizontal } from "lucide-react";
import { siteConfig } from "@/config";
import { Button } from "@/components/ui/button";
import { useCameraStore } from "./cameraStore";
import { SecurityScene } from "./Scene";

function SliderControl({ label, value, min, max, step = 1, suffix, onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 rounded-lg border border-border bg-secondary/45 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input className="h-2 w-full accent-primary" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function LeftSidebar() {
  const cameras = useCameraStore((state) => state.cameras);
  const selectedCameraId = useCameraStore((state) => state.selectedCameraId);
  const selectCamera = useCameraStore((state) => state.selectCamera);
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card/80 p-4 backdrop-blur xl:block">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Camera plan</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">230 Dewey St</h2>
        <p className="mt-1 text-[10px] text-muted-foreground">{siteConfig.camera_model}</p>
      </div>
      <div className="grid gap-2">
        {cameras.map((camera) => (
          <button
            key={camera.id}
            onClick={() => selectCamera(camera.id)}
            className={`rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${camera.id === selectedCameraId ? "border-primary bg-primary/12 shadow-[var(--shadow-active)]" : "border-border bg-secondary/55"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-foreground">{camera.id}</span>
              <Camera className="size-4 text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{camera.target}</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
              y={camera.position[1].toFixed(1)} ft · pitch {camera.rotation.pitch}° · {camera.fov_horizontal}° · {camera.lens_mm}mm
            </p>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-border bg-secondary/45 p-3 text-xs leading-relaxed text-muted-foreground">
        Geometry is generated from <span className="font-mono text-foreground">config.ts</span>. All measurements in feet. Click a camera to enter POV. Drag sliders to adjust live.
      </div>
    </aside>
  );
}

function RightSidebar() {
  const selectedCameraId = useCameraStore((state) => state.selectedCameraId);
  const camera = useCameraStore((state) => state.cameras.find((item) => item.id === selectedCameraId));
  const updateCamera = useCameraStore((state) => state.updateCamera);
  const exportConfig = useCameraStore((state) => state.exportConfig);
  if (!camera) return null;

  const updatePositionY = (height: number) => updateCamera(camera.id, { position: [camera.position[0], height, camera.position[2]] });
  const updateYaw = (yaw: number) => updateCamera(camera.id, { rotation: { ...camera.rotation, yaw } });
  const updatePitch = (pitch: number) => updateCamera(camera.id, { rotation: { ...camera.rotation, pitch } });
  const updateFov = (fov_horizontal: number) => updateCamera(camera.id, { fov_horizontal });

  return (
    <aside className="max-h-[42dvh] w-full overflow-y-auto border-t border-border bg-card/90 p-3 backdrop-blur lg:max-h-none lg:w-80 lg:border-l lg:border-t-0 lg:p-4">
      <div className="mb-3 flex items-start justify-between gap-3 lg:mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active camera</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-foreground lg:text-xl"><SlidersHorizontal className="size-5 text-primary" />{camera.id}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{camera.target}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">{camera.lens_mm}mm lens · {camera.fov_horizontal}° HFOV</p>
        </div>
      </div>
      {camera.install_note && (
        <div className="mb-3 hidden rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground sm:block">
          <span className="font-semibold text-primary">Install:</span> {camera.install_note}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:gap-3">
        <SliderControl label="Height Y" value={camera.position[1]} min={7} max={31} step={0.1} suffix=" ft" onChange={updatePositionY} />
        <SliderControl label="Yaw" value={camera.rotation.yaw} min={-180} max={180} suffix="°" onChange={updateYaw} />
        <SliderControl label="Pitch" value={camera.rotation.pitch} min={-65} max={18} suffix="°" onChange={updatePitch} />
        <SliderControl label="FOV" value={camera.fov_horizontal} min={35} max={120} suffix="°" onChange={updateFov} />
      </div>
      <div className="mt-3 grid gap-1 rounded-lg border border-border bg-secondary/40 p-2 font-mono text-[10px] text-muted-foreground lg:mt-4 lg:p-3 lg:text-xs">
        <span>pos: [{camera.position.map((value) => value.toFixed(2)).join(", ")}] ft</span>
        <span>range: {camera.frustum_max_distance_ft.toFixed(0)} ft</span>
      </div>
      <Button className="mt-3 w-full lg:mt-4" onClick={exportConfig}>
        <Download className="size-4" /> Export config
      </Button>
    </aside>
  );
}

function TopBar() {
  const viewMode = useCameraStore((state) => state.viewMode);
  const setViewMode = useCameraStore((state) => state.setViewMode);
  const showAllFrustums = useCameraStore((state) => state.showAllFrustums);
  const toggleShowAllFrustums = useCameraStore((state) => state.toggleShowAllFrustums);
  return (
    <header className="flex flex-col gap-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-0">
      <div className="min-w-0">
        <h1 className="truncate text-base font-black tracking-tight text-foreground sm:text-2xl">3D Security Camera Placement Simulator</h1>
        <p className="hidden text-xs text-muted-foreground sm:block">{siteConfig.address} · {siteConfig.camera_model} · all measurements in feet</p>
      </div>
      <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0">
        <Button className="shrink-0" size="sm" variant={showAllFrustums ? "default" : "outline"} onClick={toggleShowAllFrustums} title="Show all camera frustums (only active in Orbit View)">
          {showAllFrustums ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          <span className="hidden sm:inline">{showAllFrustums ? "All frustums" : "Only selected"}</span>
        </Button>
        <div className="flex shrink-0 rounded-lg border border-border bg-secondary p-1">
          <Button size="sm" variant={viewMode === "orbit" ? "default" : "ghost"} onClick={() => setViewMode("orbit")}><RotateCcw className="size-4" /> Orbit View</Button>
          <Button size="sm" variant={viewMode === "pov" ? "default" : "ghost"} onClick={() => setViewMode("pov")}><Eye className="size-4" /> POV View</Button>
        </div>
      </div>
    </header>
  );
}

function MobileCameraStrip() {
  const cameras = useCameraStore((state) => state.cameras);
  const selectedCameraId = useCameraStore((state) => state.selectedCameraId);
  const selectCamera = useCameraStore((state) => state.selectCamera);

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border bg-card/85 px-3 py-2 backdrop-blur xl:hidden">
      {cameras.map((camera) => (
        <Button
          key={camera.id}
          size="sm"
          variant={camera.id === selectedCameraId ? "default" : "outline"}
          className="shrink-0 px-3 font-mono text-xs font-bold"
          onClick={() => selectCamera(camera.id)}
        >
          {camera.id.replace("CAM-", "C")}
        </Button>
      ))}
    </div>
  );
}

function Minimap() {
  const cameras = useCameraStore((state) => state.cameras);
  const selectedId = useCameraStore((state) => state.selectedCameraId);
  const selectCamera = useCameraStore((state) => state.selectCamera);
  // Pixels per foot in the minimap
  const scale = 2.1;
  const cx = 160;
  const cy = 86;
  const bw = siteConfig.building.dimensions.width_ft * scale;
  const bd = siteConfig.building.dimensions.depth_ft * scale;
  return (
    <div className="absolute bottom-4 left-4 z-10 hidden rounded-xl border border-border bg-card/90 p-3 shadow-[var(--shadow-panel)] backdrop-blur md:block">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><span>Minimap (ft)</span><span>Front / N</span></div>
      <svg width="320" height="172" viewBox="0 0 320 172" className="overflow-visible">
        <rect x={cx - bw / 2} y={cy - bd / 2} width={bw} height={bd} rx="3" className="fill-secondary stroke-border" strokeWidth="2" />
        <line x1="20" x2="300" y1={cy + bd / 2 + 20} y2={cy + bd / 2 + 20} className="stroke-muted-foreground" strokeDasharray="4 4" />
        {cameras.map((camera) => {
          const x = cx + camera.position[0] * scale;
          const y = cy + camera.position[2] * scale;
          const yaw = ((camera.rotation.yaw - 90) * Math.PI) / 180;
          const len = camera.frustum_max_distance_ft * scale;
          const half = (camera.fov_horizontal * Math.PI) / 360;
          const p1 = `${x + Math.cos(yaw - half) * len},${y + Math.sin(yaw - half) * len}`;
          const p2 = `${x + Math.cos(yaw + half) * len},${y + Math.sin(yaw + half) * len}`;
          return (
            <g key={camera.id} onClick={() => selectCamera(camera.id)} className="cursor-pointer">
              <polygon points={`${x},${y} ${p1} ${p2}`} className={camera.id === selectedId ? "fill-primary/25 stroke-primary" : "fill-accent/15 stroke-accent-foreground/50"} strokeWidth="1" />
              <circle cx={x} cy={y} r={camera.id === selectedId ? 5 : 4} className="fill-primary stroke-background" strokeWidth="2" />
              <text x={x + 7} y={y - 5} className="fill-foreground text-[10px] font-bold">{camera.id.replace("CAM-", "C")}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function SimulatorApp() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <LeftSidebar />
      <section className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />
        <MobileCameraStrip />
        <div className="relative min-h-0 flex-1">
          <SecurityScene />
          <Minimap />
        </div>
      </section>
      <RightSidebar />
    </main>
  );
}
