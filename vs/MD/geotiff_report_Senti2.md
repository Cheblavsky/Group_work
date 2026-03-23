# GeoTIFF Inspection Report

## File info
- File: C:\EGYETEM\Prog4Geo\Beadandihh\Sentinel2_Sep2024_Group.tif
- Driver: GTiff
- File size (bytes): 91729724

## What it appears to be
- This appears to be a multispectral Sentinel-2 image rather than a land-cover raster. The filename includes 'Sentinel2', the raster has 4 bands labeled B4, B3, B2, B8, and the first band's value range (0 to 14368) looks like scaled reflectance or radiometric image data instead of categorical class codes.

## Raster size & bands
- Width x Height: 4667 x 2141
- Band count: 4
- Data type: Float64

## Coordinate system
- CRS: GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AXIS["Latitude",NORTH],AXIS["Longitude",EAST],AUTHORITY["EPSG","4326"]]

## Spatial extent
- Bounds: left=19.929125, bottom=46.189216, right=20.348368, top=46.381545
- Pixel size: (0.000089832, -0.000089832)
- Area covered / likely location: Likely southeastern Hungary, centered near approximately 20.1387E, 46.2854N (around the Szeged / Hodmezovasarhely area).

## Missing data
- Nodata value: None
- Missing pixel count: 14958
- Missing pixel percentage: 0.1497%

## Simple statistics
- Minimum: 0.000000
- Maximum: 14368.000000
- Mean: 1195.533772

## Warnings / notes
- No explicit nodata value is defined, but NaN values are present and were treated as missing.
- Band values look like scaled reflectance or digital numbers rather than display-ready 0-1 imagery.
