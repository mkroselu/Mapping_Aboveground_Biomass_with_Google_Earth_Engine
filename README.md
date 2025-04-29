# Large Scale Aboveground Biomass Prediction using Random Forest (2020)

**Description**: This repository contains a machine learning model built using **Google Earth Engine (GEE)** to predict aboveground biomass density in a selected region using remote sensing data from GEDI, Landsat 8, and other vegetation indices. The model uses a Random Forest algorithm to predict biomass based on several vegetation indices and canopy height.

## Overview 

The goal of this project is to create an accurate biomass density model using remote sensing data sources for a given area of interest (AOI). This model uses a combination of satellite data (GEDI L4B biomass data, GEDI canopy height data, Landsat 8, and vegetation indices) to train and validate a Random Forest model to predict aboveground biomass density.

The steps include:

1. **Data Import**: Importing necessary remote sensing datasets such as GEDI, Landsat, and vegetation indices.

2. **Feature Engineering**: Calculating vegetation indices like NDVI, RGVI, ARVI, EVI, and VARI.

3. **Training & Validation**: Using the Random Forest algorithm for training the model on a set of predictors and evaluating it on validation data.

4. **Model Prediction**: Using the trained model to predict biomass across the study area.

5. **Exporting Results**: Exporting the predictions as a GeoTIFF file for further analysis.



## Data Sources

**GEDI L4B Gridded Aboveground Biomass Density Data**: A dataset containing biomass estimates derived from the GEDI LiDAR instrument.

**GEDI Canopy Height Data (2019)**: Provides canopy height estimates from the GEDI mission.

**Landsat 8 Gap-Filled Data**: Landsat 8 images that have been gap-filled to reduce missing data.

**Vegetation Indices**: NDVI, RGVI, ARVI, EVI, and VARI are computed from Landsat data to provide additional features for the biomass prediction model.


