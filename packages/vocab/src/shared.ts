import { CID } from "multiformats/cid";

export type Date = string;
export type DID = string;
export type AccountID = string;

// See https://schema.org/GeoCoordinates
export interface GeoCoordinates {
  // The latitude of a location
  latitude: number;

  // The longitude of a location
  longitude: number;
}

// See https://schema.org/GeoCircle
export interface GeoCircle {
  // Indicates the approximate radius of a GeoCircle in meters
  geoRadius: number;

  // Indicates the GeoCoordinates at the centre of a GeoShape, e.g. GeoCircle
  geoMidpoint: GeoCoordinates;
}

// See https://schema.org/QuantitativeValue
export interface QuantitativeValue {
  maxValue?: number;
  minValue?: number;
  unitCode?: string;
  unitText?: string;
  value?: number;
}

export type EncodingImage = "Gif" | "Jpeg" | "Png" | "Svg";

export interface ImageObject {
  name?: String;
  content: CID;
  contentSize?: number;
  encodingFormat: EncodingImage;
}
