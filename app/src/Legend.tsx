import { placeTypeKeys, placeTypes } from "./placeMeta";

// Legenda simbolurilor de pe harta (colt stanga-jos).
export default function Legend() {
  return (
    <div className="panel legend">
      {placeTypeKeys.map((type) => (
        <div key={type} className="legend-row">
          <span className={`legend-symbol legend-${placeTypes[type].marker}`} style={{ background: placeTypes[type].color }} />
          {placeTypes[type].label}
        </div>
      ))}
    </div>
  );
}
