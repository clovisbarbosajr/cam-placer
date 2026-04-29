import { createFileRoute } from "@tanstack/react-router";
import { SimulatorApp } from "@/components/simulator/SimulatorApp";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <SimulatorApp />;
}
