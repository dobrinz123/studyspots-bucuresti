import { Icon, TypeIcon } from "./icons";
import { criteria, formatDistance, overallScore, placeTypes, type Place } from "./placeMeta";

type Props = {
  place: Place;
  distanceKm?: number;
  isNearest: boolean;
  onClose: () => void;
};

// Cardul cu detaliile locului selectat si media pe fiecare criteriu.
export default function PlaceDetails({ place, distanceKm, isNearest, onClose }: Props) {
  const type = placeTypes[place.type];
  const score = overallScore(place);

  return (
    <article className="details" style={{ "--type-color": type.color } as React.CSSProperties}>
      <header className="details-header">
        <span className="details-icon">
          <TypeIcon type={place.type} size={22} />
        </span>
        <div className="details-heading">
          <span className="details-type">{type.label}</span>
          <h2>{place.name}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Închide">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="details-body">
        <ul className="details-facts">
          {place.address && (
            <li>
              <Icon name="pin" size={16} /> {place.address}
            </li>
          )}
          {place.openingHours && (
            <li>
              <Icon name="clock" size={16} /> {place.openingHours}
            </li>
          )}
          {distanceKm !== undefined && (
            <li>
              <Icon name="locate" size={16} /> la {formatDistance(distanceKm)} de tine
              {isNearest && <span className="tag">Cel mai aproape</span>}
            </li>
          )}
        </ul>
        {place.description && <p className="details-description">{place.description}</p>}

        <section className="details-ratings">
          <div className="overall">
            {score !== null ? (
              <>
                <span className="overall-score">{score.toFixed(1)}</span>
                <span>
                  <Stars value={score} />
                  <span className="muted">
                    {place.reviewCount} {place.reviewCount === 1 ? "recenzie" : "recenzii"}
                  </span>
                </span>
              </>
            ) : (
              <span className="muted">Nicio recenzie încă. Fii primul care evaluează locul!</span>
            )}
          </div>

          {score !== null &&
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
            })}
        </section>
      </div>
    </article>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} din 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="star-slot">
          <Icon name="star" size={16} className="star-empty" />
          <span className="star-fill" style={{ width: `${Math.max(0, Math.min(1, value - i + 1)) * 100}%` }}>
            <Icon name="star" size={16} className="star" />
          </span>
        </span>
      ))}
    </span>
  );
}
