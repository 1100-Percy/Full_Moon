import cloudLeft from '../assets/cloud-left.png';
import cloudRight from '../assets/cloud-right.png';

export function CloudCutouts() {
  return (
    <div className="cloud-cutouts" aria-hidden="true">
      <img className="cloud-cutout cloud-cutout-left" src={cloudLeft} alt="" />
      <img className="cloud-cutout cloud-cutout-right" src={cloudRight} alt="" />
    </div>
  );
}
