var map,
    updateFeature,
    geocoder,
    undoManager,
    barriers,
    attInspector,
    selectedTemplate,
    activeStep,
    selectedBarrierForReport,
    basemapGallery,
    drawToolbar,
    templatePicker,
    barriersLayerName = "Fish Passage Barriers";

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

  "esri/Color",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/graphic",
  "esri/geometry/screenUtils",
  "esri/geometry/webMercatorUtils",

  "dojo/dom",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/_base/Color",
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
  ArcGISTiledMapServiceLayer, ArcGISDynamicMapService, FeatureLayer,
  Color, SimpleMarkerSymbol, SimpleLineSymbol,
  Graphic, screenUtils, webMercatorUtils, dom, domConstruct, query, DojoColor, UniqueRenderer,
  Editor, TemplatePicker, AttributeInspector, UndoManager,
  esriConfig, jsapiBundle, jsonUtil,
  arrayUtils, parser, keys, Button, Dialog
) {
    parser.parse();

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
        esriConfig.defaults.geometryService = new GeometryService("http://arcgis.oregonexplorer.info/arcgis/rest/services/Utilities/Geometry/GeometryServer");
        var ext = new esri.geometry.Extent(-14371103.538135934, 4979131.637192282, -12475465.236664068, 6030905.146396027, new esri.SpatialReference({ wkid: 102100 }));

        map = new Map("map", {
            //basemap: "gray", //topo,hybrid,dark,imagery
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

        //add basemap toggle
        //var toggle = new BasemapToggle({
        //    map: map,
        //    basemap: "satellite" //"streets" | "satellite" | "hybrid"| "topo"| "gray" | "dark-gray" | "oceans"| "national-geographic"| "terrain" | "osm"
        //}, "BasemapToggle");
        //toggle.startup();

        //add display layers
        //add_layers();

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
        var oregonMask = new FeatureLayer("http://arcgis.oregonexplorer.info/arcgis/rest/services/oreall/oreall_admin/MapServer/36", {
            "id": "oregonMask",
            "opacity": 0.55
        });        
        map.addLayer(oregonMask);

        //var nhd = new ArcGISDynamicMapService("http://services.nationalmap.gov/arcgis/rest/services/nhd/MapServer", { "opacity": 0.1 });
        //nhd.setVisibleLayers([10]);
        //map.addLayer(nhd);       
        

        //var owri_fp = new FeatureLayer("http://arcgis.oregonexplorer.info/arcgis/rest/services/oreall/oreall_restoration/MapServer/5", {
        //    "id": "owri fp",
        //    outFields: ['*'],
        //    "opacity": 0.75,
        //});
        //owri_fp.setDefinitionExpression("activity_type like 'fish passage' or activity_type like 'Fish Passage' or activity_type like 'Fish Screening' or activity_type like 'fish screening'");
        
        var streams = new FeatureLayer("http://services.nationalmap.gov/arcgis/rest/services/nhd/MapServer/10", {        
            "id": "streams",
            outFields: ['*'],
            "opacity": 0.75
        });            
        

        var priorityBarriers = new FeatureLayer("http://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/ODFW_FishPassageBarriers/FeatureServer/0", {
            outFields: ['*']
        });
        //
        barriers = new FeatureLayer("http://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/OregonFishPassageBarriers/FeatureServer/0", {
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ['*'],
            minScale:200000
        });
        
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

        //map.on("load", enableSpotlight);
        map.on('extent-change', function (evt) {            
            dojo.query('#template-overlay').style("display",evt.lod.level > 12 ? "none" : "block");            
        });
        //map.on("click", function (evt) {
        //    //removeSpotlight();            
        //});
        map.infoWindow.on("hide", function () {
            barriers.clearSelection();
        });
        geocoder.on("select", showLocation);
        geocoder.on("clear", removeSpotlight);

        //add the legend and edit template picker when map.addLayers called.  Only layers added with this will be included. 
        map.on("layers-add-result", function (results) {
            var barrierLayer;
                

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

                if (layer.name === "OWRI Project Point Features") {               
                    var renderer = UniqueRenderer(fp_symbol);
                    layer.setRenderer(renderer);
                }

                dojo.connect(layer, "onClick", function (evt) {
                    //add delete for option for barrier layer
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
                        if (map.infoWindow.isShowing) {
                            map.infoWindow.hide();
                        }
                       
                        var layerInfos = [{
                            'featureLayer': layer,
                            'isEditable': false,
                            'showDeleteButton': false
                        }];
                        
                        switch (layer.name) {
                            case "Fish Passage Barriers":

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
                                ];

                                break;
                            default:                                
                                break;
                        }                       

                        //store the current feature
                        updateFeature = evt.graphic;

                        var attInspector = new esri.dijit.AttributeInspector({
                            layerInfos: layerInfos
                        }, dojo.create("div"));

                        var selectionSymbol = new SimpleMarkerSymbol().setColor(new Color([255, 255, 0, 0.5]));
                        var noSelectionSymbol = new SimpleMarkerSymbol({
                            "color": [255, 255, 255, 0],
                            "size": 0
                        });


                        query.objectIds = [evt.graphic.attributes.objectid !== undefined ? evt.graphic.attributes.objectid : evt.graphic.attributes.OBJECTID];
                        layer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
                            map.infoWindow.setTitle(layer.name);
                            map.infoWindow.setContent(attInspector.domNode);
                            map.infoWindow.resize(400, 400);
                            map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
                            //featureClick = true;

                            //if (activeStep === 3 && features[0].getLayer().name === barriersLayerName) {
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

                });

                
                if (layer.name === "Fish Passage Barriers") {

                    dojo.connect(layer, "onBeforeApplyEdits", function (adds,updates,deletes) {
                        dijit.byId("undo").set("disabled", true);
                        dijit.byId("redo").set("disabled", true);
                        dojo.forEach(adds, function (add) {
                            //the map is in web mercator but display coordinates in geographic (lat, long)
                            var mp = webMercatorUtils.webMercatorToGeographic(add.geometry);
                            currentDate = new Date();
                            var display_date = currentDate.getFullYear() + "" + ((currentDate.getMonth() + 1) > 9 ? (currentDate.getMonth() + 1) : "0" + (currentDate.getMonth() + 1)) + "" + ((currentDate.getDate() > 9 ? currentDate.getDate() : "0" + currentDate.getDate()));
                            add.attributes['fpbLat'] = mp.y.toFixed(5);
                            add.attributes['fpbLong'] = mp.x.toFixed(5);
                            add.attributes['fpbRevDt'] = display_date;
                            add.attributes['fpbONm'] = 'OWEB';
                            add.attributes['fpbLocMd'] = 'DigDerive';
                            add.attributes['fpbLocAccu'] = 50;
                            add.attributes['fpbLocDt'] = display_date;
                        });
                    });

                    dojo.connect(layer, "onEditsComplete", function (adds, updates, deletes) {
                        drawToolbar.deactivate();
                        //display attribute inspector for newly created features
                        if (adds.length > 0) {
                            var query = new esri.tasks.Query();
                            query.objectIds = [adds[0].objectId];
                            barriers.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
                                if (features.length > 0) {
                                    var screenPoint = map.toScreen(features[0].geometry);
                                    //display the attribute window for newly created features
                                    map.infoWindow.setTitle("New Barrier");
                                    map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));
                                }
                                else {
                                    map.infoWindow.hide();
                                }
                            });
                        }
                        if (deletes.length > 0) {
                            var operation = new esri.dijit.editing.Delete({
                                featureLayer: layer,
                                deletedGraphics: [feature]
                            });

                            undoManager.add(operation);
                            checkUI();
                            //hide the info window if features are deleted.
                            map.infoWindow.hide();
                        }
                        checkUI();
                    });
                }
            });
            
            //get just the barriers layer for template picker
            //var barrierLayer = dojo.filter(layers, function (layer) {
            //    return layer.name === barriersLayerName;
            //});
            
            addLegend(results);

            templatePicker = new esri.dijit.editing.TemplatePicker({
                featureLayers: [barriers],//barrierLayer,
                rows: 'auto',
                columns: 3,
                grouping: true
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
            map.enableSnapping({
                snapPointSymbol: symbol,
                tolerance: 20,
                snapKey: keys.SHIFT
            });

           // myEditor.startup();

            //once loaded hide overlay and set step display
            dojo.query(".step-wrapper-overlay").style("display", "none");            
            gotoStep(1);                       
           
            drawToolbar = new esri.toolbars.Draw(map);

            
            //when users select an item from the template picker activate the draw toolbar
            //with the geometry type of the selected template item.
            dojo.connect(templatePicker, "onSelectionChange", function (evt) {
                selectedTemplate = templatePicker.getSelected();
                //if (templatePicker.getSelected()) {
                //    selectedTemplate = templatePicker.getSelected();
                //}
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
                                    { 'fieldName': 'fpbRevDt', 'isEditable': false, 'label': 'Entry/Revision Date' },
                                    { 'fieldName': 'fpbONm', 'isEditable': false, 'label': 'Originator Name' },
                                    { 'fieldName': 'fpbLocMd', 'isEditable': false, 'label': 'Location Method' },
                                    { 'fieldName': 'fpbFtrTy', 'label': 'Feature Type' },
                                    { 'fieldName': 'fpbFtrNm', 'label': 'Feature Name' },
                                    { 'fieldName': 'fpbFPasSta', 'label': 'Passage Status' },
                                    { 'fieldName': 'fpbStaEvMd', 'label': 'Passage Eval Method' },
                                    { 'fieldName': 'fpbStrNm', 'label': 'Stream Name' },
                                    { 'fieldName': 'fpbRdNm', 'label': 'Road Name' },
                                    { 'fieldName': 'fpbFtrSTy', 'label': 'Barrier Subtype' },
                                    { 'fieldName': 'fpbOwn', 'label': 'Owner' },
                                    { 'fieldName': 'fpbComment', 'label': 'Comment' },
                    ]
                }];

                var attInspector = new esri.dijit.AttributeInspector({
                    layerInfos: layerInfos
                }, dojo.create("div"));

                ////add a save button next to the delete button
                var saveButton = new Button({ label: "Save", "class": "saveButton" }, domConstruct.create("div"));

                domConstruct.place(saveButton.domNode, attInspector.deleteBtn.domNode, "after");

                saveButton.on("click", function () {
                    updateFeature.getLayer().applyEdits(null, [updateFeature], null);
                    map.infoWindow.hide();
                    drawToolbar.deactivate();
                });

                selectedTemplate.featureLayer.applyEdits([newGraphic], null, null, function () {
                    var screenPoint = map.toScreen(getInfoWindowPositionPoint(newGraphic));

                    drawToolbar.deactivate();

                    map.infoWindow.setContent(attInspector.domNode);
                    map.infoWindow.resize(325, 385);
                    map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));

                    templatePicker.clearSelection();                   

                    var operation = new esri.dijit.editing.Add({
                        featureLayer: newGraphic.getLayer(),
                        addedGraphics: [newGraphic]
                    });

                    undoManager.add(operation);

                    checkUI();
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
               
            });

            
            //map.infoWindow.setContent(attInspector.domNode);
            //map.infoWindow.resize(350, 440);


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

            //var spotlight = map.on("extent-change", function (extentChange) {
            //    var geom = screenUtils.toScreenGeometry(map.extent, map.width, map.height, extentChange.extent);
            //    var width = geom.xmax - geom.xmin;
            //    var height = geom.ymin - geom.ymax;

            //    var max = height;
            //    if (width > height) {
            //        max = width;
            //    }

            //    var margin = '-' + Math.floor(max / 2) + 'px 0 0 -' + Math.floor(max / 2) + 'px';

            //    query(".spotlight").addClass("spotlight-active").style({
            //        width: max + "px",
            //        height: max + "px",
            //        margin: margin
            //    });
            //    spotlight.remove();
            //});
        }

        function enableSpotlight() {
            var html = "<div id='spotlight' class='spotlight'></div>"
            domConstruct.place(html, dom.byId("map_container"), "first");
        }

        function removeSpotlight() {
            //query(".spotlight").removeClass("spotlight-active");
            map.infoWindow.hide();
            map.graphics.clear();
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