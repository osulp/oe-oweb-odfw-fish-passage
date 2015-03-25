var map;

require([
  "esri/map",
  "esri/SnappingManager",
  "esri/tasks/GeometryService",
  "esri/dijit/Geocoder",
  "esri/toolbars/edit",
  "esri/dijit/LocateButton",
  "esri/dijit/HomeButton",
  "esri/dijit/Scalebar",
  "esri/dijit/BasemapToggle",
  "esri/dijit/Legend",

  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/layers/FeatureLayer",

  "esri/Color",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/graphic",
  "esri/geometry/screenUtils",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/_base/Color",

  "esri/dijit/editing/Editor",
  "esri/dijit/editing/TemplatePicker",

  "esri/config",
  "dojo/i18n!esri/nls/jsapi",

  "dojo/_base/array", "dojo/parser", "dojo/keys",

  "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
  "dojo/domReady!"
], function (
  Map, SnappingManager, GeometryService, Geocoder, Edit, LocateButton, HomeButton, Scalebar, BasemapToggle, Legend,
  ArcGISTiledMapServiceLayer, ArcGISDynamicMapService, FeatureLayer,
  Color, SimpleMarkerSymbol, SimpleLineSymbol,
  Graphic, screenUtils, dom, domConstruct, query, DojoColor,
  Editor, TemplatePicker,
  esriConfig, jsapiBundle,
  arrayUtils, parser, keys
) {
    parser.parse();

    // snapping is enabled for this sample - change the tooltip to reflect this
    jsapiBundle.toolbars.draw.start += "<br>Press <b>SHIFT</b> to enable snapping";
    jsapiBundle.toolbars.draw.addPoint += "<br>Press <b>SHIFT</b> to enable snapping";


    // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/jshelp/ags_proxy.html
    esriConfig.defaults.io.proxyUrl = "proxy.ashx";

    //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications. 
    esriConfig.defaults.geometryService = new GeometryService("http://arcgis.oregonexplorer.info/arcgis/rest/services/Utilities/Geometry/GeometryServer");

    map = new Map("map", {
        basemap: "gray",
        center: [-120, 44.351],
        zoom: 7,
        slider: true
    });

    var scalebar = new Scalebar({
        map: map,
        // "dual" displays both miles and kilmometers
        // "english" is the default, which displays miles
        // use "metric" for kilometers
        scalebarUnit: "dual"
    });


    //map.on("layers-add-result", initEditor);

    geoLocate = new LocateButton({
        map: map
    }, "LocateButton");
    geoLocate.startup();

    var home = new HomeButton({
        map: map
    }, "HomeButton");
    home.startup();
    var ext = new esri.geometry.Extent(-14371103.538135934, 4979131.637192282, -12475465.236664068, 6030905.146396027, new esri.SpatialReference({ wkid: 102100 }));
    var geocoder = new Geocoder({
        arcgisGeocoder: {
            placeholder: "Find a place",
            suffix: " OR",
            searchExtent: ext
        },
        autoComplete: true,
        map: map
    }, dom.byId("search"));

    var toggle = new BasemapToggle({
        map: map,
        basemap: "hybrid"
    }, "BasemapToggle");
    toggle.startup();


    map.on("load", enableSpotlight);

    geocoder.on("select", showLocation);
    geocoder.on("clear", removeSpotlight);

    
    //add boundaries and place names 
    var oregonMask = new FeatureLayer("http://arcgis.oregonexplorer.info/arcgis/rest/services/oreall/oreall_admin/MapServer/36", {
        "id": "oregonMask",
        "opacity": 0.75
    });
    map.addLayer(oregonMask);

    //var nhd = new ArcGISDynamicMapService("http://services.nationalmap.gov/arcgis/rest/services/nhd/MapServer/13");
    var nhd = new FeatureLayer("http://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/ODFW_Streams/FeatureServer/1", {
        "id": "streams",
        "opacity": 0.75
    });
    //map.addLayer(nhd);

    var priorityBarriers = new FeatureLayer("http://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/ODFW_FishPassageBarriers/FeatureServer/0", {
        outFields: ['*']
    });
    
    var responsePoints = new FeatureLayer("http://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/OregonFishPassageBarriers/FeatureServer/0", {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
    });

    //var responsePolys = new FeatureLayer("http://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/OregonFishPassageBarriers/FeatureServer/0", {
    //    mode: FeatureLayer.MODE_ONDEMAND,
    //    outFields: ['*']
    //});

    map.addLayers([priorityBarriers, responsePoints, nhd]);

    function showLocation(evt) {
        map.graphics.clear();
        var point = evt.result.feature.geometry;
        var symbol = new SimpleMarkerSymbol().setStyle(
          SimpleMarkerSymbol.STYLE_SQUARE).setColor(
          new Color([255, 0, 0, 0.5])
        );
        var graphic = new Graphic(point, symbol);
        map.graphics.add(graphic);

        map.infoWindow.setTitle("Search Result");
        map.infoWindow.setContent(evt.result.name);
        map.infoWindow.show(evt.result.feature.geometry);

        var spotlight = map.on("extent-change", function (extentChange) {
            var geom = screenUtils.toScreenGeometry(map.extent, map.width, map.height, extentChange.extent);
            var width = geom.xmax - geom.xmin;
            var height = geom.ymin - geom.ymax;

            var max = height;
            if (width > height) {
                max = width;
            }

            var margin = '-' + Math.floor(max / 2) + 'px 0 0 -' + Math.floor(max / 2) + 'px';

            query(".spotlight").addClass("spotlight-active").style({
                width: max + "px",
                height: max + "px",
                margin: margin
            });
            spotlight.remove();
        });
    }

    function enableSpotlight() {
        var html = "<div id='spotlight' class='spotlight'></div>"
        domConstruct.place(html, dom.byId("map_container"), "first");
    }

    function removeSpotlight() {
        query(".spotlight").removeClass("spotlight-active");
        map.infoWindow.hide();
        map.graphics.clear();
    }


    //add the legend
    map.on("layers-add-result", function (evt) {
        var layerInfo = arrayUtils.map(evt.layers, function (layer, index) {
            return { layer: layer.layer, title: layer.layer.name };
        });
       
        if (layerInfo.length > 0) {//add to legend
            var legendDijit = new Legend({
                map: map,
                layerInfos: layerInfo
            }, "legendDiv");
            legendDijit.startup();
        }
        var templateLayers = [];
        var selectableLayers = [];
        for (var x = 0; x < layerInfo.length; x++) {
            if (layerInfo[x].title === "Fish Passage Barriers") {
                templateLayers.push(layerInfo[x].layer);                
            }
            if (layerInfo[x].title !== "Detailed Streams") {
                selectableLayers.push({featureLayer: layerInfo[x].layer});
            }
        }        
        var templatePicker = new TemplatePicker({
            featureLayers: templateLayers,
            grouping: true,
            rows: "auto",
            columns: 3
        }, "templateDiv");
        templatePicker.startup();

        //var layers = [{ featureLayer: layerInfo[0].layer }];        
        //var layers = arrayUtils.map(evt.layers, function (result) {           
        //        return { featureLayer: result.layer }                       
        //});
        var settings = {
            map: map,
            templatePicker: templatePicker,
            layerInfos: selectableLayers,
            toolbarVisible: false,
            //createOptions: {
            //    polylineDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYLINE],
            //    polygonDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYGON,
            //      Editor.CREATE_TOOL_CIRCLE,
            //      Editor.CREATE_TOOL_TRIANGLE,
            //      Editor.CREATE_TOOL_RECTANGLE
            //    ]
            //},
            //toolbarOptions: {
            //    reshapeVisible: false
            //}
        };

        var params = { settings: settings };
        var myEditor = new Editor(params, 'editorDiv');
        //define snapping options
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CROSS,
          15,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0, 0.5]),
            5
          ),
          null
        );
        map.enableSnapping({
            snapPointSymbol: symbol,
            tolerance: 20,
            snapKey: keys.SHIFT
        });

        myEditor.startup();

    });


    function initEditor(evt) {
        var templateLayers = arrayUtils.map(evt.layers, function (result) {
            return result.layer;
        });
        var templatePicker = new TemplatePicker({
            featureLayers: templateLayers,
            grouping: true,
            rows: "auto",
            columns: 3
        }, "templateDiv");
        templatePicker.startup();

        var layers = arrayUtils.map(evt.layers, function (result) {
            return { featureLayer: result.layer };
        });
        var settings = {
            map: map,
            templatePicker: templatePicker,
            layerInfos: layers,
            toolbarVisible: true,
            createOptions: {
                polylineDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYLINE],
                polygonDrawTools: [Editor.CREATE_TOOL_FREEHAND_POLYGON,
                  Editor.CREATE_TOOL_CIRCLE,
                  Editor.CREATE_TOOL_TRIANGLE,
                  Editor.CREATE_TOOL_RECTANGLE
                ]
            },
            toolbarOptions: {
                reshapeVisible: true
            }
        };

        var params = { settings: settings };
        var myEditor = new Editor(params, 'editorDiv');
        //define snapping options
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CROSS,
          15,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0, 0.5]),
            5
          ),
          null
        );
        map.enableSnapping({
            snapPointSymbol: symbol,
            tolerance: 20,
            snapKey: keys.SHIFT
        });

        myEditor.startup();
    }
});