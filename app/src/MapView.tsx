import { useEffect, useRef, useState } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import ArcView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import { placeTypes, type PlaceType } from "./placeMeta";

export type Place = { _id: string; name: string; type: PlaceType; address: string; lat: number; lng: number };

export default function MapView({ places }: { places: Place[] }) {
  const div = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState<GraphicsLayer | null>(null);

  useEffect(() => {
    // layer-ul se creeaza o data cu view-ul: view.destroy() distruge si layer-ele hartii
    const placesLayer = new GraphicsLayer();
    const view = new ArcView({
      container: div.current!,
      map: new Map({ basemap: "osm", layers: [placesLayer] }),
      center: [26.1025, 44.4268], // Bucuresti
      zoom: 12,
    });
    setLayer(placesLayer);
    return () => view.destroy();
  }, []);

  useEffect(() => {
    if (!layer) return;
    layer.removeAll();
    layer.addMany(
      places.map(
        (p) =>
          new Graphic({
            geometry: { type: "point", longitude: p.lng, latitude: p.lat },
            symbol: {
              type: "simple-marker",
              style: placeTypes[p.type].marker,
              color: placeTypes[p.type].color,
              size: 14,
              outline: { color: "white", width: 1.5 },
            },
            attributes: p,
            popupTemplate: { title: "{name}", content: "{address}" },
          }),
      ),
    );
  }, [layer, places]);

  return <div ref={div} style={{ width: "100%", height: "100%" }} />;
}
