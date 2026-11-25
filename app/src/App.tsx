import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import MapView from "./MapView";
import AuthPanel from "./AuthPanel";
import Legend from "./Legend";
import PlaceDetails from "./PlaceDetails";
import "./app.css";

export default function App() {
  const places = useQuery(api.places.list) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = places.find((p) => p._id === selectedId) ?? null;

  return (
    <div className="map-area" style={{ height: "100vh" }}>
      <AuthPanel />
      <MapView places={places} selectedId={selectedId} onSelect={setSelectedId} />
      <Legend />
      {selected && <PlaceDetails place={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
