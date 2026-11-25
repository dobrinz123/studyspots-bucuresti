import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import MapView from "./MapView";
import AuthPanel from "./AuthPanel";

export default function App() {
  const places = useQuery(api.places.list) ?? [];
  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <AuthPanel />
      <MapView places={places} />
    </div>
  );
}
