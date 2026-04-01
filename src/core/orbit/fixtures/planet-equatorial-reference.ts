type PlanetReferenceCase = {
  bodyName: string;
  label: string;
  jd: number;
  expectedRaDeg: number;
  expectedDecDeg: number;
  toleranceDeg: number;
  source: string;
};

export const planetEquatorialReferenceCases: PlanetReferenceCase[] = [
  {
    "bodyName": "mercury",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 297.83499,
    "expectedDecDeg": -20.49407,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "mercury",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 272.08522,
    "expectedDecDeg": -24.42038,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "mercury",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 290.17608,
    "expectedDecDeg": -20.49177,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "venus",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 308.34515,
    "expectedDecDeg": -16.94516,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "venus",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 239.90118,
    "expectedDecDeg": -18.45185,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "venus",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 278.42319,
    "expectedDecDeg": -23.64939,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "mars",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 248.13263,
    "expectedDecDeg": -21.94682,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "mars",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 330.5246,
    "expectedDecDeg": -13.1805,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "mars",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 142.32706,
    "expectedDecDeg": 18.79903,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "jupiter",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 95.81931,
    "expectedDecDeg": 23.21442,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "jupiter",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 23.86983,
    "expectedDecDeg": 8.5959,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "jupiter",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 328.78547,
    "expectedDecDeg": -13.65642,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "saturn",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 287.04002,
    "expectedDecDeg": -22.22028,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "saturn",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 38.766,
    "expectedDecDeg": 12.61628,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "saturn",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 184.91079,
    "expectedDecDeg": 0.36698,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "uranus",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 276.43697,
    "expectedDecDeg": -23.5789,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "uranus",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 317.48381,
    "expectedDecDeg": -17.01884,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "uranus",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 353.81974,
    "expectedDecDeg": -3.48461,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "neptune",
    "label": "1990-01-01",
    "jd": 2447892.5,
    "expectedRaDeg": 283.13512,
    "expectedDecDeg": -22.04034,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "neptune",
    "label": "J2000.0",
    "jd": 2451545,
    "expectedRaDeg": 305.44265,
    "expectedDecDeg": -19.21243,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  },
  {
    "bodyName": "neptune",
    "label": "2010-01-01",
    "jd": 2455197.5,
    "expectedRaDeg": 326.88468,
    "expectedDecDeg": -13.76844,
    "toleranceDeg": 0.1,
    "source": "JPL Horizons geocentric ICRF"
  }
];