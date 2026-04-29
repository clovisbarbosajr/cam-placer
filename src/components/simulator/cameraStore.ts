import { create } from "zustand";
import { siteConfig, type CameraConfig } from "@/config";

type ViewMode = "orbit" | "pov";

type CameraStore = {
  cameras: CameraConfig[];
  selectedCameraId: string;
  viewMode: ViewMode;
  showAllFrustums: boolean;
  selectCamera: (id: string, mode?: ViewMode) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleShowAllFrustums: () => void;
  updateCamera: (id: string, patch: Partial<CameraConfig>) => void;
  exportConfig: () => void;
};

const cloneCameras = (): CameraConfig[] =>
  siteConfig.cameras.map((camera) => ({
    ...camera,
    position: [...camera.position] as [number, number, number],
    rotation: { ...camera.rotation },
  }));

export const useCameraStore = create<CameraStore>((set, get) => ({
  cameras: cloneCameras(),
  selectedCameraId: siteConfig.cameras[0].id,
  viewMode: "orbit",
  showAllFrustums: false,
  selectCamera: (id, mode) => set({ selectedCameraId: id, viewMode: mode ?? get().viewMode }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleShowAllFrustums: () => set((state) => ({ showAllFrustums: !state.showAllFrustums })),
  updateCamera: (id, patch) =>
    set((state) => ({
      cameras: state.cameras.map((camera) => (camera.id === id ? { ...camera, ...patch } : camera)),
    })),
  exportConfig: () => {
    const payload = JSON.stringify({ ...siteConfig, cameras: get().cameras }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "230-dewey-camera-config.json";
    link.click();
    URL.revokeObjectURL(url);
  },
}));
