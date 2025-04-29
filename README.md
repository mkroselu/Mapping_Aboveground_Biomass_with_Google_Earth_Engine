# Remote Sensing Biomass Prediction Model using Random Forest (2020)

**Description**: This project automatically downloads LANDFIRE data in the United States. 

## LandTrendr 

1. Landsat Stacking (`lstack`):

- Loads Landsat data for a specific year and months, based on the input region of interest (`roi`).
- Selects specific bands (e.g., `B1_mean_post`, `B2_mean_post`, etc.).
- Reformats the band names to include the month they correspond to and stacks them into a single image.

2. Land Cover Change Mapping (`getchangemask`):

- Utilizes the LandTrendr module (imported at the beginning of the script) to detect land cover changes between a start and end year over a specified area of interest (`clipaoi`).
- It runs LandTrendr on the specified index (e.g., NBR) and parameters and returns a change mask showing year of disturbance (`yod`) and other changes based on the input parameters.

3. LANDFIRE Dataset Stacking (`lfstack`):

- Loads and stacks different LANDFIRE datasets, including vegetation height (EVH), fuel characteristics (CH, CBD, CBH, CC), over the specified area of interest (`clipaoi`).
- Combines these datasets into a single image and returns the stacked image with renamed bands.

## Code 

1. Imports shapefiles and a custom module.
2. Sets up LandTrendr parameters to monitor land cover changes.
3. Loops through shapefile features to process data for specific tiles.
4. Exports processed images (Landsat, LANDFIRE, disturbance data) to Google Drive.


