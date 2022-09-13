import { Role } from "schema-dts";

export declare type IdReference = {
  /** IRI identifying the canonical address of this object. */
  "@id": string;
};

export declare type SchemaValue<T, TProperty extends string> =
  | T
  | Role<T, TProperty>
  | readonly (T | Role<T, TProperty>)[];

export declare type WithContext<T> = T & {
  "@context": "https://schema.org";
};
