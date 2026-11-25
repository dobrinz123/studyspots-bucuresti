import { useEffect, useRef, useState } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import ArcView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import type { Doc } from "../convex/_generated/dataModel";
import { placeTypes } from "./placeMeta";

export type Place = Doc<"places">;

type Props = {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function MapView({ places, selectedId, onSelect }: Props) {
  const div = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<{ view: ArcView; layer: GraphicsLayer } | null>(null);

  // pastrez ultima functie onSelect, ca handler-ul de click (creat o singura data) sa o foloseasca
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    // layer-ul se creeaza o data cu view-ul: view.destroy() distruge si layer-ele hartii
    const placesLayer = new GraphicsLayer();
    const view = new ArcView({
      container: div.current!,
      map: new Map({ basemap: "osm", layers: [placesLayer] }),
      center: [26.1025, 44.4268], // Bucuresti
      zoom: 12,
      popupEnabled: false, // detaliile apar in panoul din dreapta
    });

    // click pe un loc -> il selectez; click pe harta goala -> inchid panoul
    const click = view.on("click", async (event) => {
      const hit = await view.hitTest(event, { include: [placesLayer] });
      const result = hit.results.find((r) => r.type === "graphic");
      onSelectRef.current(result?.type === "graphic" ? (result.graphic.attributes._id as string) : null);
    });

    setMap({ view, layer: placesLayer });
    return () => {
      click.remove();
      view.destroy();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    map.layer.removeAll();
    map.layer.addMany(
      places.map((p) => {
        const selected = p._id === selectedId;
        return new Graphic({
          geometry: { type: "point", longitude: p.lng, latitude: p.lat },
          symbol: {
            type: "simple-marker",
            style: placeTypes[p.type].marker,
            color: placeTypes[p.type].color,
            size: selected ? 20 : 14,
            outline: { color: selected ? "#111827" : "white", width: selected ? 3 : 1.5 },
          },
          attributes: { _id: p._id, name: p.name },
        });
      }),
    );
  }, [map, places, selectedId]);

  return <div ref={div} style={{ width: "100%", height: "100%" }} />;
}
