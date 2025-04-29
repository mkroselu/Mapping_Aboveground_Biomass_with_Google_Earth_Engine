// Define the region of interest (e.g., a geometry representing your study area)
var aoi = ee.Geometry.Polygon([
  [-116.40,41.85], 
  [-116.40,46.09], 
  [-124.53,46.09], 
  [-124.53,41.85]
]); 

Map.centerObject(aoi, 12);

// Import GEDI L4B Gridded Aboveground Biomass Density Data
var l4b = ee.Image('LARSE/GEDI/GEDI04_B_002').select('MU')
var biomass = l4b.clip(aoi)

var visParams = {
  min: 10,  // Minimum value for scaling
  max: 250,  // Maximum value for scaling
  palette: '440154,414387,2a788e,23a884,7ad151,fde725'  // Color gradient from low to high
};

Map.addLayer(biomass, visParams, 'GEDI_L4B_Biomass');


// Import 2019 Canopy Heights
var height_19 = ee.Image('projects/sat-io/open-datasets/GLAD/GEDI_V27/GEDI_NAM_v27')
  .select('b1')
  .clip(aoi);
  
print('2019 CHM', height_19)
Map.addLayer(height_19, {},'2019 GEDI CHM')


// Import the Landsat 8 gap-free Collection from GEE
var landsat = ee.ImageCollection('projects/KalmanGFwork/GFLandsat_V1');
//var landsat = ee.ImageCollection('projects/ee-emma/assets/GF_Landsat_Europe_C2');

// Filter the Landsat 8 Collection by date and region of interest
var filteredLandsat = landsat
  .filterBounds(aoi)
  .filterDate('2020-07-01', '2020-07-31')
  .first(filteredLandsat); 

print('Landsat Gap Filled', filteredLandsat)
Map.addLayer(filteredLandsat, {bands: ['B3_mean_post', 'B2_mean_post', 'B1_mean_post'], min: 0, max: 3000}, 'Landsat_gapfilled')


var combinedimage = filteredLandsat.select(['B1_mean_post','B2_mean_post','B3_mean_post','B4_mean_post','B5_mean_post','B7_mean_post']);


// Calculate NDVI 
var ndvi = combinedimage.expression(
  '(NIR - RED) / (NIR + RED)',
  {
    'NIR': combinedimage.select('B4_mean_post'),
    'RED': combinedimage.select('B3_mean_post'),
  }
);

var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
Map.addLayer(ndvi, ndviParams, 'NDVI');


// Calculate RGVI 
var rgvi = combinedimage.expression(
  '(RED - GRE) / (RED + GRE)',
  {
    'GRE': combinedimage.select('B2_mean_post'),
    'RED': combinedimage.select('B3_mean_post'),
  }
);

var rgviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
Map.addLayer(rgvi, rgviParams, 'RGVI');


// Calculate ARVI 
var arvi = combinedimage.expression(
  '(NIR - (2 * RED - BLUE)) / (NIR + (2 * RED - BLUE))',
  {
    'NIR': combinedimage.select('B4_mean_post'),
    'RED': combinedimage.select('B3_mean_post'),
    'BLUE': combinedimage.select('B1_mean_post')
  }
);

var visParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
Map.addLayer(arvi, visParams, 'ARVI');


// Calculate EVI 
var evi = combinedimage.expression(
  '(2.5 * (NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1)',
  {
    'NIR': combinedimage.select('B4_mean_post'),
    'RED': combinedimage.select('B3_mean_post'),
    'BLUE': combinedimage.select('B1_mean_post')
  }
);

var visParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
Map.addLayer(evi, visParams, 'EVI');


// Calculate VARI 
var vari = combinedimage.expression(
  '(GREEN - RED) / (GREEN + RED - BLUE)',
  {
    'GREEN': combinedimage.select('B2_mean_post'),
    'RED': combinedimage.select('B3_mean_post'),
    'BLUE': combinedimage.select('B1_mean_post')
  }
);

var visParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
Map.addLayer(vari, visParams, 'VARI');


////////// Stack all of the predictors & Response variable ////////// 
var predictors2020 = vari.addBands([height_19, ndvi, rgvi, arvi, evi, biomass]).rename(['vari','height_19', 'ndvi', 'rgvi', 'arvi', 'evi', 'biomass']);


////////// Sample & Train RF Model //////////
var samplePoints = predictors2020.sample({
  region: aoi,
  scale: 30,
  numPixels: 1000,
  seed: 42
});

var RandomPoints = samplePoints.randomColumn('rand', 42);
var training = RandomPoints.filter(ee.Filter.lt('rand', 0.7));
var validation = RandomPoints.filter(ee.Filter.gte('rand', 0.7));

print('Training', training)
Map.addLayer(training, {},'Training points')


var predictorNames = ['vari','height_19', 'ndvi', 'rgvi', 'arvi', 'evi'];

var rf = ee.Classifier.smileRandomForest({
  numberOfTrees: 100
})
.setOutputMode('REGRESSION')
.train({
  features: training,
  classProperty: 'biomass', //response variable
  inputProperties: predictorNames //predictors
});


////////// Calculate Validation Metrics //////////
var val = validation.classify(rf);
var predictedVals = val.aggregate_array('classification');
var observedVals  = val.aggregate_array('biomass');

var rmse = ee.Number(
  predictedVals.zip(observedVals).map(function(pair) {
    var pred = ee.Number(ee.List(pair).get(0));
    var obs  = ee.Number(ee.List(pair).get(1));
    return pred.subtract(obs).pow(2);
  }).reduce(ee.Reducer.mean())
).sqrt();
print('2020 Model Validation RMSE:', rmse);

var meanObs = ee.Number(observedVals.reduce(ee.Reducer.mean()));
var sse = ee.Number(
  predictedVals.zip(observedVals).map(function(pair) {
    var pred = ee.Number(ee.List(pair).get(0));
    var obs  = ee.Number(ee.List(pair).get(1));
    return pred.subtract(obs).pow(2);
  }).reduce(ee.Reducer.sum())
);
var sst = ee.Number(
  observedVals.map(function(obs) {
    return ee.Number(obs).subtract(meanObs).pow(2);
  }).reduce(ee.Reducer.sum())
);
var r2 = ee.Number(1).subtract(sse.divide(sst));
print('2020 Model Validation R²:', r2);


////////// Make predictions ////////// 
var prediction = predictors2020.select(predictorNames).clip(aoi).classify(rf);
var predParams = {min: -100, max: 10000, palette: ['blue', 'white', 'green']};

print('Prediction:', prediction);
Map.addLayer(prediction, predParams, 'Prediction');


////////// Export the GeoTIFF file to Google Drive ////////// 

var maxPixels = 500000000000;

Export.image.toDrive({
  image: prediction,
  folder: 'biomass',
  description: '2020_biomass',
  region: aoi,
  scale: 30, // Adjust the scale as needed for your export
  maxPixels: maxPixels
});

