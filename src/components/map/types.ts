export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price?: number;
  priceLabel?: string;
  priceUnit?: string;
  area?: string;
  city?: string;
  coverUrl?: string | null;
  href?: string;
  popupHtml?: string;
};
