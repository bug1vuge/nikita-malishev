import { marquee } from '../content';
import { SparkIcon } from './Icons';
import './Marquee.css';

export function Marquee() {
  const row = (key: string) => (
    <span className="marquee__row" key={key}>
      {marquee.map((m) => (
        <span className="marquee__item" key={m}>
          {m}
          <SparkIcon />
        </span>
      ))}
    </span>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__band">
        <div className="marquee__track">{[row('a'), row('b')]}</div>
      </div>
    </div>
  );
}
