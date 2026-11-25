import { useEffect, useRef } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import ArcView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

export type Place = { _id: string; name: string; type: string; address: string; lat: number; lng: number };

const colors: Record<string, string> = { library: "#2563eb", cafe: "#b45309", coworking: "#059669" };

export default function MapView({ places }: { places: Place[] }) {
  const div = useRef<HTMLDivElement>(null);
  const layer = useRef(new GraphicsLayer());

  useEffect(() => {
    const view = new ArcView({
      container: div.current!,
      map: new Map({ basemap: "osm", layers: [layer.current] }),
      center: [26.1025, 44.4268], // Bucuresti
      zoom: 12,
    });
    return () => view.destroy();
  }, []);

  useEffect(() => {
    layer.current.removeAll();
    layer.current.addMany(
      places.map(
        (p) =>
          new Graphic({
            geometry: { type: "point", longitude: p.lng, latitude: p.lat },
            symbol: { type: "simple-marker", color: colors[p.type] ?? "#555", size: 12 },
            attributes: p,
            popupTemplate: { title: "{name}", content: "{address}" },
          }),
      ),
    );
  }, [places]);

  return <div ref={div} style={{ width: "100%", height: "100%" }} />;
}
