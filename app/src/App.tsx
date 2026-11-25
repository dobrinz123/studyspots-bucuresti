import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import MapView from "./MapView";

export default function App() {
  const places = useQuery(api.places.list) ?? [];
  return (
    <div style={{ height: "100vh" }}>
      <MapView places={places} />
    </div>
  );
}
