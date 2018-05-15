'use strict';

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
 * @type {{visible_canvas: null, visible_canvas_ctx: null, width: number, height: number, autoSize: boolean, scratch_canvas: null, scratch_canvas_ctx: null, image_canvas: null, image_canvas_ctx: null, image_cache: {}, init: Tank.init, displayEntity: Tank.displayEntity, displayPerception: Tank.displayPerception, images_loading: number, displayImage: Tank.displayImage, flush_requested: boolean, flush: Tank.flush}}
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
                Tank.displayPerception(entity.sensor_polygons[sensorTag], entity.sensor_colors[sensorTag]);
            }
        }

        if (Tank.showColors && entity.color){
            Tank.displayEntityColor(entity.color, posX, posY);
        }

        if (Tank.showImages) {
            Tank.displayImage(entity.image_src, posX, posY, 20, 20);
        }
    },

    /**
     * Prints a sensor- (or normal) Polygon to canvas (if not prevented by Tank.show... properties)
     * Prints to scratch_canvas (to be visible Tank.flush() has to be performed)
     * @param sensorPolygon Polygon list of points [[x,y], [x,y], [x,y], ... ]
     * @param color fill color
     */
    displayPerception: function(sensorPolygon, color){
        if (!Tank.enabled) return;

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
    displayEntityColor: function(color, posX, posY, radius) {
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

    init : function(){
        Log.debug('Simulator ready');
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
    },

    /**
     * ****************************************
     * ******************************************
     * Performs a single simulation step and calls user functions in bobbeltank.js
     * ******************************************
     * ****************************************
     */
    performStep: function(){

        var begin = new Date();
        var entities = EntityCollection.getEntities(); //list of all entities [{entityObj1},{entityObj2},...]

        perform_simulation_step_initialization(entities, Simulator.__step_count);

        // simulation step for every single entity...
        for (var entity_i in entities){
            var entity = entities[entity_i];

            var perceptions = EntityCollection.getPerceivedEntities(
                [entity.posX, entity.posY],
                entity.polyk_sensor_polygons);

            perform_simulation_step_on_entity(entity, perceptions, Simulator.__step_count);

            Tank.displayEntity(entity);
        }

        var end = new Date();
        perform_simulation_step_finalization(entities, Simulator.__step_count, end.getTime() - begin.getTime());

        Tank.flush();
        Simulator.__step_count++;
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
        }

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
            logEntry.fadeOut(2000, function(){logEntry.remove()});
        }, time);
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

        if (input_entities.length) {

            var logMsg = 'Updated entity list to:';
            for (var i in input_entities) {
                var input_entity = input_entities[i];

                // if position not set use random
                if (simulator_parameters['entities']
                    && simulator_parameters['entities']['set_position_randomly_if_undefined']
                    && !input_entity['position']) {
                    var rand_pos = [Math.floor(Math.random() * Tank.width) + 0, Math.floor(Math.random() * Tank.height) + 0];
                    Log.debug('Placing ' + input_entity['name'] + ' at [' + rand_pos + ']');
                    input_entity['position'] = rand_pos;
                }

                // if direction not set use random
                if (simulator_parameters['entities']
                    && simulator_parameters['entities']['set_direction_randomly_if_undefined']
                    && !input_entity['direction']) {
                    var rand_direct = Math.floor(Math.random() * 360) + 0;
                    Log.debug('Rotating ' + input_entity['name'] + ' to ' + rand_direct + '°');
                    input_entity['direction'] = rand_direct;
                }

                var entity = new Entity(input_entities[i], sensors);
                logMsg += '\n' + entity;
                EntityCollection.__entities.push(entity);
                Tank.displayEntity(entity);
            }
            Log.debug(logMsg);
            Tank.flush();
        } else {
            Log.debug("Updated entity list to empty list");
        }

        if (simulator_parameters['entities'] && simulator_parameters['entities']['limit_movement_to_tank_boundaries'])
            EntityCollection.setMovementBounds(0, 0, Tank.width, Tank.height);
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
     * Gets set of perception polygons (have to be in wired polyk format provided by Entity-Object)
     *
     * polyk_polygons_object
     *      {
     *          sensorname_1: [polyk_coords],
     *          sensorname_2: [polyk_coords],
     *          sensorname_n: [polyk_coords]
     *      }
     *
     * @param own_pos position of Entity-Object itself. (Would perceive itself otherwise)
     * @param polyk_polygons_object sensor polygon in polyk format provided by Entity
     * @param perceivable_positions list of positions that can be perceived if inside sensor polygon
     * @returns {null} perceived object {sensorname_1: [list_of_perceived_entities],sensorname_2: [list_of_perceived_entities],..} or null if empty
     */
    getPerceivedEntities: function(own_pos, polyk_polygons_object) {
        var perceivable_positions = EntityCollection.getPositions()

        var perceptions = {};
        for (var sensor_tag in polyk_polygons_object){
            var polyk_polygon = polyk_polygons_object[sensor_tag];
            for (var pos_i in perceivable_positions) {
                var position = perceivable_positions[pos_i];
                if (position[0] === own_pos[0] && position[1] === own_pos[1])
                    continue; //skip self

                if (PolyK.ContainsPoint(polyk_polygon, position[0], position[1])){
                    var perceivedEntity = EntityCollection.getEntityByIndex(pos_i);
                    if (!perceptions[sensor_tag]){
                        perceptions[sensor_tag] = [];
                    }
                    perceptions[sensor_tag].push(perceivedEntity);
                }
            }
        }

        if (Object.keys(perceptions).length) {
            return perceptions;
        } else {
            return null;
        }
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

    //only sets position if input pos is array with length 2
    var pos = entity_object['position']
    if (Array.isArray(pos) && pos.length === 2) {
        this.posX = pos[0];
        this.posY = pos[1];
        this.direction = entity_object['direction'] | 0;
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
            this.sensor_colors[tag] = sensors_object[tag]['color'];
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
    } else {
        this.posX = newPos[0];
        this.posY = newPos[1];
    }

    this.updateSensors();
};

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
        this.posX = Math.max(this.restrictedXmin, Math.min(newPosX, this.restrictedXmax));
        this.posY = Math.max(this.restrictedYmin, Math.min(newPosY, this.restrictedYmax));
    }

    var posX = this.posX;
    var posY = this.posY;
    var direction = this.direction |0;
    var sensorDirection = this.__rotated_sensor_direction |0;

    for (var sensor in this.__sensor_perimeters){

        if (direction !== sensorDirection) {
            this.__rotated_sensor_perimeters[sensor] = this.__sensor_perimeters[sensor].map(function(polyEdge, index) {
                return Entity.__rotateAroundOrigin(polyEdge[0], polyEdge[1], 0, 0, direction);
            });
            this.__rotated_sensor_direction = direction;
        };

        var sensorPolygon = this.__rotated_sensor_perimeters[sensor].map(function(polyEdge, index){
            return [polyEdge[0]+posX, polyEdge[1]+posY]; //move to point
        });

        this.sensor_polygons[sensor] = sensorPolygon;

        var polyk_sensorPolygon = []; //stupid library requires another format
        for (var pos_i in sensorPolygon) {
            polyk_sensorPolygon.push(sensorPolygon[pos_i][0]);
            polyk_sensorPolygon.push(sensorPolygon[pos_i][1]);
        }
        this.polyk_sensor_polygons[sensor] = polyk_sensorPolygon;
    }
};

/**
 * Overrides default string output for Entity class
 * @returns {string}
 */
Entity.prototype.toString = function(){
    return '-> '
        + (this.name? this.name : '"name"-property missing!')
        + (this.color? ' ('+this.color+')': '')
        + (this.posX && this.posY? ' at pos [' + this.posX + ', ' + this.posY + ']' : ' invalid "position"-property [' + this.posX +', ' + this.posY + ']')
        + (this.direction? ' (' + this.direction + '°)' : '')
        + (this.image_src? '': ' without "image"-property!')
        + (Object.keys(this.__sensor_perimeters).length? ' with ['+Object.keys(this.__sensor_perimeters)+']': ' without any "perceptions" defined!');
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
        Math.sin(angle) * (pointX-originX) + Math.cos(angle) * (pointY-originY) + originY]
};







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
});