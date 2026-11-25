import { Icon, TypeIcon } from "./icons";
import {
  criteria,
  formatDistance,
  noFilters,
  overallScore,
  placeTypeKeys,
  placeTypes,
  type Filters,
  type Place,
} from "./placeMeta";

export type LocateState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "picking" }
  | { status: "located"; source: "gps" | "map" }
  | { status: "error"; message: string };

type Props = {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  places: Place[]; // deja filtrate si sortate
  total: number;
  distances: Map<string, number> | null;
  nearestId: string | null;
  selectedId: string | null;
  onSelectPlace: (place: Place) => void;
  locate: LocateState;
  onLocate: () => void;
  onPickOnMap: () => void;
  onClearLocation: () => void;
};

export default function Sidebar(props: Props) {
  const { filters, onFiltersChange, places, total, distances, nearestId, selectedId, onSelectPlace } = props;
  const nearest = places.find((p) => p._id === nearestId);
  const ratingFilterOn = Object.values(filters.minRatings).some((v) => v > 0);
  const filtersOn = filters.type !== "all" || ratingFilterOn;

  return (
    <aside className="sidebar">
      {/* Locatia mea + cel mai apropiat loc */}
      <section className="card locate-card">
        <h2 className="card-title">Unde înveți azi?</h2>
        <LocateBox {...props} />
        {nearest && distances && (
          <button className="nearest" onClick={() => onSelectPlace(nearest)}>
            <span className="nearest-label">Cel mai apropiat loc potrivit</span>
            <span className="nearest-name">{nearest.name}</span>
            <span className="nearest-meta">
              {placeTypes[nearest.type].label} · {formatDistance(distances.get(nearest._id) ?? 0)}
            </span>
          </button>
        )}
      </section>

      {/* Filtre */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">
            <Icon name="filter" size={16} /> Filtre
          </h2>
          {filtersOn && (
            <button className="link-button" onClick={() => onFiltersChange(noFilters)}>
              <Icon name="reset" size={14} /> Resetează
            </button>
          )}
        </div>

        <div className="chips" role="radiogroup" aria-label="Tipul locului">
          <button
            className={`chip ${filters.type === "all" ? "chip-active" : ""}`}
            onClick={() => onFiltersChange({ ...filters, type: "all" })}
            role="radio"
            aria-checked={filters.type === "all"}
          >
            Toate
          </button>
          {placeTypeKeys.map((t) => (
            <button
              key={t}
              className={`chip ${filters.type === t ? "chip-active" : ""}`}
              style={{ "--chip-color": placeTypes[t].color } as React.CSSProperties}
              onClick={() => onFiltersChange({ ...filters, type: t })}
              role="radio"
              aria-checked={filters.type === t}
            >
              <TypeIcon type={t} size={15} /> {placeTypes[t].plural}
            </button>
          ))}
        </div>

        <div className="sliders">
          {criteria.map((c) => {
            const value = filters.minRatings[c.key];
            return (
              <label key={c.key} className="slider-row" title={c.hint}>
                <span className="slider-label">{c.label}</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={value}
                  style={{ "--fill": `${(value / 5) * 100}%` } as React.CSSProperties}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, minRatings: { ...filters.minRatings, [c.key]: Number(e.target.value) } })
                  }
                />
                <span className={`slider-value ${value > 0 ? "on" : ""}`}>{value === 0 ? "oricât" : `≥ ${value}`}</span>
              </label>
            );
          })}
        </div>
        {ratingFilterOn && <p className="hint">Locurile fără recenzii sunt ascunse când filtrezi după rating.</p>}
      </section>

      {/* Lista de locuri */}
      <section className="results">
        <div className="results-head">
          <h2>{places.length === total ? `${total} locuri` : `${places.length} din ${total} locuri`}</h2>
          <span className="muted">{distances ? "după distanță" : "după rating"}</span>
        </div>
        {places.length === 0 ? (
          <div className="empty">
            Niciun loc nu se potrivește filtrelor.
            {filtersOn && (
              <button className="link-button" onClick={() => onFiltersChange(noFilters)}>
                Resetează filtrele
              </button>
            )}
          </div>
        ) : (
          <ul className="place-list">
            {places.map((p) => {
              const score = overallScore(p);
              const km = distances?.get(p._id);
              return (
                <li key={p._id}>
                  <button
                    className={`place-item ${p._id === selectedId ? "selected" : ""}`}
                    onClick={() => onSelectPlace(p)}
                  >
                    <span className="type-dot" style={{ background: placeTypes[p.type].color }}>
                      <TypeIcon type={p.type} size={16} />
                    </span>
                    <span className="place-main">
                      <span className="place-name">{p.name}</span>
                      <span className="place-sub">
                        {placeTypes[p.type].label}
                        {p.address && ` · ${p.address}`}
                      </span>
                      {p._id === nearestId && <span className="tag">Cel mai aproape</span>}
                    </span>
                    <span className="place-side">
                      {score !== null ? (
                        <span className="score">
                          <Icon name="star" size={13} className="star" /> {score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="score score-new">nou</span>
                      )}
                      {km !== undefined && <span className="distance">{formatDistance(km)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}

function LocateBox({ locate, onLocate, onPickOnMap, onClearLocation }: Props) {
  switch (locate.status) {
    case "locating":
      return <p className="locate-status"><span className="spinner" /> Caut locația ta...</p>;
    case "picking":
      return (
        <div className="locate-status">
          <p>Dă click pe hartă acolo unde ești.</p>
          <button className="link-button" onClick={onClearLocation}>Anulează</button>
        </div>
      );
    case "located":
      return (
        <div className="locate-status">
          <p>
            <Icon name="locate" size={16} /> {locate.source === "gps" ? "Locația ta e pe hartă." : "Ai ales poziția pe hartă."}
          </p>
          <div className="locate-actions">
            <button className="link-button" onClick={onPickOnMap}>Mută pe hartă</button>
            <button className="link-button" onClick={onClearLocation}>Șterge</button>
          </div>
        </div>
      );
    default:
      return (
        <>
          <p className="card-text">Găsește cel mai apropiat loc care respectă filtrele tale.</p>
          <button className="btn btn-primary btn-block" onClick={onLocate}>
            <Icon name="locate" size={18} /> Folosește locația mea
          </button>
          <button className="link-button center" onClick={onPickOnMap}>
            sau alege un punct pe hartă
          </button>
          {locate.status === "error" && <p className="error">{locate.message}</p>}
        </>
      );
  }
}
