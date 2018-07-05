/* global simulator_parameters, PolyK */

'use strict';

/**
 * @author Robin Nicolay <robin.nicolay@uni-rostock.de>
 */

/**
 * ------------------------------
 * FUNCTIONS, CONTROLLER, MODEL
 * ------------------------------
 */

/**
 * Tank is the visualisation component of the simulator.
 *
 * Tank provides different canvas elements.
 *  visible_canvas  is visible canvas. Should not be used directly. It is updated on Tank.flush() with content of scratch_canvas and image_canvas
 *  scratch_canvas  is a non visible canvas element. Is used during single paint processes. Its content is transfered to visible_canvas on Tank.flush()
 *  image_canvas    is a non visible canvas element. Is used during single paint operations by user and image loading processes.
 *                  Its content is transfered to visible_canvas on Tank.flush() as top layer
 *
 * @type {{visible_canvas: null, visible_canvas_ctx: null, width: number, height: number, autoSize: boolean, scratch_canvas: null, scratch_canvas_ctx: null, image_canvas: null, image_canvas_ctx: null, image_cache: {}, init: Tank.init, displayEntity: Tank.displayEntity, displayPolygon: Tank.displayPolygon, images_loading: number, displayImage: Tank.displayImage, flush_requested: boolean, flush: Tank.flush}}
 * @namespace
 */
var Tank = {

    visible_canvas: null,
    visible_canvas_ctx : null,
    scratch_canvas: null,
    scratch_canvas_ctx: null,
    image_canvas: null,
    image_canvas_ctx: null,
    image_cache : {},

    width: 1000,
    height: 750,

    showCoords : true,
    showImages : true,
    showColors : true,
    showPerceptions : true,
    enabled: true,

    /**
     * Called on page ready. Initializes Tank's properties and canvas objects
     */
    init: function(){

        if (simulator_parameters['tank']){
            if (simulator_parameters['tank']['background_image'])
                Tank.setBackground(simulator_parameters['tank']['background_image']);
            if (simulator_parameters['tank']['width'])
                Tank.width = simulator_parameters['tank']['width'];
            if (simulator_parameters['tank']['height'])
                Tank.height = simulator_parameters['tank']['height'];
            if (simulator_parameters['tank']['auto_size']){
                Tank.width = Math.round($('#tank').width());
                Tank.height = Math.round($('#tank').height());
                Log.debug('Tank sized automatically');
            }
            if (simulator_parameters['tank']['disable']){
                Tank.enabled = false;
                ControlPanel.setVisDisabled(true);
                Log.info('Tank disabled in properties.js!');
            }
        };

        Tank.visible_canvas = $('#bobbeltank')[0];
        Tank.visible_canvas.width = Tank.width;
        Tank.visible_canvas.height = Tank.height;
        Tank.visible_canvas_ctx = Tank.visible_canvas.getContext('2d');
        //Tank.visible_canvas_ctx.transform(1, 0, 0, -1, 0, Tank.height); change this line to reverse Y-Axis

        // Setup scratch canvas.
        // This is the canvas for perception-polygons etc. These are painted automatically flushed to the end to visible canvas
        Tank.scratch_canvas = $('<canvas/>')[0];
        Tank.scratch_canvas.width = Tank.width;
        Tank.scratch_canvas.height = Tank.height;
        Tank.scratch_canvas_ctx = Tank.scratch_canvas.getContext('2d');

        // Setup image and user canvas.
        // This is the canvas where images and user output are painted on and transferred then to visible canvas
        Tank.image_canvas = $('<canvas/>')[0];
        Tank.image_canvas.width = Tank.width;
        Tank.image_canvas.height = Tank.height;
        Tank.image_canvas_ctx = Tank.image_canvas.getContext('2d');

        Log.debug('Tank of size ' + Tank.visible_canvas.width + 'x' + Tank.visible_canvas.height + ' ready');
    },

    /**
     * Prints a complete entity with perceptions, color and image to canvas (if not prevented by Tank.show... properties)
     * Prints to scratch_canvas (to be visible Tank.flush() has to be performed)
     * @param entity an entity object
     */
    displayEntity: function(entity) {
        if (!Tank.enabled) return;

        var posX = entity.posX;
        var posY = entity.posY;
        if (posX === undefined || posY === undefined) {
            Log.debug("Skipping displaying incomplete entity\n" + entity, 30, entity.name);
            return;
        }

        if (Tank.showPerceptions) {
            for (var sensorTag in entity.sensor_polygons){
                Tank.displayPolygon(entity.sensor_polygons[sensorTag], entity.sensor_colors[sensorTag]);
            }
        }

        if (Tank.showColors && entity.color){
            Tank.displayColorRing(entity.color, posX, posY);
        }

        if (Tank.showImages) {
            Tank.displayImage(entity.image_src, posX, posY, 20, 20);
        }
    },

    /**
     * Prints a Edge to canvas (if not prevented by Tank.show... properties)
     * Prints to scratch_canvas (to be visible Tank.flush() has to be performed)
     * @param start Start point [x,y]
     * @param end End point [x,y]
     * @param color fill color
     */
    displayEdge: function(start, end, color){
        if (!Tank.enabled) return;
        if (!color) return;

        var ctx = Tank.scratch_canvas_ctx;
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0],end[1]);
        ctx.lineWidth = 7;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();

    },

    /**
     * Prints a sensor- (or normal) Polygon to canvas (if not prevented by Tank.show... properties)
     * Prints to scratch_canvas (to be visible Tank.flush() has to be performed)
     * @param sensorPolygon Polygon list of points [[x,y], [x,y], [x,y], ... ]
     * @param color fill color
     */
    displayPolygon: function(sensorPolygon, color){
        if (!Tank.enabled) return;
        if (!color) return;

        var ctx = Tank.scratch_canvas_ctx;
        ctx.beginPath();
        ctx.fillStyle = color;

        if (!sensorPolygon.length) {
            Log.error('Can not paint invalid sensorPolygon');
            return;
        }
        var lastCoord = sensorPolygon.slice(-1)[0];
        ctx.moveTo(lastCoord[0], lastCoord[1]);
        for (var i in sensorPolygon){
            ctx.lineTo(sensorPolygon[i][0],sensorPolygon[i][1]);
        }
        ctx.fill();
        ctx.closePath();

    },

    /**
     * Prints a colored circle (used to highlight entities) at given position to canvas (if not prevented by Tank.show... properties)
     * Prints to scratch_canvas (to be visible Tank.flush() has to be performed)
     * @param color colorcode
     * @param posX x-pos
     * @param posY y-pos
     * @param radius radius of circle in px
     */
    displayColorRing: function(color, posX, posY, radius) {
        var ctx = Tank.image_canvas_ctx;
        ctx.beginPath();
        ctx.arc(posX, posY, radius|10, 0, 2*Math.PI, false);
        ctx.lineWidth = 7;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    },

    images_loading: 0,
    /**
     * Adds image with specified source path to image_canvas.
     * For better performance image data is cached in Tank.image_cache
     * If images are loading (can happen delayed) the Tank.flush() is redirected to finished image loading
     * @param source path to image
     * @param posX position of image
     * @param posY position of image
     * @param sizeX size in pixel of image
     * @param sizeY size in pixel of image
     */
    displayImage: function(source, posX, posY, sizeX, sizeY){
        if (!Tank.enabled) return;

        Tank.images_loading++;

        if (Tank.image_cache[source]){
            Tank.image_canvas_ctx.drawImage(Tank.image_cache[source], posX-Math.round(sizeX/2), posY-Math.round(sizeY/2), sizeX, sizeY);
            Tank.images_loading--;
            if (Tank.flush_requested) Tank.flush();
        } else {
            var image = new Image();
            image.onload = function() {
                Tank.image_canvas_ctx.drawImage(image, posX-10, posY-10, sizeX, sizeY);
                Tank.image_cache[source] = image;
                Tank.images_loading--;
                if (Tank.flush_requested) Tank.flush();
            };
            image.src = source;
        }
    },

    /**
     * Displays coords on visible canvas corners.
     * Is called during Tank.flush automatically during cleanup if not prevented by Tank.show.. properties
     */
    displayCoords : function(){
        if (Tank.showCoords) {
            var ctx = Tank.visible_canvas_ctx;
            ctx.font = "15px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "left";
            ctx.fillText("X0, Y0", 10, 20);
            ctx.fillText("X0, Y" + Tank.height, 10, Tank.height-15);
            ctx.textAlign = "right";
            ctx.fillText("X"+ Tank.width +", Y0", Tank.width-10, 20);
            ctx.fillText("X"+ Tank.width +", Y"+ Tank.height, Tank.width-10, Tank.height-15);
        }
    },

    flush_requested: false,
    /**
     * A flush performs following tasks (can be delayed if still images are loading)
     * Cleans visible canvas
     * Transfers content from image- and scretch- canvas to visible canvas
     * Cleans image- and scratch- canvas to be ready for new content
     *
     * !Important make sure you request flush() only if you are done painting on scratch- and image-canvas (ex. end of complete simulation step)
     * All content beeing on visible canvas will be removed before flush. All content on scratch- and image-canvas will be removed after flush
     */
    flush: function(){
        if (!Tank.enabled
            || (!Tank.showCoords && !Tank.showImages && !Tank.showColors && !Tank.showPerceptions))
            return;

        Tank.flush_requested = true;
        if (!Tank.images_loading) {
            Tank.visible_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.visible_canvas_ctx.beginPath();
            Tank.visible_canvas_ctx.globalAlpha = 0.8;
            Tank.visible_canvas_ctx.drawImage(Tank.scratch_canvas, 0, 0);
            Tank.visible_canvas_ctx.globalAlpha = 1;
            Tank.displayCoords();
            Tank.scratch_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.scratch_canvas_ctx.beginPath();
            Tank.visible_canvas_ctx.drawImage(Tank.image_canvas, 0, 0);
            Tank.image_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.image_canvas_ctx.beginPath();
            Tank.flush_requested = false;
        }
    },

    /**
     * Sets tank background to given path
     * @param path
     */
    setBackground: function(path) {
        $('#tank')
            .css("background", "url("+path+") no-repeat center center")
            .css("-webkit-background-size", "cover")
            .css("-moz-background-size", "cover")
            .css("-o-background-size", "cover")
            .css("background-size","cover");
        Log.debug("Changed tank's background to " + path);
    }
};

/**
 * Simulator is the runner component. It handles action invervalls, start, stop and performs simulation steps
 * @type {{__interval_ref: null, __interval_ms: number, __step_count: number, init: Simulator.init, setInterval: Simulator.setInterval, stop: Simulator.stop, performStep: Simulator.performStep, getPerceivedEntities: Simulator.getPerceptions}}
 * @namespace
 */
var Simulator = {

    __interval_ref: null,   // active interval instance is placed here
    __interval_ms: 500,     // currently set milliseconds between steps
    __step_count: 0,        // current step count
    __busy: false,          // simulator busy step. prevents new interval execution if still busy
	__last_marko: -1000,	// last time marko was shouted

    init : function(){
        Log.debug('Simulator ready');
        Simulator.__busy = false;
    },

    /**
     * Sets simulation to perform a simulation step all timespan milliseconds
     * @param timespan time between simulation steps in ms
     */
    setInterval : function(timespan){
        Simulator.stop();
        Simulator.__interval_ref = setInterval(Simulator.performStep, timespan);
        Simulator.__interval_ms = timespan;
        Log.debug('Simulator interval changed to ' + Simulator.__interval_ms + 'ms', 5, 'simulator_speed_update');
    },

    /**
     * Stops simulation interval (pause no reset)
     */
    stop : function(){
        if (Simulator.__interval_ref) clearInterval(Simulator.__interval_ref);
        Simulator.__interval_ref = null;
        Simulator.__interval_ms = -1;
        Simulator.__busy = false;
    },

    /**
     * ****************************************
     * ******************************************
     * Performs a single simulation step and calls user functions in bobbeltank.js
     * ******************************************
     * ****************************************
     */
    performStep: function(){

        if (Simulator.__busy) return;
        Simulator.__busy = true;

        // display content from previous step
        var edges_list = EdgeCollection.getEdges();
        for (var index in edges_list) {
            var perimeter = edges_list[index].perimeter;
            var color = edges_list[index].color;
            Tank.displayEdge(perimeter[0], perimeter[1] , color);
        }

        var entities = EntityCollection.getEntities(); //list of all entities [{entityObj1},{entityObj2},...]
        for (var index in entities)
            Tank.displayEntity(entities[index]);

        var begin = new Date();
        // perform initialization
        perform_simulation_step_initialization(entities, Simulator.__step_count);

        // simulation step for every single entity...
        for (var entity_i in entities){
            var entity = entities[entity_i];
            var coordinates = EntityCollection.getPositions().concat(EdgeCollection.getEndpoints());
            var perceivableObjects = EntityCollection.getEntities().concat(EdgeCollection.getEdges());
            var perceptions = entity.getPerceptions(coordinates, perceivableObjects);

            perform_simulation_step_on_entity(entity, perceptions, Simulator.__step_count);
        }

        var end = new Date();
        // cleanup
        perform_simulation_step_finalization(entities, Simulator.__step_count, end.getTime() - begin.getTime());

        Tank.flush();

        Simulator.__step_count++;
        Simulator.__busy = false;
    }
};

/**
 * Handles user input with web controls
 * @type {{init: ControlPanel.init, setVisDisabled: ControlPanel.setVisDisabled}}
 * @namespace
 */
var ControlPanel = {

    init: function(){

        $('#simulationSpeed')[0].oninput = function() {
            Simulator.setInterval(this.value);
            $('#controlpanel_slider_speed').text(this.value/1000);
        };
        $('#controlpanel_slider_speed').text($('#simulationSpeed')[0].value/1000);

        $('#start_btn').click(function(){
            Simulator.setInterval($('#simulationSpeed')[0].value);
        });

        $('#pause_btn').click(function(){
            Simulator.stop();
        });

        $('#restart_btn').click(function(){
            Simulator.stop();
            Simulator.__step_count = 0;
			Simulator.__last_marko = -1000;
            load_bobbel_data();
        });

        $('#disableAllCheck').change(function(){
            Tank.enabled = !$(this).is(":checked");
        });

        $('#displayCoordsCheck').change(function(){
            Tank.showCoords = $(this).is(":checked");
        });
        $('#displayColorsCheck').change(function(){
            Tank.showColors = $(this).is(":checked");
        });
        $('#displayImagesCheck').change(function(){
            Tank.showImages = $(this).is(":checked");
        });
        $('#displayPerceptionsCheck').change(function(){
            Tank.showPerceptions = $(this).is(":checked");
        });
    },

    /**
     * Sets user controls to disabled visualisation
     * @param disabled
     */
    setVisDisabled: function(disabled){
        $('#disableAllCheck').prop('checked', disabled);
        $('#displayCoordsCheck').prop('checked', !disabled);
        $('#displayColorsCheck').prop('checked', !disabled);
        $('#displayImagesCheck').prop('checked', !disabled);
        $('#displayPerceptionsCheck').prop('checked', !disabled);
    }
};


/**
 * Logging object. Provides logging output in web app.
 * @type {{hide_debug: boolean, oldLog: null, init: Log.init, info: Log.info, debug: Log.debug, error: Log.error, __addEntry: Log.__addEntry}}
 * @namespace
 */
var Log = {

    show_debug: true,
    show_info: true,
    oldLog: null,

    /**
     * Initializes application log. Redirects console.log to web page
     * (do not use console.log anymore. Use Log.debug, Log.info or Log.error instead)
     */
    init: function(){

        if (simulator_parameters['log'] && simulator_parameters['log']['level'])
            Log.setLogLevel(simulator_parameters['log']['level']);

        Log.oldLog = console.log;

        console.log = function (message) {
            Log.debug(message);
            Log.oldLog.apply(console, arguments);
        };

        window.onerror = function(message, source, lineno, colno, error){
            Log.error('In line ' + lineno + ' of ' + (source.replace(/^.*[\\\/]/, '')) + '\n -> ' + error + '\n -> (' + message + ')', 60);
        };

        console.log('Redirected console.log to Log.debug');

    },

    /**
     * Sets log levels
     * debug shows all messages
     * info hides debug messages
     * error hides debug and info messages. error are displayed only
     * @param logLevel can be debug, info or error
     */
    setLogLevel: function(logLevel) {

        switch (logLevel) {
            case 'debug': {
                Log.show_debug = true;
                Log.show_info = true;
                Log.debug('Setting log level to debug');
            }; break;
            case 'info': {
                Log.show_debug = false;
                Log.show_info = true;
                Log.info('Setting log level to info');
            }; break;
            case 'error': {
                Log.show_debug = false;
                Log.show_info = false;
            }; break;
            default : Log.error('Invalid parameter for log level. Use info, debug or error');
        }
    },

    /**
     * Adds message of level info to log
     * @param message log message
     * @param time display time in seconds
     * @param tag a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates)
     */
    info: function(message, time, tag){
        if (Log.show_info) Log.__addEntry('<strong>[Info]</strong> ' + message, time, tag);
    },

    /**
     * Adds message of level debug to log
     * @param message log message
     * @param time display time in seconds
     * @param tag a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates)
     */
    debug: function(message, time, tag){
        if (Log.show_debug) Log.__addEntry('<strong>[Debug]</strong> ' + message, time, tag);
    },

    /**
     * Adds message of level error to log
     * @param message log message
     * @param time display time in seconds
     * @param tag a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates)
     */
    error: function(message, time, tag){
        Log.__addEntry('<strong style="color:red;">[ERROR] ' + message + '</strong>', time, tag);
    },

    /**
     * Adds new textelement as entry to log. (Is used by info, debug and error function)
     * @param message message string of log entry
     * @param time display time in seconds
     * @param tag a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates)
     * @private
     */
    __addEntry: function(message, time, tag) {

        var d = new Date();
        message =
            '[' + ("0" + d.getHours()).slice(-2) +
            ':' + ("0" + d.getMinutes()).slice(-2) +
            ':' + ("0" + d.getSeconds()).slice(-2) +
            '] ' + message ;

        var logEntry = $('<div/>');
        logEntry.html(message.replace(/(\r\n|\n\r|\r|\n)/g,'<br>'));
        logEntry.addClass('log-entry');

        if (tag) {
            tag = tag.replace(/\s/g, "");
            logEntry.addClass('logEntryTag_'+tag);
            $(".logEntryTag_"+tag).remove();
        }

        $('#controlpanel_log').prepend(logEntry);

        //removes log entry after 'time' seconds
        if (!time) time = 15000;
        else time *= 1000;

        setTimeout(function(){
            logEntry.fadeOut(2000, function(){logEntry.remove();});
        }, time);
    }
};


/**
 * Handles all edges and obstacles
 */
var EdgeCollection = {

    __edges: [],

    setEdges: function(input_edges) {
        EdgeCollection.__edges = [];

        if (!input_edges.length) {
            Log.debug("Updated edge list to empty list");
        }

        for (var i in input_edges) {
            EdgeCollection.addEdge(input_edges[i]);
        }
        Log.debug('Cleared simulator edge list and added ' + EdgeCollection.__edges.length + ' new edge elements');
    },

    addEdge: function(input_edge) {
        if (!input_edge['perimeter'] || !input_edge['perimeter'].length === 2) {
            Log.error("Invalid edge perimeter for " + input_edge.name + " must be length 2 with [[x1, y1],[x2, y2]]");
            return;
        }
        EdgeCollection.__edges.push(new Edge(input_edge['name'], input_edge['perimeter'], input_edge['color']));
    },

    removeEdgeAtIndex: function(index){
        if (index > -1) {
            EdgeCollection.__edges.splice(index, 1);
        }
    },

    getEndpoints: function() {
        var positions = [];
        for (var i in EdgeCollection.__edges) {
            var edgeObj = EdgeCollection.__edges[i];
            positions.push(EdgeCollection.__edges[i].perimeter);
        }
        return positions;
    },

    getEdges: function() {
        return EdgeCollection.__edges;
    }
};

/**
 * Handles all Entities in the system. Some kind of entity database where the bobbels live
 * @type {{__entities: Array, setEntities: EntityCollection.setEntities, getEntities: (function(): Array), getEntityByUUID: (function(*): *)}}
 * @namespace
 */
var EntityCollection = {

    __entities: [],

    /**
     * Adds entities and sensor information as defined in properties.js to data model
     * Generates an instance of Entity.class for every entity in properties.js
     * @param input_entities list of Entities as defined in properties.js
     * @param sensors sensor-object as defined in properties.js
     */
    setEntities: function(input_entities, sensors){
        EntityCollection.__entities = [];

        if (!input_entities.length) {
            Log.debug("Updated entity list to empty list");
        }

        for (var i in input_entities) {
            EntityCollection.addEntity(input_entities[i], sensors);
        }

        Log.debug('Cleared simulator entity list and added ' + input_entities.length + ' new entities');
        if (simulator_parameters['entities'] && simulator_parameters['entities']['limit_movement_to_tank_boundaries'])
            EntityCollection.setMovementBounds(0, 0, Tank.width, Tank.height);
    },

    /**
     * Adds a single entity to the end of the EntitiesCollection list. Additionally (!) returns a reference to Entity-Object
     * @param input_entity single input entry as defined in properties.js
     * @param sensors sensor definition as defined in properties.js
     * @returns {Entity} additionally returns this reference. Entity is already added
     */
    addEntity: function(input_entity, sensors) {

        // if position not set use random
        if (simulator_parameters['entities']
            && simulator_parameters['entities']['set_position_randomly_if_undefined']
            && !input_entity['position']) {
            var rand_pos = [Math.floor(Math.random() * Tank.width) + 0, Math.floor(Math.random() * Tank.height) + 0];
            Log.debug('(Placed ' + input_entity['name'] + ' at [' + rand_pos + '])', 5);
            input_entity['position'] = rand_pos;
        }

        // if direction not set use random
        if (simulator_parameters['entities']
            && simulator_parameters['entities']['set_direction_randomly_if_undefined']
            && input_entity['direction'] === undefined) {
            var rand_direct = Math.floor(Math.random() * 360) + 0;
            Log.debug('(Rotated ' + input_entity['name'] + ' to ' + rand_direct + '°)', 5);
            input_entity['direction'] = rand_direct;
        }

        var entity = new Entity(input_entity, sensors);

        if (simulator_parameters['entities']
            && simulator_parameters['entities']['limit_movement_to_tank_boundaries'])
            entity.setMovementBounds(0, 0, Tank.width, Tank.height);

        EntityCollection.__entities.push(entity);
        Log.debug("Adding " + entity, 5);
        return entity;
    },

    /**
     * Removes Entity from List with index
     * @param index
     */
    removeEntityAtIndex: function(index){
        if (index > -1) {
            EntityCollection.__entities.splice(index, 1);
        }
    },

    /**
     * Removes Entity having this uuid
     * @param uuid
     * @returns {*}
     */
    removeEntityWithUUID: function(uuid) {
        for (var index in EntityCollection.__entities)
            if (EntityCollection.__entities[index]['uuid'] === uuid)
                EntityCollection.__entities.splice(index, 1);
    },

    /**
     * Transfers movement boundaries (such as tank size) into all entities
     * @param minX boundary position
     * @param minY boundary position
     * @param maxX boundary position
     * @param maxY boundary position
     */
    setMovementBounds: function(minX, minY, maxX, maxY) {
        Log.debug('Restricting movement to X:' + minX + '-' + maxX + ' Y:' + minY + '-' + maxY);
        for (var i in EntityCollection.__entities){
            EntityCollection.__entities[i].setMovementBounds(minX, minY, maxX, maxY);
        }
    },

    /**
     * Removes all boundaries from entities
     */
    clearMovementBounds: function() {
        Log.debug('Removing movement restrictions of entities');
        for (var i in EntityCollection.__entities){
            EntityCollection.__entities[i].clearMovementBounds();
        }
    },

    /**
     * Returns list of entity objects [{entity_1},{entity_2},{entity_3},...]
     * @returns {Array}
     */
    getEntities: function(){
        return EntityCollection.__entities;
    },

    /**
     * Returns list of positions for all entities [[x,y],[x,y],[x,y],...]
     * @returns {Array}
     */
    getPositions: function() {
        var positions = [];
        for (var i in EntityCollection.__entities) {
            positions.push([EntityCollection.__entities[i]['posX'], EntityCollection.__entities[i]['posY']]);
        }
        return positions;
    },

    /**
     * Helper function
     * @param index
     * @returns {*}
     */
    getEntityByIndex: function(index){
        return EntityCollection.__entities[index];
    },

    /**
     * If you need to get an entity by uuid
     * @param uuid
     * @returns {*}
     */
    getEntityByUUID: function(uuid) {
        for (var i in EntityCollection.__entities)
            if (EntityCollection.__entities[i]['uuid'] === uuid)
                return EntityCollection.__entities[i];
    }
};

/**
 * ------------------------------
 * CLASS DEFINITIONS
 * ------------------------------
 */

/**
 * Mini-Class definition of a edge containing properties name, perimeter and color
 * @param name string
 * @param perimeter array containing start and endpoint [[startX, startY][endY, endY]]
 * @param color color of edge (invisible if undefined)
 * @constructor
 */
function Edge(name, perimeter, color) {
    this.name = name;
    this.perimeter = perimeter;
    this.color = color;
}

/**
 /**
 * Entity Class description. Use var foo = new Entity(entity_object, sensors_object)
 * (To reference the entity use the unique ID instead of the name)
 * Entities properties are:
 *
 *              name:                   string name of an entity provided in properties.js
 *              img_src:                image path provided in properties.js
 *              color:                  color provided in properties.js
 *              posX:                   number with X-coordinate. If changed directly call entity.updateSensors() to update polygons
 *              posY:                   number with Y-coordinate. If changed directly call entity.updateSensors() to update polygons
 *              direction:              rotation of entity in degrees (0-360) 0 is along x-axis 90 along y-axis ... If changed directly call entity.updateSensors() to update polygons
 *              sensor_colors:          object providing sensor color for every sensor. Use entity.sensor_colors[<sensorname>]
 *              sensor_polygons:        object contains calculated sensor polygons around entity based on current position and direction Use entity.sensor_polygons[<sensorname>]
 *              sensor_range            defines maximum distance of sensor from entity position
 *              uuid:                   generated unique-id. Use to reference entity instead of name-property if you use same name for multiple entities
 *              movementRestricted:     true if entities movement is restricted into boundaries (tank for example). false else
 *              restrictedXmin          number if movement restricted. null else
 *              restrictedXmax          number if movement restricted. null else
 *              restrictedYmin          number if movement restricted. null else
 *              restrictedYmax          number if movement restricted. null else
 *              polyk_sensor_polygons:  same object as sensor_polygons but in other format needed by library PolyK
 *                                      PolyK is included in this project and helps with polygon-functions
 *                                      See (http://polyk.ivank.net/?p=documentation) for documentation
 *
 * @param entity_object is an single entity object from properties.js with keys name, image, position etc..
 * @param sensors_object
 * @constructor
 */
function Entity(entity_object, sensors_object) {
    this.name = entity_object['name'];
    this.image_src = entity_object['image'];
    this.movementRestricted = false;
    this.color = entity_object['color'];
    this.isCatcher = entity_object['isCatcher'];
    this.nodeOfInterest = [0, 0];		// current pos of the node, which affects the next movement, e.g. the catcher
    this.shouts = false;				// Signal the shouting to other entities

    this.hasShouted = false // Checks, whether the Entity already set the 'shout' attribute to 'true'
    //only sets position if input pos is array with length 2
    var pos = entity_object['position'];
    if (Array.isArray(pos) && pos.length === 2) {
        if (entity_object['isCatcher'] === true) {
            // If bobbel is choosen as catcher, position him approx. in the middle of the area.
            this.posX = 590;
            this.posY = 500;
            this.direction = entity_object['direction'] | 0;
        } else {
            this.posX = pos[0];
            this.posY = pos[1];
            this.direction = entity_object['direction'] | 0;
        }
    }

    //transfer definitions of attached sensors into entity (only if definitions exist)
    var perceptionTags = entity_object['perceptions'];
    this.__sensor_perimeters = {};
    this.__rotated_sensor_perimeters = {};
    this.sensor_colors = {};
    for (var tag_i in perceptionTags) {
        var tag = perceptionTags[tag_i];
        if (sensors_object[tag]){
            this.__sensor_perimeters[tag] = sensors_object[tag]['perimeter'];
            this.__rotated_sensor_perimeters[tag] = sensors_object[tag]['perimeter'];
            this.__rotated_sensor_direction = 0;
            if (entity_object['isCatcher'] === true && tag !== 'hear') {
                // If bobbel is choosen as catcher, mark his perceptions with specific color.
                this.sensor_colors[tag] = "red";
            } else {
                this.sensor_colors[tag] = sensors_object[tag]['color'];
            }
        }

    }
    this.sensor_polygons = {};
    this.polyk_sensor_polygons = {};
    this.updateSensors();

    //set unique ID
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    this.uuid = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

/**
 * Moves entity distance px along current direction
 * @param distance
 */
Entity.prototype.move = function(distance) {
    var newPos = Entity.__rotateAroundOrigin(this.posX + distance, this.posY, this.posX, this.posY, this.direction);

    if(this.movementRestricted) {
        var newPosX = newPos[0];
        var newPosY = newPos[1];

        this.posX = Math.max(this.restrictedXmin, Math.min(newPosX, this.restrictedXmax));
        this.posY = Math.max(this.restrictedYmin, Math.min(newPosY, this.restrictedYmax));

        if (this.posX !== newPosX || this.posY !== newPosY) {
            this.rotate(90);
        }
    } else {
        this.posX = newPos[0];
        this.posY = newPos[1];
    }

    this.updateSensors();
};

Entity.prototype.setPosNodeOfInterest = function(posX, posY) {
    this.nodeOfInterest = [posX, posY];
}

/**
 * Called by the catcher and, initially, by the other bobbels, too. Used to direct movement.
*/
Entity.prototype.estimateDirection = function(posX2, posY2, certainty) {
    var posX1 = this.posX;
    var posY1 = this.posY;

    return Math.asin((posY2-posY1)/Entity.__distanceBetweenTwoPoints(posX1, posY1, posX2, posY2));
}
Entity.prototype.roughPosition = function(posX, posY, marcoFactor, poloFactor){
    var factor = this.isCatcher ? marcoFactor : poloFactor;
    var sign = Math.random() > 0.5 ? 1 : -1;

    var est_posX = posX + sign * Math.random() * factor;
    var est_posY = posY + sign * Math.random() * factor;

    var pos = [est_posX, est_posY];
	return pos;
}/**

 * Called by the catcher and, initially, by the other bobbels, too. Used to get direction.
*/
Entity.prototype.getDirDelta = function() {
	var dir = this.estimateDirection(this.nodeOfInterest[0], this.nodeOfInterest[1], 20);
	var diff = Math.abs(dir - this.direction);

	if(this.isCatcher)
		return diff >= 180 ? (360 - diff) : -diff;
	else {
		dir = 180 + dir - this.direction;
		if (Math.abs(dir + 45) < Math.abs(dir + 45))
			dir += 45;
		else
			dir -= 45;
		return dir;
	}
}

/**
 * Used by the catcher to find next promising 'target'.
 * HINT: Already implemented by Marten,
*/
/* Entity.prototype.findClosestNode = function(entities) {
    var minDist = 3000; // Set arbitrary large start reference
    var posX1 = Entity.prototype.posX;
    var posY1 = Entity.prototype.posY;

    for (var entity in entities) {
        //
        var posX2 = entity.posX + Math.floor(Math.random() * 10);
        var posY2 = entity.posY + Math.floor(Math.random() * 10);

        // Estimating distance through hearing is not very precise
        var dist = Entity.__distanceBetweenTwoPoints(posX1, posY1, posX2, posY2)
                    + Math.floor(Math.random() * 20);

        if (dist < minDist) {
            minDist = dist;
        }
    }

    return [posX2, posY2];
} */

/**
 * Rotates entity degrees (0-360). Positive degrees rotates counterclockwise negative clockwise
 * @param degrees in deg 0-360
 */
Entity.prototype.rotate = function(degrees) {
    this.direction += degrees;
    while (this.direction>=360) {
        this.direction -= 360;
    }
    while (this.direction < 0) {
        this.direction += 360;
    }
    this.updateSensors();
};

/**
 * Restricts movement of entities to these coordinates. (Verified in move() and updateSensors() method)
 * @param minX
 * @param minY
 * @param maxX
 * @param maxY
 */
Entity.prototype.setMovementBounds = function(minX, minY, maxX, maxY) {
    this.movementRestricted = true;
    this.restrictedXmin = Math.round(minX);
    this.restrictedXmax = Math.round(maxX);
    this.restrictedYmin = Math.round(minY);
    this.restrictedYmax = Math.round(maxY);
};

Entity.prototype.clearMovementBounds = function() {
    this.movementRestricted = false;
    this.restrictedXmin = null;
    this.restrictedXmax = null;
    this.restrictedYmin = null;
    this.restrictedYmax = null;
};

/**
 * Updates entities sensor_polygons etc. according to position and direction properties
 */
Entity.prototype.updateSensors = function(){

    if (this.movementRestricted){
        this.posX = Math.max(this.restrictedXmin, Math.min(this.posX, this.restrictedXmax));
        this.posY = Math.max(this.restrictedYmin, Math.min(this.posY, this.restrictedYmax));
    }

    var posX = this.posX;
    var posY = this.posY;
    var direction = this.direction |0;
    var sensorDirection = this.__rotated_sensor_direction |0;
    var sensorRange = 0;

    for (var sensor in this.__sensor_perimeters){

        if (direction !== sensorDirection) {
            this.__rotated_sensor_perimeters[sensor] = this.__sensor_perimeters[sensor].map(function(polyEdge, index) {
                return Entity.__rotateAroundOrigin(polyEdge[0], polyEdge[1], 0, 0, direction);
            });
            this.__rotated_sensor_direction = direction;
        };

        var sensorPolygon = this.__rotated_sensor_perimeters[sensor].map(function(polyEdge, index){
            var sensorX = polyEdge[0]+posX;
            var sensorY = polyEdge[1]+posY;
            sensorRange = Math.max(Entity.__distanceBetweenTwoPoints(posX, posY, sensorX, sensorY), sensorRange);
            return [sensorX, sensorY]; //move to point
        });

        this.sensor_polygons[sensor] = sensorPolygon;
        this.sensor_range = sensorRange;

        var polyk_sensorPolygon = []; //stupid library requires another format
        for (var pos_i in sensorPolygon) {
            polyk_sensorPolygon.push(sensorPolygon[pos_i][0]);
            polyk_sensorPolygon.push(sensorPolygon[pos_i][1]);
        }
        this.polyk_sensor_polygons[sensor] = polyk_sensorPolygon;
    }
};

/**
 * Returns perceptions of Entitie's sensors.
 * It needs two lists with same length. Based on a list of perceivable positions it returns object with same index
 * If nothing is perceived returns null
 *
 * perceptions
 *
 *      {
 *          sensorname_1: [
 *              {
 *                  "type": // type of perceived object Entity-Object, Edge-Object etc.
 *                  "object": //reference to perceived object
 *                  "position" // position of perceived object (optional if Entity-Object)
 *                  "distance" // distance to perceived object (optional if Entity-Object)
 *                  "direction" // direction to perceived object (corresponding to own direction)  (optional if Entity-Object)
 *              }, {
 *                  ...
 *              },
 *              ...
 *          ],
 *          sensorname_2: [...],
 *          ...
 *      }
 *
 * @param {array} perceivable_positions_list list of perceivable positions
 * @param {array} perceivable_objects_list  list of objects at these positions
 * @returns {String}
 */
Entity.prototype.getPerceptions = function(perceivable_positions_list, perceivable_objects_list) {
    if (perceivable_positions_list.length !== perceivable_objects_list.length) {
        Log.error("Can not calculate perceptions for " + this.name + " \n" +
            "perceivable_positions_list must have same length as perceivable_objects_list \n" +
            "have " + perceivable_positions_list.length + " positions and " + perceivable_objects_list + " objects in EntityCollection");
        return null;
    }

    var sensor_polygons = this.sensor_polygons;
    var perceptions = {};

    for (var sensor_tag in sensor_polygons){
        var sensor_polygon = sensor_polygons[sensor_tag];
        for (var pos_i in perceivable_positions_list) {
            var position = perceivable_positions_list[pos_i];
            var isPoint = true;

            if (position.length === 2 && position.some(isNaN))
                isPoint = false;

            if (isPoint) {
                var perception = this.getPointPerception(position, sensor_polygon);
            } else {
                var perception = this.getEdgePerception(position[0], position[1], sensor_polygon);
            }

            if (perception) {
                if (!perceptions[sensor_tag])
                    perceptions[sensor_tag] = [];

                perception['object'] = perceivable_objects_list[pos_i];
                perceptions[sensor_tag].push(perception);
            }
        }
    }

    if (Object.keys(perceptions).length) {
        return perceptions;
    } else {
        return null;
    }
};

/**
 * Returns a perception if point in sensorpolygon. Null otherwise
 * @param position position of perceivable point
 * @param sensor_polygon Sensorpolygon
 * @returns {*} perception object
 */
Entity.prototype.getPointPerception = function(position, sensor_polygon) {

    if (position[0] === this.posX && position[1] === this.posY) {
        //skip self
    } else if (!this.isPointInSensorRange(position[0], position[1])) {
        //skip entities out of range
    } else if (Entity.__pointInPolygon(position[0], position[1], sensor_polygon)) {
        var perception = {
            type: 'Entity-Object',
            position: position,
            distance: Entity.__distanceBetweenTwoPoints(this.posX, this.posY, position[0], position[1]),
            direction: (this.direction - Entity.__angleBetweenPoints(this.posX, this.posY, position[0], position[1]))
        };
        return perception;
    }
    return null;
};

/**
 * Returns a perception if edge crosses sensor_polygon lines. Null otherwise
 * @param startPos start-position of edge
 * @param endPos end position of edge
 * @param sensor_polygon polygon describing sensor
 * @returns {*}
 */
Entity.prototype.getEdgePerception = function(startPos, endPos, sensor_polygon) {

    var edgePerceived = false;
    if (!this.isEdgeInSensorRange(startPos[0], startPos[1], endPos[0], endPos[1])) {
        //skip entities out of range
    } else {
        var intersectionPoints = [];

        if (Entity.__pointInPolygon(startPos[0], startPos[1], sensor_polygon) && Entity.__pointInPolygon(endPos[0], endPos[1], sensor_polygon)){
            edgePerceived = true;
        } else {
            for (var edge_index = 0; edge_index < sensor_polygon.length; edge_index++) {
                var next_edge_index = 0;
                if (edge_index < sensor_polygon.length-1)
                    next_edge_index = (1 + edge_index);
                var edge_start = sensor_polygon[edge_index];
                var edge_end = sensor_polygon[next_edge_index];
                if (Entity.__doEdgesIntersect(edge_start, edge_end, startPos, endPos)) {
                    edgePerceived = true;
                    var intersectionPos = Entity.__getIntersectionPoint(edge_start, edge_end, startPos, endPos);
                    if (intersectionPos) intersectionPoints.push(intersectionPos);
                }
            }
        }
    }

    if (edgePerceived) {
        var perception = {
            type: 'Edge-Object',
            sensor_intersections: intersectionPoints
        };
        return perception;
    }
    return null;
};

/**
 * Returns if point is in range of sensor (max distance between sensor points and entity)
 * @param pointX
 * @param pointY
 * @returns {boolean}
 */
Entity.prototype.isPointInSensorRange = function(pointX, pointY) {
    return Entity.__distanceBetweenTwoPoints(this.posX, this.posY, pointX, pointY) <= this.sensor_range;
};

/**
 * Returns if minimal distance to an edge is in range of sensor
 * @param startX start X of edge
 * @param startY start Y of edge
 * @param endX end X of edge
 * @param endY end Y of edge
 * @returns {boolean}
 */
Entity.prototype.isEdgeInSensorRange = function(startX, startY, endX, endY) {
    return Entity.__minDistPointToEdge(this.posX, this.posY, startX, startY, endX, endY) <= this.sensor_range;
};

/**
 * Overrides default string output for Entity class
 * @returns {string}
 */
Entity.prototype.toString = function(){
    return 'Entity-Obj: '
        + (this.name? this.name +'\n': '"name"-property missing!\n')
        + (this.color? '- color: '+this.color +'\n': '')
        + (this.posX && this.posY? '- position: [' + this.posX + ', ' + this.posY + ']' : ' invalid "position"-property [' + this.posX +', ' + this.posY + ']\n')
        + (this.direction !== undefined? ' (' + this.direction + '°)\n' : '\n')
        + (this.image_src? '': ' without "image"-property!\n')
        + (Object.keys(this.__sensor_perimeters).length? '- sensors: ['+Object.keys(this.__sensor_perimeters)+']': ' without any "perceptions" defined!');
};

/**
 * STATIC Helper function (not connected to any object directly)
 * Rotates point around an origin point for amount of degrees
 * @param pointX x coord for point to rotate
 * @param pointY y coord for point to rotate
 * @param originX origin point x
 * @param originY origin point y
 * @param angle angle in degrees (0-360)
 * @returns Coords of rotated point
 * @private
 */
Entity.__rotateAroundOrigin = function(pointX, pointY, originX, originY, angle){
    angle = angle * Math.PI / 180.0;
    return [Math.cos(angle) * (pointX-originX) - Math.sin(angle) * (pointY-originY) + originX,
        Math.sin(angle) * (pointX-originX) + Math.cos(angle) * (pointY-originY) + originY];
};

/**
 * Static Helper function
 * Calculates and returns distance between two points (pytagoras)
 * @param posX1
 * @param posY1
 * @param posX2
 * @param posY2
 * @returns {number}
 * @private
 */
Entity.__distanceBetweenTwoPoints = function(posX1, posY1, posX2, posY2) {
    var a = posX1 - posX2;
    var b = posY1 - posY2;
    return Math.sqrt( a*a + b*b );
};

/**
 * Static Helper function
 * Returns Angle between two points and x-Axis (similar to direction)
 * @param posX1
 * @param posY1
 * @param posX2
 * @param posY2
 * @returns {number} angle in degrees
 * @private
 */
Entity.__angleBetweenPoints = function(posX1, posY1, posX2, posY2) {
    return Math.atan2(posY2 - posY1, posX2 - posX1) * 180 / Math.PI;
};

/**
 * Determines if two lines cross each other
 * @param posA1 position of first line
 * @param posA2 position of first line
 * @param posB1 position of second line
 * @param posB2 position of second line
 * @returns {boolean}
 * @private
 */
Entity.__doEdgesIntersect = function(posA1, posA2, posB1, posB2) {
    var a = posA1[0];
    var b = posA1[1];
    var c = posA2[0];
    var d = posA2[1];
    var p = posB1[0];
    var q = posB1[1];
    var r = posB2[0];
    var s = posB2[1];

    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
};

/**
 * Returns intersection point between two lines. Null otherwise
 * @param edge1_start
 * @param edge1_end
 * @param edge2_start
 * @param edge2_end
 * @returns {*}
 * @private
 */
Entity.__getIntersectionPoint = function(edge1_start, edge1_end, edge2_start, edge2_end) {

    var denominator, a, b, numerator1, numerator2,

        denominator = ((edge2_end[1] - edge2_start[1]) * (edge1_end[0] - edge1_start[0])) - ((edge2_end[0] - edge2_start[0]) * (edge1_end[1] - edge1_start[1]));
    if (denominator == 0) {
        return null;
    }
    a = edge1_start[1] - edge2_start[1];
    b = edge1_start[0] - edge2_start[0];
    numerator1 = ((edge2_end[0] - edge2_start[0]) * a) - ((edge2_end[1] - edge2_start[1]) * b);
    numerator2 = ((edge1_end[0] - edge1_start[0]) * a) - ((edge1_end[1] - edge1_start[1]) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    if (a > 0 && a < 1 && b > 0 && b < 1)
        return [edge1_start[0] + (a * (edge1_end[0] - edge1_start[0])), edge1_start[1] + (a * (edge1_end[1] - edge1_start[1]))];
    else
        return null;
};

/**
 * Determines if a point is inside a polygon
 * @param posX
 * @param posY
 * @param polygonArray
 * @returns {boolean}
 * @private
 */
Entity.__pointInPolygon = function(posX, posY, polygonArray) {
    var x = posX, y = posY;
    var vs = polygonArray;

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

/**
 * Determines shortest distance between a line ad a point
 * (from https://unpkg.com/mathjs@4.4.1/dist/math.js)
 * @param pointX
 * @param pointY
 * @param startX
 * @param startY
 * @param endX
 * @param endY
 * @returns {number}
 * @private
 */
Entity.__minDistPointToEdge = function(pointX, pointY, startX, startY, endX, endY) {

    var parallelY = false;
    var interSectX = 0;
    var interSectY = 0;

    if(!(endX - startX)) { //parallel to y
        var result = Entity.__distanceBetweenTwoPoints(pointX, pointY, startX, pointY);
        interSectX = startX;
        interSectY = pointY;
        parallelY = true;
    } else if(!(endY - startY)){ // parallel to x
        var result =  Entity.__distanceBetweenTwoPoints(pointX, pointY, pointX, startY);
        interSectX = pointX;
        interSectY = startY;
    } else {
        var left, tg = -1 / ((endY - startY) / (endX - startX));
        interSectX = left = (endX * (pointX * tg - pointY + startY) + startX * (pointX * - tg + pointY - endY)) / (tg * (endX - startX) + startY - endY);
        interSectY = tg * left - tg * pointX + pointY
        var result = Entity.__distanceBetweenTwoPoints(pointX, pointY, interSectX, interSectY);
    }

    if (!parallelY && Math.min(startX, endX) <= interSectX && Math.max(startX, endX) >= interSectX)
        return result;
    else if (parallelY && Math.min(startY, endY) <= interSectY && Math.max(startY, endY) >= interSectY)
        return result;

    var distStart = Entity.__distanceBetweenTwoPoints(pointX, pointY, startX, startY);
    var distEnd = Entity.__distanceBetweenTwoPoints(pointX, pointY, endX, endY);
    return Math.min(distStart, distEnd);
};

function randomWalk() {

}

/**
 * End of class definitions
 */

/**
 * EntryPoint to core javascript if document loaded
 * Can be seen as "main-method"
 */
$('document').ready(function(){
    Log.init();
    Tank.init();
    Simulator.init();
    ControlPanel.init();

    load_bobbel_data();

    /* display edges and entities */
    var edges_list = EdgeCollection.getEdges();
    for (var index in edges_list) {
        var perimeter = edges_list[index].perimeter;
        var color = edges_list[index].color;
        Tank.displayEdge(perimeter[0], perimeter[1] , color);
    }

    var entities_list = EntityCollection.getEntities();
    for (var index in entities_list)
        Tank.displayEntity(entities_list[index]);


    Tank.flush();
});