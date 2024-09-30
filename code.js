

//var shps: Table users/Mei_Kuei_Lu/Pacific_fn_clp
var shps = ee.FeatureCollection("users/Mei_Kuei_Lu/Central_fn_clp");
//
/*Map.addLayer (shps,{color:'black'},'Fishnets');
Map.addLayer (table2,{color:'red'},'States');

var geometry = table
.filter(ee.Filter.eq('Id',1));

Map.addLayer (geometry,{color:'yellow'},'Id1');*/

var dp = require('users/Mei_Kuei_Lu/CONUS_CHM:landTrendr');

// define landtrendr and change mapping parameters
var imgcolParams = {
  startYear: 2015,
  endYear: 2021,
  startDay:'01-01',
  endDay: '12-30',
  index:'NBR',
  maskThese :['cloud', 'shadow', 'snow', 'water'],
  changeYear:2018,
  clipaoi:shp
};


var runParams = { 
  maxSegments:            6,
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true,
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};

var startYear = imgcolParams.startYear;
var endYear = imgcolParams.endYear;
var changeParams = {
  delta:  'loss',
  sort:   'newest',
  year:   {checked:true, start:startYear, end:endYear},
  mag:    {checked:true, value:300,  operator:'>'},
  dur:    {checked:true, value:10,    operator:'<'},
  preval: {checked:true, value:350,  operator:'>'},
  mmu:    {checked:true, value:15},
};

for (var tilenum = 21; tilenum <= 119; tilenum++){ //shps.size()

  // get feature from shapefile
  var shp = shps.filter(ee.Filter.eq('Id', tilenum)).geometry(0.001);
  
  // get and stack gap-filled landsat
  var ls = dp.lstack(2019, [1,4,8,12], shp).clip(shp);

  // map land cover change using Landtrendr
  var chm = dp.getchangemask(imgcolParams, runParams, changeParams).clip(shp);

  // get and stack LANDFIRE layers
  var lf = dp.lfstack(shp).clip(shp);

  // stack all data (landsat, LANDFIRE, disturbance)
  var chmp = chm.reproject('EPSG:4326', null, 30);
  var dataimg = ee.Image.cat([ls,lf,chm]);

  // export stacked data to Google Drive folder
  Export.image.toDrive({
      image: dataimg, 
      description: 'tile_' + tilenum,   
      folder: 'Central', 
      fileNamePrefix: 'tile_' + tilenum, 
      region: shp, 
      scale: 30, 
      crs: 'EPSG:4326', 
      maxPixels: 1e13
  });

}