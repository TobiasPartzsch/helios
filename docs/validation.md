## Validation Matrix

### Coordinate invariants
- horizontal transform returns finite values
- zenith case behaves correctly
- angle wrapping is normalized

### Reference cases
- Sun: UTC X, expected RA/Dec, tolerance T
- Moon: UTC Y, expected RA/Dec, tolerance T
- Jupiter: UTC Z, expected RA/Dec, tolerance T

### Regression cases
- known zenith singularity input
- known high-speed sim-time drift case
- known lunar-track closure case