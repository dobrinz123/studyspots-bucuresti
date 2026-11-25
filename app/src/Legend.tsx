import { TypeIcon } from "./icons";
import { placeTypeKeys, placeTypes } from "./placeMeta";

// Legenda simbolurilor de pe harta (colt stanga-jos).
export default function Legend() {
  return (
    <div className="legend">
      {placeTypeKeys.map((type) => (
        <span key={type} className="legend-item">
          <span className="legend-pin" style={{ background: placeTypes[type].color }}>
            <TypeIcon type={type} size={12} />
          </span>
          {placeTypes[type].label}
        </span>
      ))}
    </div>
  );
}
