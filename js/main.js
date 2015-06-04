var map,
    updateFeature,
    geocoder,
    undoManager,
    barriers,
    streams,
    attInspector,
    selectedTemplate,
    activeStep,
    selectedBarrierForReport,
    basemapGallery,
    drawToolbar,
    templatePicker,
    barriersLayerName = "Fish Passage Barriers",
    nhdServiceUrl = "http://services.nationalmap.gov/arcgis/rest/services/nhd/MapServer/10",
    fpServiceUrl = "http://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/OregonFishPassageBarriers/FeatureServer/0",
    fpPriorityServiceUrl = "http://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/ODFW_FishPassageBarriers/FeatureServer/0",
    geometryServiceUrl = "http://arcgis.oregonexplorer.info/arcgis/rest/services/Utilities/Geometry/GeometryServer",
    oregonMaskServiceUrl = "http://arcgis.oregonexplorer.info/arcgis/rest/services/oreall/oreall_admin/MapServer", //36;
    roadServiceUrl = "http://navigator.state.or.us/arcgis/rest/services/Framework/Trans_GeneralMap_WM/MapServer/3",
    editor_id = 12;
//ags jsapi requires
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
  "esri/dijit/BasemapGallery",
  "esri/dijit/Legend",

  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "esri/tasks/BufferParameters",

  "esri/Color",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/graphic",
  "esri/geometry/screenUtils",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/normalizeUtils",  

  "dojo/dom",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/_base/Color",
  "dojo/promise/all",
  "esri/renderers/UniqueValueRenderer",
  
  "esri/dijit/editing/Editor",
  "esri/dijit/editing/TemplatePicker",
  "esri/dijit/AttributeInspector",
  "esri/undoManager",

  "esri/config",
  "dojo/i18n!esri/nls/jsapi",
  "esri/renderers/jsonUtils",

  "dojo/_base/array", "dojo/parser", "dojo/keys", "dijit/form/Button", "dijit/Dialog",

  "dijit/layout/BorderContainer", "dijit/layout/ContentPane", 
  "dojo/domReady!"
], function (
  Map, SnappingManager, GeometryService, Geocoder, Edit, LocateButton, HomeButton, Scalebar, BasemapToggle, BasemapGallery, Legend,
  ArcGISTiledMapServiceLayer, ArcGISDynamicMapService, FeatureLayer, Query, BufferParameters,
  Color, SimpleMarkerSymbol, SimpleLineSymbol,
  Graphic, screenUtils, webMercatorUtils, normalizeUtils, dom, domConstruct, query, DojoColor, all, UniqueRenderer,
  Editor, TemplatePicker, AttributeInspector, UndoManager,
  esriConfig, jsapiBundle, jsonUtil,
  arrayUtils, parser, keys, Button, Dialog
) {
    parser.parse();

    //get Query String values for ProjectID,
    var qsParams = getQueryStrings();
    editor_id = qsParams.length > 0 && qsParams.opbsid !== undefined ? qsParams.opbsid : editor_id;

    //set dojo connects/styles etc
    set_display_handlers();

    //set map display/settings etc
    set_map();

    function set_display_handlers() {
        // snapping is enabled for this sample - change the tooltip to reflect this
        jsapiBundle.toolbars.draw.start += "<br>Press <b>SHIFT</b> to enable snapping<br>ESC to quit";
        jsapiBundle.toolbars.draw.addPoint += "<br>Press <b>SHIFT</b> to enable snapping<br>ESC to quit";

        undoManager = new UndoManager({ maxOperations: 8 });//specify the number of undo operations allowed using the maxOperations parameter

        //listen for the undo/redo button click events
        dojo.connect(dojo.byId('undo'), 'onclick', function (e) {
            undoManager.undo();
        });
        dojo.connect(dojo.byId('redo'), 'onclick', function (e) {
            undoManager.redo();
        });
        dojo.connect(dojo.byId('clearSelection'), 'onclick', function (e) {
            barriers.clearSelection();
            map.infoWindow.hide();
            //dojo.byId('clearSelection').style.display = "none";
            dojo.byId('selectedBarrier').innerHTML = "No barrier selected";
        });
        dojo.connect(dojo.byId('help'), 'onclick', function (e) {
            help_dialog.show();
        });
    }    

    function set_map() {
        // refer to "Using the Proxy Page" for more information:  https://developers.arcgis.com/javascript/jshelp/ags_proxy.html
        esriConfig.defaults.io.proxyUrl = "proxy.ashx";
        esriConfig.defaults.geometryService = new GeometryService(geometryServiceUrl);
        var ext = new esri.geometry.Extent(-14371103.538135934, 4979131.637192282, -12475465.236664068, 6030905.146396027, new esri.SpatialReference({ wkid: 102100 }));

        map = new Map("map", {            
            center: [-120.5, 44.351],
            zoom: 7,
            slider: true
        });
        

        createBasemapGallery();
        //add scalebar
        var scalebar = new Scalebar({
            map: map,
            // "dual" displays both miles and kilmometers
            // "english" is the default, which displays miles
            // use "metric" for kilometers
            scalebarUnit: "dual"
        });

        //add geolocate button
        geoLocate = new LocateButton({
            map: map
        }, "LocateButton");
        geoLocate.startup();

        //add home default extent button
        var home = new HomeButton({
            map: map
        }, "HomeButton");
        home.startup();

        //add search box with autocomplete geocoder
        geocoder = new Geocoder({
            arcgisGeocoder: {
                placeholder: "Find a place",
                suffix: " OR",
                searchExtent: ext
            },
            autoComplete: true,
            map: map
        }, dom.byId("search"));        

        //add map event handlers
        add_map_evt_handlers();
    }

    function createBasemapGallery() {
        //manually create basemaps to add to basemap gallery
        var basemaps = [];
        var imagery = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer");
        var referenceLabels = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer");
        var lightGray = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer");
        var topo = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/USA_Topo_Maps/MapServer");
        var street = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer");

        
        //var lightGrayBaseMap = new esri.dijit.Basemap({
        //    id: 'gray',
        //    layers: [lightGray, referenceLabels],
        //    title: "Gray",
        //    thumbnailUrl: "images/light_gray_canvas.jpg"
        //});
        //basemaps.push(lightGrayBaseMap);

        var streetBaseMap = new esri.dijit.Basemap({
            id: 'street',
            layers: [street],
            title: "Street",
            thumbnailUrl: "images/world_street_map.jpg"
        });
        basemaps.push(streetBaseMap);

        var topoBaseMap = new esri.dijit.Basemap({
            id: 'topo',
            layers: [topo],
            title: "Topo",
            thumbnailUrl: "images/topo_map_2.jpg"
        });
        basemaps.push(topoBaseMap);       

        var imageryBasemap = new esri.dijit.Basemap({
            id: 'imagery',
            layers: [imagery, referenceLabels],
            title: "Satellite",
            thumbnailUrl: "images/imagery.jpg"
        });
        basemaps.push(imageryBasemap);

        basemapGallery = new esri.dijit.BasemapGallery({
            showArcGISBasemaps: false,
            basemaps: basemaps,
            map: map
        }, "basemapGallery");
        basemapGallery.startup();

        var selectionHandler = basemapGallery.on("selection-change", function () {
            dojo.disconnect(selectionHandler);
            add_layers();
            basemapGallery.select('street');
        });

    }


    function add_layers() {
        //add boundaries and place names 
        var oregonMask = new ArcGISDynamicMapService(oregonMaskServiceUrl, {
            "id": "oregonMask",
            "opacity": 0.55
        });
        oregonMask.setVisibleLayers([36]);
        map.addLayer(oregonMask);

        //Stream layer with LABELS-- TURNED OFF because arrows display
        //var nhd = new ArcGISDynamicMapService("http://services.nationalmap.gov/arcgis/rest/services/nhd/MapServer", { "opacity": 0.1 });
        //nhd.setVisibleLayers([10]);
        //map.addLayer(nhd);       
        
        //OWRI projects-- TURNED OFF to reduce confusion
        //var owri_fp = new FeatureLayer("http://arcgis.oregonexplorer.info/arcgis/rest/services/oreall/oreall_restoration/MapServer/5", {
        //    "id": "owri fp",
        //    outFields: ['*'],
        //    "opacity": 0.75,
        //});
        //owri_fp.setDefinitionExpression("activity_type like 'fish passage' or activity_type like 'Fish Passage' or activity_type like 'Fish Screening' or activity_type like 'fish screening'");
        
        streams = new FeatureLayer(nhdServiceUrl, {
            "id": "streams",
            outFields: ['*'],
            "opacity": 0.75
        });            
        

        var priorityBarriers = new FeatureLayer(fpPriorityServiceUrl, {
            outFields: ['*']
        });
        //
        barriers = new FeatureLayer(fpServiceUrl, {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ['*'],
            //minScale:400000
        });
        barriers.setDefinitionExpression("Priority in (NULL,0,1,2,3,4,5)");
        map.addLayers([streams, priorityBarriers, barriers]);

    }

    function add_map_evt_handlers() {
        map.on("load", function () {
            //after map loads, connect to listen to mouse move & drag events
            map.on("mouse-move", showCoordinates);
            map.on("mouse-drag", showCoordinates);
        });

        function showCoordinates(evt) {
            //the map is in web mercator but display coordinates in geographic (lat, long)
            var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
            //display mouse coordinates
            dom.byId("coords").innerHTML = mp.y.toFixed(3) + ", " + mp.x.toFixed(3);
        }

        map.on('key-down', function (evt) {
            if (evt.keyCode === 27) {
                drawToolbar.deactivate();
                templatePicker.clearSelection();
            }
        });

        map.on('extent-change', function (evt) {
            dojo.query('#template-overlay').style("display", evt.lod.level > 12 ? "none" : "block");
            //show all barriers when zoomed in
            if (barriers !== undefined) {
                var expression = evt.lod.level < 12 ? "Priority<>''" : "1=1";
                barriers.setDefinitionExpression(expression);
            }

        });        
        map.infoWindow.on("hide", function () {
            barriers.clearSelection();
        });
        geocoder.on("select", showLocation);
        geocoder.on("clear", function () {
            map.infoWindow.hide();
            map.graphics.clear();
        });

        //add the legend and edit template picker when map.addLayers called.  Only layers added with this will be included. 
        map.on("layers-add-result", function (results) {            
            var layers = dojo.map(results.layers, function (result) {
                return result.layer;
            });
            
            //display read-only info window when user clicks on feature 
            var query = new esri.tasks.Query();

            dojo.forEach(layers, function (layer) {
                if (layer.name === "Flow Direction") {
                    var renderer = layer.renderer;
                    renderer.setSizeInfo({
                        field: "FCODE",
                        minSize: 2,
                        maxSize: 2,
                        minDataValue: '',
                        maxDataValue: ''
                    });
                    layer.setRenderer(renderer);
                }
                if (layer.name === "ODFW Fish Passage Barriers, Priority") {
                    var renderer = layer.renderer;
                    renderer.setSizeInfo({
                        field: "Psg_Level",
                        minSize: 20,
                        maxSize: 20,
                        minDataValue: '',
                        maxDataValue: ''
                    });
                    layer.setRenderer(renderer);
                }

                //TURNED OFF
                //if (layer.name === "OWRI Project Point Features") {               
                //    var renderer = UniqueRenderer(fp_symbol);
                //    layer.setRenderer(renderer);
                //}

                if (layer.name === "Fish Passage Barriers") {
                    dojo.connect(layer, "onBeforeApplyEdits", function (adds, deletes, updates) {
                        dijit.byId("undo").set("disabled", true);
                        dijit.byId("redo").set("disabled", true);
                        dojo.forEach(adds, function (add) {
                            //the map is in web mercator but display coordinates in geographic (lat, long)
                            var mp = webMercatorUtils.webMercatorToGeographic(add.geometry);
                            currentDate = new Date();
                            var display_date = currentDate.getFullYear() + "" + ((currentDate.getMonth() + 1) > 9 ? (currentDate.getMonth() + 1) : "0" + (currentDate.getMonth() + 1)) + "" + ((currentDate.getDate() > 9 ? currentDate.getDate() : "0" + currentDate.getDate()));
                            //COMMENT OUT THIS SECTION FOR ROAD/STREAM QUERIES AS IT NEEDS TO BE ADDED LATER IN THAT CONTEXT.
                            add.attributes['fpbLat'] = mp.y.toFixed(5);
                            add.attributes['fpbLong'] = mp.x.toFixed(5);
                            add.attributes['fpbRevDt'] = display_date;
                            add.attributes['fpbONm'] = 'OWEB';
                            add.attributes['fpbLocMd'] = 'DigDerive';
                            add.attributes['fpbLocAccu'] = 50;
                            add.attributes['fpbLocDt'] = display_date;
                            add.attributes['OWEB_userid'] = editor_id;
                            add.attributes['OWEB_status'] = 1;
                            //END COMMENT OUT SECTION FOR ROAD/STREAM QUERY

                            //buffer point for stream/road queries
                            //setup the buffer parameters
                            //CODE TO QUERY STREAMS AND ROAD 
                            //var params = new BufferParameters();
                            //params.distances = [100];
                            //params.outSpatialReference = map.spatialReference;
                            //params.unit = GeometryService['UNIT_FOOT'];
                            //params.geometries = [add.geometry];

                            //esriConfig.defaults.geometryService.buffer(params, function (bufferedGeom) {                                                              
                                //build query task
                                //qt_stream = new esri.tasks.QueryTask(nhdServiceUrl);
                                //qt_roads = new esri.tasks.QueryTask(roadServiceUrl);

                                //var stream_query = new esri.tasks.Query();
                                //var road_query = new esri.tasks.Query();

                                //stream_query.outSpatialReference = road_query.outSpatialReference = { "wkid": 102100 };
                                //stream_query.returnGeometry = road_query.returnGeometry = false;
                                //stream_query.geometry = road_query.geometry = bufferedGeom[0];
                                //stream_query.outFields = ["GNIS_NAME"];
                                //road_query.outFields = ["NAME"];

                                //var stream_promise = qt_stream.execute(stream_query);                                
                                //var road_promise = qt_roads.execute(road_query);
                                ////var promises = all([stream_promise]);
                                //var promises = all([stream_promise, road_promise]);
                                
                                //promises.then(function (results) {
                                //    add.attributes['fpbLat'] = mp.y.toFixed(5);
                                //    add.attributes['fpbLong'] = mp.x.toFixed(5);
                                //    add.attributes['fpbRevDt'] = display_date;
                                //    add.attributes['fpbONm'] = 'OWEB';
                                //    add.attributes['fpbLocMd'] = 'DigDerive';
                                //    add.attributes['fpbLocAccu'] = 50;
                                //    add.attributes['fpbLocDt'] = display_date;
                                //    add.attributes['OWEB_userid'] = editor_id;
                                //    add.attributes['OWEB_status'] = 1;
                                //    if (results[0].features.length > 0) {
                                //        add.attributes['fpbStrNm'] = results[0].features[0].attributes.GNIS_NAME !== null ? results[0].features[0].attributes.GNIS_NAME : "";
                                //    }
                                //    if (results[1].features.length > 0) {
                                //        add.attributes['fpbRdNm'] = results[1].features[0].attributes.NAME !== null ? results[1].features[0].attributes.NAME : "";
                                //    }                                    
                                //});                                
                            //  });
                            //END CODE TO QUERY STERAMS AND ROAD
                        });
                    });
                    dojo.connect(layer, "onClick", function (evt) {
                        //add delete for option for barrier layer
                        if (templatePicker.getSelected() === null) {
                            if (evt.graphic.getLayer().name === barriersLayerName && (evt.ctrlKey === true || evt.metaKey === true)) {
                                //delete feature if ctrl key is depressed
                                dojo.stopEvent(evt);
                                this.applyEdits(null, null, [evt.graphic], function () {
                                    var operation = new esri.dijit.editing.Delete({
                                        featureLayer: layer,
                                        deletedGraphics: [evt.graphic]
                                    });

                                    undoManager.add(operation);
                                    checkUI();
                                });
                            }
                            else {
                                this.applyEdits(null, [evt.graphic], null);//update
                                if (map.infoWindow.isShowing) {
                                    map.infoWindow.hide();
                                }
                                var layerInfos = [{
                                    'featureLayer': layer,
                                    'isEditable': evt.graphic.attributes.OWEB_userid === editor_id ? true : false,
                                    'showDeleteButton': evt.graphic.attributes.OWEB_userid === editor_id ? true : false,
                                }];
                                layerInfos[0].fieldInfos = [
                                    { 'fieldName': 'fpbLat', 'label': 'Latitude' },
                                    { 'fieldName': 'fpbLong', 'label': 'Longitude' },
                                    { 'fieldName': 'fpbRevDt', 'label': 'Entry/Revision Date' },
                                    { 'fieldName': 'fpbONm', 'label': 'Originator Name' },
                                    { 'fieldName': 'fpbLocMd', 'label': 'Location Method' },
                                    { 'fieldName': 'fpbFtrTy', 'label': 'Feature Type' },
                                    { 'fieldName': 'fpbFtrNm', 'label': 'Feature Name' },
                                    { 'fieldName': 'fpbFPasSta', 'label': 'Passage Status' },
                                    { 'fieldName': 'fpbStaEvMd', 'label': 'Passage Eval Method' },
                                    { 'fieldName': 'fpbStrNm', 'label': 'Stream Name' },
                                    { 'fieldName': 'fpbRdNm', 'label': 'Road Name' },
                                    { 'fieldName': 'fpbFtrSTy', 'label': 'Barrier Subtype' },
                                    { 'fieldName': 'fpbOwn', 'label': 'Owner' },
                                    { 'fieldName': 'fpbComment', 'label': 'Comment' },
                                    { 'fieldName': 'Priority', 'label': 'Priority Barrier' },
                                    { 'fieldName': 'OWEB_userid', 'visible': false, 'label': 'OWEB ProjectID' },
                                ];                               

                                //store the current feature
                                updateFeature = evt.graphic;

                                var attInspectorSelect = new esri.dijit.AttributeInspector({
                                    layerInfos: layerInfos,
                                    //userid:editor_id
                                }, dojo.create("div"));

                                if (evt.graphic.attributes.OWEB_userid === editor_id) {
                                    ////add a save button next to the delete button
                                    var saveButtonSelect = new Button({ label: "Save", "class": "saveButton" }, domConstruct.create("div"));

                                    domConstruct.place(saveButtonSelect.domNode, attInspectorSelect.deleteBtn.domNode, "after");

                                    saveButtonSelect.on("click", function (feature) {
                                        updateFeature.getLayer().applyEdits(null, [updateFeature], null);
                                        selectedBarrierForReport = updateFeature;
                                        map.infoWindow.hide();
                                        //drawToolbar.deactivate();
                                    });

                                    attInspectorSelect.deleteBtn.onClick = function (feature) {
                                        updateFeature.getLayer().applyEdits(null, null, [updateFeature]);
                                        map.infoWindow.hide();
                                    };
                                    dojo.connect(attInspectorSelect, "onDelete", function (feature) {

                                    });
                                }

                                attInspectorSelect.startup();

                                attInspectorSelect.on("attribute-change", function (evt) {
                                    var feature = evt.feature;
                                    feature.attributes[evt.fieldName] = evt.fieldValue;
                                    feature.getLayer().applyEdits(null, [feature], null);
                                });

                                var selectionSymbol = new SimpleMarkerSymbol().setColor(new Color([255, 255, 0, 0.5]));
                                var noSelectionSymbol = new SimpleMarkerSymbol({
                                    "color": [255, 255, 255, 0],
                                    "size": 0
                                });                             

                                query.objectIds = [evt.graphic.attributes.objectid !== undefined ? evt.graphic.attributes.objectid : evt.graphic.attributes.OBJECTID];
                                layer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
                                    map.infoWindow.setTitle(layer.name);
                                    map.infoWindow.setContent(attInspectorSelect.domNode);
                                    map.infoWindow.resize(400, 400);
                                    map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
                                    
                                    if (features[0].getLayer().name === barriersLayerName) {
                                        selectedBarrierForReport = features[0];
                                        features[0].getLayer().setSelectionSymbol(selectionSymbol);
                                        var selected_html = features[0].attributes.fpbStrNm !== null ? "Name: " + features[0].attributes.fpbStrNm : "";
                                        selected_html += features[0].attributes.fpbFtrID !== null ? '<br />Barrier ID: ' + features[0].attributes.fpbFtrID : "";
                                        selected_html += features[0].attributes.fpbLat !== null ? '<br />Latitude: ' + features[0].attributes.fpbLat : "";
                                        selected_html += features[0].attributes.fpbLong !== null ? '<br />Longitude: ' + features[0].attributes.fpbLong : "";
                                        dojo.byId('selectedBarrier').innerHTML = selected_html;
                                        dojo.byId('clearSelection').style.display = "block";
                                    }
                                    else {
                                        //features[0].getLayer().clear();
                                        features[0].getLayer().setSelectionSymbol();
                                    }
                                });
                            }
                        }

                    });

                }        
                
            });          
            
            addLegend(results);                   

            barriers.types = barriers.types.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });

            barriers.types = barriers.types.map(function (type) {               
                return [barriers.renderer.values.indexOf(type.id), type]
            }).sort().map(function (j) {
                return j[1]
            })
            templatePicker = new esri.dijit.editing.TemplatePicker({
                featureLayers: [barriers],//barrierLayer,                
                rows: 3,
                columns: 3,
                grouping: true,
                useLegend: false
            }, "templateDiv");

            templatePicker.startup();     
            

            ////define snapping options
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

            var snapManager = map.enableSnapping({
                snapPointSymbol: symbol,
                tolerance: 20,
                snapKey: keys.SHIFT
            });
            var layerInfos = [{
                layer: streams,
                snapToEdge: true,
                snapToVertex: false
            }];
            snapManager.setLayerInfos(layerInfos);            

           // myEditor.startup();

            //once loaded hide overlay and set step display
            dojo.query(".step-wrapper-overlay").style("display", "none");            
            gotoStep(1);                       
           
            drawToolbar = new esri.toolbars.Draw(map);

            
            //when users select an item from the template picker activate the draw toolbar
            //with the geometry type of the selected template item.
            dojo.connect(templatePicker, "onSelectionChange", function (evt) {
                selectedTemplate = templatePicker.getSelected();               
                if (selectedTemplate !== null) {
                    drawToolbar.activate(esri.toolbars.Draw.POINT);
                }
            });


            //once the geometry is drawn - call applyEdits to update the feature service with the new geometry
            dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
                if (map.infoWindow.isShowing) {
                    map.infoWindow.hide();
                }
                drawToolbar.deactivate();

                var fieldAttributes = layerFieldToAttributes(selectedTemplate.featureLayer.fields);
                var newAttributes = dojo.mixin(fieldAttributes, selectedTemplate.template.prototype.attributes);
                var newGraphic = new esri.Graphic(geometry, null, newAttributes);
                updateFeature = newGraphic;

                var layerInfos = [{
                    'featureLayer': selectedTemplate.featureLayer,
                    'isEditable': true,
                    'fieldInfos': [
                                    { 'fieldName': 'fpbLat', 'isEditable': false, 'label': 'Latitude' },
                                    { 'fieldName': 'fpbLong', 'isEditable': false, 'label': 'Longitude' },
                                    //{ 'fieldName': 'fpbRevDt', 'isEditable': false, 'label': 'Entry/Revision Date' },
                                    //{ 'fieldName': 'fpbONm', 'isEditable': false, 'label': 'Originator Name' },
                                    //{ 'fieldName': 'fpbLocMd', 'isEditable': false, 'label': 'Location Method' },
                                    { 'fieldName': 'fpbFtrTy', 'label': 'Feature Type' },
                                    { 'fieldName': 'fpbFtrNm', 'label': 'Feature Name' },
                                    { 'fieldName': 'fpbMltFtr', 'label': 'Multiple Feature Flag' },
                                    { 'fieldName': 'fpbFPasSta', 'label': 'Passage Status' },
                                    { 'fieldName': 'fpbStaEvDt', 'label': 'Passage Status Eval Date' },
                                    { 'fieldName': 'fpbStaEvMd', 'label': 'Passage Status Eval Method' },
                                    { 'fieldName': 'fpbStrNm', 'label': 'Stream Name' },
                                    { 'fieldName': 'fpbRdNm', 'label': 'Road Name' },
                                    { 'fieldName': 'fpbFtrSTy', 'label': 'Barrier Subtype' },
                                    { 'fieldName': 'fpbHeight', 'label': 'Height (ft)' },
                                    { 'fieldName': 'fpbLength', 'label': 'Length(ft)' },
                                    { 'fieldName': 'fpbWidth', 'label': 'Width(ft)' },
                                    { 'fieldName': 'fpbSlope', 'label': 'Slope(%)' },
                                    { 'fieldName': 'fpbDrop', 'label': 'Drop(ft)' },
                                    { 'fieldName': 'fpbOrYr', 'label': 'Origin Year' },
                                    { 'fieldName': 'fpbOwn', 'label': 'Owner' },
                                    { 'fieldName': 'fpbComment', 'label': 'Comment' },
                                    //{ 'fieldName': 'OWEB_userid', 'label': 'OWEB UserID' },
                                    //{ 'fieldName': 'OWEB_status', 'label': 'OWEB Status' },
                    ]
                }];

                var attInspector = new esri.dijit.AttributeInspector({
                    layerInfos: layerInfos
                }, dojo.create("div"));

                ////add a save button next to the delete button
                var saveButton = new Button({ label: "Save", "class": "saveButton" }, domConstruct.create("div"));

                domConstruct.place(saveButton.domNode, attInspector.deleteBtn.domNode, "after");                           

                attInspector.startup();

                saveButton.on("click", function (evt) {
                    if (updateFeature.attributes.fpbLat !== 0) {
                        updateFeature.getLayer().applyEdits(null, [updateFeature], null);
                        map.infoWindow.hide();
                        drawToolbar.deactivate();
                    }
                    else {
                        evt.preventDefault();
                        return false;
                    }
                });

                dojo.connect(attInspector, "onAttributeChange", function (feature, fieldName, newFieldValue) {
                    var originalFeature = feature.toJson();
                    feature.attributes[fieldName] = newFieldValue;
                    feature.getLayer().applyEdits(null, [feature], null);
                    updateFeature = feature;

                    var operation = new esri.dijit.editing.Update({
                        featureLayer: feature.getLayer(),
                        preUpdatedGraphics: [new esri.Graphic(originalFeature)],
                        postUpdatedGraphics: [feature]
                    });

                    undoManager.add(operation);
                    checkUI();
                });

                dojo.connect(attInspector, "onDelete", function (feature) {
                    feature.getLayer().applyEdits(null, null, [feature]);
                    updateFeature = feature;

                    var operation = new esri.dijit.editing.Delete({
                        featureLayer: feature.getLayer(),
                        deletedGraphics: [feature]
                    });

                    undoManager.add(operation);
                    checkUI();
                    map.infoWindow.hide();
                });

                //window.setTimeout(function () { }, 1000);

                selectedTemplate.featureLayer.applyEdits([newGraphic], null, null, function () {
                    if (newGraphic.attributes.fpbLat !== 0) {
                        var screenPoint = map.toScreen(getInfoWindowPositionPoint(newGraphic));

                        drawToolbar.deactivate();

                        map.infoWindow.setContent(attInspector.domNode);
                        map.infoWindow.setTitle("New Barrier");
                        map.infoWindow.resize(325, 485);
                        map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));

                        templatePicker.clearSelection();

                        var operation = new esri.dijit.editing.Add({
                            featureLayer: newGraphic.getLayer(),
                            addedGraphics: [newGraphic]
                        });

                        undoManager.add(operation);

                        checkUI();
                    }
                    else {
                        //delete graphic to clean up.
                        selectedTemplate.featureLayer.applyEdits(null, null, [newGraphic], function () {
                            alert("Sorry, there was a problem adding your barrier. Please try again.");
                            //var selectedTemplate = templatePicker.getSelected();
                            var selectedTemplate = templatePicker.getSelected();                            
                            if (selectedTemplate !== null) {
                                drawToolbar.activate(esri.toolbars.Draw.POINT);
                            }
                                                  
                        });
                    }
                });                                              
            });
        });

     

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
        }       
    }

    function addLegend(results) {
        var legendLayerInfo = arrayUtils.map(results.layers, function (layer, index) {
            return { layer: layer.layer, title: layer.layer.name === "Flow Direction" ? "National Hydrography Dataset-Flow Direction" : layer.layer.name };
        });       

        if (legendLayerInfo.length > 0) {//add to legend
            var legendDijit = new Legend({
                map: map,
                layerInfos: legendLayerInfo
            }, "legendDiv");
            legendDijit.startup();
        }
    }

    function getInfoWindowPositionPoint(feature) {
        var point;
        switch (feature.getLayer().geometryType) {
            case "esriGeometryPoint":
                point = feature.geometry;
                break;
            case "esriGeometryPolyline":
                var pathLength = feature.geometry.paths[0].length;
                point = feature.geometry.getPoint(0, Math.ceil(pathLength / 2));
                break;
            case "esriGeometryPolygon":
                point = feature.geometry.getExtent().getCenter();
                break;
        }
        return point;
    }

    function layerFieldToAttributes(fields) {
        var attributes = {};
        dojo.forEach(fields, function (field) {
            attributes[field.name] = null;
        });
        return attributes;
    }


    //disable or enable undo/redo buttons depending on current app state
    function checkUI() {
        if (undoManager.canUndo) {
            dijit.byId("undo").set("disabled", false);
        }
        else {
            dijit.byId("undo").set("disabled", true);
        }

        if (undoManager.canRedo) {
            dijit.byId("redo").set("disabled", false);
        }
        else {
            dijit.byId("redo").set("disabled", true);
        }
    }
});

function gotoStep(stepNum) {
    activeStep = stepNum;
    map.infoWindow.hide();
    //barriers.clearSelection();
    var steps = dojo.query('.steps-wrapper');
    dojo.forEach(steps, function (step, index) {
        step.style.display = index + 1 === stepNum ? 'block' : 'none';
    });
}

function getQueryStrings() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function returnToApplication() {
    // Check to confirm that the window.opener is present.
    if (window.opener) {
        // Get the values of the parent form.
        window.opener.document.getElementById('response').innerHTML = selectedBarrierForReport !== undefined ? "Lat:" + selectedBarrierForReport.attributes.fpbLat + " Long:" + selectedBarrierForReport.attributes.fpbLong + " ID:" + selectedBarrierForReport.attributes.fpbOSiteID : "";
        window.close();
        
    }
}