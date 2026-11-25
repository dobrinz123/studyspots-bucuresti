import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import Point from "@arcgis/core/geometry/Point";
import * as geodeticDistanceOperator from "@arcgis/core/geometry/operators/geodeticDistanceOperator";
import { api } from "../convex/_generated/api";
import MapView, { type MapFocus } from "./MapView";
import AuthPanel from "./AuthPanel";
import Legend from "./Legend";
import PlaceDetails from "./PlaceDetails";
import Sidebar, { type LocateState } from "./Sidebar";
import { Icon } from "./icons";
import { noFilters, overallScore, type Filters, type LatLng, type Place } from "./placeMeta";
import "./app.css";

export default function App() {
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locate, setLocate] = useState<LocateState>({ status: "idle" });
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [distanceReady, setDistanceReady] = useState(geodeticDistanceOperator.isLoaded());

  const allPlaces = useQuery(api.places.list);
  const filtered = useQuery(api.places.filter, toFilterArgs(filters));

  // cat timp se incarca rezultatul nou, raman pe harta locurile de dinainte (fara "clipire")
  const [places, setPlaces] = useState<Place[]>([]);
  if (filtered !== undefined && filtered !== places) setPlaces(filtered);

  // operatorul ArcGIS de distanta geodezica se incarca o singura data
  useEffect(() => {
    if (!distanceReady) void geodeticDistanceOperator.load().then(() => setDistanceReady(true));
  }, [distanceReady]);

  // distanta (km) de la pozitia mea la fiecare loc care trece de filtre
  const distances = useMemo(() => {
    if (!userLocation || !distanceReady) return null;
    const me = new Point({ longitude: userLocation.lng, latitude: userLocation.lat });
    return new Map(
      places.map((p) => [
        p._id as string,
        geodeticDistanceOperator.execute(me, new Point({ longitude: p.lng, latitude: p.lat }), { unit: "kilometers" }),
      ]),
    );
  }, [places, userLocation, distanceReady]);

  // lista: dupa distanta daca stiu unde esti, altfel dupa rating
  const sorted = useMemo(() => {
    const list = [...places];
    if (distances) return list.sort((a, b) => distances.get(a._id)! - distances.get(b._id)!);
    return list.sort((a, b) => (overallScore(b) ?? -1) - (overallScore(a) ?? -1) || a.name.localeCompare(b.name));
  }, [places, distances]);

  const nearestId = distances && sorted.length > 0 ? sorted[0]._id : null;
  const selected = allPlaces?.find((p) => p._id === selectedId) ?? null;

  // din lista: centrez si apropii harta; de pe harta: doar centrez, ca locul sa nu ramana sub card
  function selectPlace(place: Place, fromMap = false) {
    setSelectedId(place._id);
    setFocus(nextFocus([place], fromMap));
  }

  function selectFromMap(id: string | null) {
    const place = sorted.find((p) => p._id === id);
    if (place) selectPlace(place, true);
    else setSelectedId(null);
  }

  function setMyLocation(location: LatLng, source: "gps" | "map") {
    setUserLocation(location);
    setLocate({ status: "located", source });
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setLocate({ status: "error", message: "Browserul nu poate afla locația. Alege un punct pe hartă." });
      return;
    }
    setLocate({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, "gps"),
      (err) =>
        setLocate({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Nu ai permis accesul la locație. Poți alege un punct pe hartă."
              : "Nu am putut afla locația. Poți alege un punct pe hartă.",
        }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clearLocation() {
    setUserLocation(null);
    setLocate({ status: "idle" });
  }

  // cand aflu o pozitie noua, o incadrez pe harta impreuna cu cel mai apropiat loc
  const nearest = sorted.find((p) => p._id === nearestId);
  const [framedFor, setFramedFor] = useState<LatLng | null>(null);
  if (userLocation && distances && framedFor !== userLocation) {
    setFramedFor(userLocation);
    setFocus(nextFocus(nearest ? [userLocation, nearest] : [userLocation]));
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-logo">
            <Icon name="pin" size={20} />
          </span>
          <span className="brand-text">
            <span className="brand-name">StudySpot</span>
            <span className="brand-city">București</span>
          </span>
        </a>
        <AuthPanel />
      </header>

      <main className="layout">
        <Sidebar
          filters={filters}
          onFiltersChange={setFilters}
          places={sorted}
          total={allPlaces?.length ?? 0}
          distances={distances}
          nearestId={nearestId}
          selectedId={selectedId}
          onSelectPlace={selectPlace}
          locate={locate}
          onLocate={locateMe}
          onPickOnMap={() => setLocate({ status: "picking" })}
          onClearLocation={clearLocation}
        />

        <div className="map-area">
          <MapView
            places={sorted}
            selectedId={selectedId}
            nearestId={nearestId}
            userLocation={userLocation}
            pickMode={locate.status === "picking"}
            focus={focus}
            detailsOpen={selected !== null}
            onSelect={selectFromMap}
            onPick={(location) => setMyLocation(location, "map")}
          />
          {locate.status === "picking" && <div className="map-banner">Dă click pe hartă acolo unde ești</div>}
          <Legend />
          {selected && (
            <PlaceDetails
              place={selected}
              distanceKm={distances?.get(selected._id)}
              isNearest={selected._id === nearestId}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// o cerere noua de mutare a hartii; key-ul diferit face ca MapView sa reactioneze chiar si la aceleasi puncte
function nextFocus(points: LatLng[], keepZoom = false) {
  return (previous: MapFocus | null): MapFocus => ({ key: (previous?.key ?? 0) + 1, points, keepZoom });
}

// trimit la server doar ce e setat: tipul (daca nu e "Toate") si criteriile cu minim > 0
function toFilterArgs(filters: Filters) {
  const minRatings = Object.fromEntries(Object.entries(filters.minRatings).filter(([, v]) => v > 0));
  return {
    ...(filters.type !== "all" ? { type: filters.type } : {}),
    ...(Object.keys(minRatings).length > 0 ? { minRatings } : {}),
  };
}
