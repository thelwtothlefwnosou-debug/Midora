export type AddressSuggestion = {
  placeId: string;
  primary: string;
  secondary: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string | null;
  streetNumber: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
};
