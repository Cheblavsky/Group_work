# GeoTIFF Inspection Report

## File info
- File: C:\EGYETEM\Prog4Geo\Beadandihh\JRC_GSW_Occurrence_Group.tif
- Driver: GTiff
- File size (bytes): 110277

## What it appears to be
- This appears to be a surface-water occurrence raster, likely related to the JRC Global Surface Water dataset. The filename includes 'JRC_GSW_Occurrence', the band is named 'occurrence', and the valid values run from 0 to 99, which is consistent with a percentage-style measure of how often water was observed at each pixel over time rather than a land-cover class map.

## Raster size & bands
- Width x Height: 1556 x 714
- Band count: 1
- Data type: Float32

## Coordinate system
- CRS: GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AXIS["Latitude",NORTH],AXIS["Longitude",EAST],AUTHORITY["EPSG","4326"]]

## Spatial extent
- Bounds: left=19.929125, bottom=46.189216, right=20.348458, top=46.381635
- Pixel size: (0.000269495, -0.000269495)
- Area covered / likely location: Likely southeastern Hungary, centered near approximately 20.1388E, 46.2854N (around the Szeged / Hodmezovasarhely area).

## Missing data
- Nodata value: None
- Missing pixel count: 1061691
- Missing pixel percentage: 95.5631%

## Simple statistics
- Minimum: 0.000000
- Maximum: 99.000000
- Mean: 55.696041

## Warnings / notes
- Very high missing-data share; most pixels are NaN or otherwise invalid.
- No explicit nodata value is defined, but NaN values are present and were treated as missing.
