import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import MapView from "./MapView";
import AuthPanel from "./AuthPanel";
import Legend from "./Legend";
import "./app.css";

export default function App() {
  const places = useQuery(api.places.list) ?? [];
  return (
    <div className="map-area" style={{ height: "100vh" }}>
      <AuthPanel />
      <MapView places={places} />
      <Legend />
    </div>
  );
}
