# ts-ligo-vocab

This is the Typescript implementation of the [Ligo Vocabulary](https://github.com/Ligo-Protocol/ligo-vocab).

## Install

```bash
npm i @js-ligo/vocab
```

```bash
yarn add @js-ligo/vocab
```

## Usage

### Create an Offer

#### 1. Create an Offer object

```typescript
import { Offer, WithContext } from "@ligo/ts-vocab";

const offer: WithContext<Offer> = {
  "@context": "https://schema.org",
  description: "This is a sample entry of JSON data for the schema",
  image: "https://image.com/img12.img",
  itemOffered: {
    "@type": "Car",
    modelDate: "2019",
    vehicleIdentificationNumber: "5YJ3E1EA1KF064316",
    manufacturer: {
      "@type": "Organization",
      legalName: "Tesla, Inc.",
    },
    brand: {
      "@type": "Brand",
      name: "Tesla",
    },
    model: "Model 3",
    vehicleConfiguration: "Standard Range Plus",
  },
  seller: {
    "@type": "Person",
    givenName: "Thefirstname",
    familyName: "Thelastname",
    telephone: "109710937501",
  },
  areaServed: {
    "@type": "GeoShape",
    address: "California",
  },
  priceSpecification: {
    price: 1000,
    priceCurrency: "USD",
  },
  acceptedPaymentMethod: {
    "@type": "LigoSafeEscrow",
  },
  advanceBookingRequirement: {
    "@type": "QuantitativeValue",
    value: 5,
    unitCode: "HUR",
  },
};
```

#### 2. Create a Tile Doc

```typescript
const doc = await TileDocument.create(ceramic, offer, {
  schema: "k2t6wyfsu4pg1jk6ce2pktx68g9pdir43moy0xppwtk5dg577ke38zdu48iynt",
});
```
