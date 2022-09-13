import { Offer, WithContext } from "@ligo/ts-vocab";

const offer: WithContext<Offer> = {
  "@context": "https://schema.org",
  description: "This is a sample entry of JSON data for the schema",
  image: "https://image.com/img12.img",
  itemOffered: {
    "@type": "Vehicle",
    vehicleIdentificationNumber: "19749301501751",
    vehicleModelDate: "2017",
    model: "Tesla",
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

console.log(offer);
