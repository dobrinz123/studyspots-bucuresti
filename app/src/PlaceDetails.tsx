import type { Place } from "./MapView";
import { criteria, placeTypes } from "./placeMeta";

type Props = {
  place: Place;
  distanceKm?: number | null;
  onClose: () => void;
};

// Panoul cu detaliile locului selectat si media pe fiecare criteriu.
export default function PlaceDetails({ place, distanceKm, onClose }: Props) {
  const type = placeTypes[place.type];
  const hasReviews = place.reviewCount > 0;

  return (
    <div className="panel details">
      <button className="close" onClick={onClose} aria-label="Închide">
        ×
      </button>
      <div className="details-type" style={{ color: type.color }}>
        {type.label}
      </div>
      <h3>{place.name}</h3>
      <div className="muted">{place.address}</div>
      {distanceKm != null && <div className="muted">la {formatDistance(distanceKm)} de tine</div>}
      {place.openingHours && <div className="details-row">🕒 {place.openingHours}</div>}
      {place.description && <p className="details-row">{place.description}</p>}

      <h4>
        Evaluări {hasReviews && <span className="muted">({place.reviewCount} {place.reviewCount === 1 ? "recenzie" : "recenzii"})</span>}
      </h4>
      {hasReviews ? (
        criteria.map((c) => {
          const value = place.avgRatings[c.key];
          return (
            <div key={c.key} className="rating-row" title={c.hint}>
              <span className="rating-label">{c.label}</span>
              <span className="rating-bar">
                <span style={{ width: `${(value / 5) * 100}%` }} />
              </span>
              <span className="rating-value">{value.toFixed(1)}</span>
            </div>
          );
        })
      ) : (
        <div className="muted">Nicio recenzie încă.</div>
      )}
    </div>
  );
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
