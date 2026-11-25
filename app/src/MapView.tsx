import { useEffect, useRef, useState } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import esriConfig from "@arcgis/core/config";
import ArcView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Multipoint from "@arcgis/core/geometry/Multipoint";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import { iconPaths } from "./iconPaths";
import { placeTypes, type LatLng, type Place, type PlaceType } from "./placeMeta";

// keepZoom: doar centrez harta (click pe un pin), fara sa schimb zoom-ul
export type MapFocus = { key: number; points: LatLng[]; keepZoom?: boolean };

type Props = {
  places: Place[];
  selectedId: string | null;
  nearestId: string | null;
  userLocation: LatLng | null;
  pickMode: boolean;
  focus: MapFocus | null;
  detailsOpen: boolean;
  onSelect: (id: string | null) => void;
  onPick: (location: LatLng) => void;
};

// Cheia ArcGIS vine din app/.env.local (VITE_ARCGIS_API_KEY), care nu se pune in git.
// Cu cheie: harta Esri gri-deschis, pe care pin-urile ies in evidenta. Fara cheie: OpenStreetMap.
const apiKey = import.meta.env.VITE_ARCGIS_API_KEY as string | undefined;
if (apiKey) esriConfig.apiKey = apiKey;
const BASEMAP = apiKey ? "arcgis/light-gray" : "osm";

// Pin in forma de picatura, cu iconita tipului de loc in cerc alb
function pinSymbol(type: PlaceType, selected: boolean) {
  const color = placeTypes[type].color;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">` +
    `<path d="M20 50C18 47 3 32 3 20a17 17 0 0 1 34 0c0 12-15 27-17 30z" fill="${selected ? "#111827" : color}" stroke="white" stroke-width="2.5"/>` +
    `<circle cx="20" cy="20" r="11.5" fill="white"/>` +
    `<g transform="translate(12 12) scale(0.6667)" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${iconPaths[type]}</g>` +
    `</svg>`;
  const width = selected ? 38 : 28;
  const height = (width * 52) / 40;
  return new PictureMarkerSymbol({
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    width,
    height,
    yoffset: height / 2, // varful pin-ului cade exact pe coordonata locului
  });
}

const toPoint = (p: LatLng) => new Point({ longitude: p.lng, latitude: p.lat });

export default function MapView(props: Props) {
  const { places, selectedId, nearestId, userLocation, pickMode, focus, detailsOpen } = props;
  const div = useRef<HTMLDivElement>(null);
  // obiectele ArcGIS sunt mutabile, deci stau intr-un ref; `ready` spune efectelor ca harta exista
  const mapRef = useRef<{ view: ArcView; places: GraphicsLayer; overlay: GraphicsLayer } | null>(null);
  const [ready, setReady] = useState(false);

  // handler-ele de pe harta se creeaza o singura data; citesc mereu ultimele props prin ref
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    // layer-ele se creeaza o data cu view-ul: view.destroy() distruge si layer-ele hartii
    const placesLayer = new GraphicsLayer({ title: "Locuri" });
    const overlayLayer = new GraphicsLayer({ title: "Pozitia mea" });
    const view = new ArcView({
      container: div.current!,
      map: new Map({ basemap: BASEMAP, layers: [overlayLayer, placesLayer] }),
      center: [26.1025, 44.4368], // Bucuresti
      zoom: 13,
      popupEnabled: false, // detaliile apar in cardul de detalii
      constraints: { minZoom: 10, snapToZoom: false },
    });
    view.ui.move("zoom", "bottom-right");

    // click pe un loc -> il selectez; in modul "aleg pe harta" -> pozitia mea
    const click = view.on("click", async (event) => {
      if (latest.current.pickMode) {
        const { latitude, longitude } = event.mapPoint;
        if (latitude != null && longitude != null) latest.current.onPick({ lat: latitude, lng: longitude });
        return;
      }
      const hit = await view.hitTest(event, { include: [placesLayer] });
      const result = hit.results.find((r) => r.type === "graphic");
      latest.current.onSelect(result?.type === "graphic" ? (result.graphic.attributes._id as string) : null);
    });

    // cursor de "mana" cand mouse-ul e deasupra unui loc
    let pending = false;
    const move = view.on("pointer-move", async (event) => {
      if (pending || latest.current.pickMode) return;
      pending = true;
      const hit = await view.hitTest(event, { include: [placesLayer] });
      pending = false;
      if (!latest.current.pickMode && div.current) div.current.style.cursor = hit.results.length > 0 ? "pointer" : "";
    });

    mapRef.current = { view, places: placesLayer, overlay: overlayLayer };
    view.when(() => setReady(true)).catch(() => {
      // view-ul a fost distrus inainte sa fie gata (React il monteaza de doua ori in modul de dezvoltare)
    });
    return () => {
      click.remove();
      move.remove();
      mapRef.current = null;
      view.destroy();
    };
  }, []);

  // pin-urile locurilor
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.places.removeAll();
    // locul selectat se deseneaza ultimul, ca sa fie deasupra celorlalte
    const sorted = [...places].sort((a, b) => Number(a._id === selectedId) - Number(b._id === selectedId));
    map.places.addMany(
      sorted.map(
        (p) =>
          new Graphic({
            geometry: toPoint(p),
            symbol: pinSymbol(p.type, p._id === selectedId),
            attributes: { _id: p._id, name: p.name },
          }),
      ),
    );
  }, [ready, places, selectedId]);

  // pozitia mea, cercul in jurul celui mai apropiat loc si linia pana la el
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.overlay.removeAll();
    const nearest = places.find((p) => p._id === nearestId);
    if (nearest) {
      map.overlay.add(
        new Graphic({
          geometry: toPoint(nearest),
          symbol: { type: "simple-marker", size: 46, color: [79, 70, 229, 0.16], outline: { color: [79, 70, 229, 0.9], width: 2 } },
        }),
      );
    }
    if (!userLocation) return;
    if (nearest) {
      map.overlay.add(
        new Graphic({
          geometry: { type: "polyline", paths: [[[userLocation.lng, userLocation.lat], [nearest.lng, nearest.lat]]] },
          symbol: { type: "simple-line", color: [79, 70, 229, 0.85], width: 2.5, style: "dash" },
        }),
      );
    }
    map.overlay.addMany([
      new Graphic({ geometry: toPoint(userLocation), symbol: { type: "simple-marker", size: 34, color: [37, 99, 235, 0.18], outline: { width: 0 } } }),
      new Graphic({ geometry: toPoint(userLocation), symbol: { type: "simple-marker", size: 15, color: "#2563eb", outline: { color: "white", width: 3 } } }),
    ]);
  }, [ready, places, nearestId, userLocation]);

  // cursor de tip "tinta" cand alegi pozitia pe harta
  useEffect(() => {
    if (div.current) div.current.style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode]);

  // cand cardul de detalii e deschis, harta isi muta "centrul" in partea ramasa libera,
  // ca locul selectat sa nu ajunga sub card (pe telefon cardul e jos, pe calculator in dreapta)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const mobile = window.matchMedia("(max-width: 860px)").matches;
    const none = { top: 0, right: 0, bottom: 0, left: 0 };
    map.view.padding = detailsOpen ? (mobile ? { ...none, bottom: map.view.height * 0.6 } : { ...none, right: 390 }) : none;
  }, [ready, detailsOpen]);

  // mut harta cand App cere asta (click pe un loc, locatia mea)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus || focus.points.length === 0) return;
    // un punct -> centrez pe el; mai multe -> le incadrez pe toate, cu putin spatiu in jur
    const target =
      focus.points.length === 1
        ? { center: toPoint(focus.points[0]), zoom: focus.keepZoom ? map.view.zoom : Math.max(map.view.zoom, 15) }
        : { target: new Multipoint({ points: focus.points.map((p) => [p.lng, p.lat]) }).extent!.clone().expand(1.8) };
    map.view.goTo(target, { duration: 700 }).catch(() => {
      // animatia poate fi intrerupta de o alta mutare a hartii
    });
  }, [ready, focus]);

  return <div ref={div} className="map" />;
}
