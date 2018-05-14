'use strict';

/**
 * ------------------------------
 * FUNCTIONS, CONTROLLER, MODEL
 * ------------------------------
 */

/**
 * Handles all Entities in the system
 * @type {{__entities: Array, setEntities: Entities.setEntities, getEntities: (function(): Array), getEntityByUUID: (function(*): *)}}
 */
var Entities = {

    __entities: [],

    setEntities: function(input_entities, sensors){
        Entities.__entities = [];

        if (input_entities.length) {

            var logMsg = 'Updated entity list to:';
            for (var i in input_entities) {
                var entity = new Entity(input_entities[i], sensors);
                logMsg += '\n' + entity;
                Entities.__entities.push(entity);
                Tank.displayEntity(entity, true, true);
            }
            Log.debug(logMsg);
            Tank.flush();
        } else {
            Log.debug("Updated entity list to empty list");
        }
    },

    setMovementBounds: function(minX, minY, maxX, maxY) {
        Log.debug('Restricting movement to X:' + minX + '-' + maxX + ' Y:' + minY + '-' + maxY);
        for (var i in Entities.__entities){
            Entities.__entities[i].setMovementBounds(minX, minY, maxX, maxY);
        }
    },

    clearMovementBounds: function() {
        Log.debug('Removing movement restrictions of entities');
        for (var i in Entities.__entities){
            Entities.__entities[i].clearMovementBounds();
        }
    },

    getEntities: function(){
        return Entities.__entities;
    },

    getEntityByUUID: function(uuid) {
        for (var i in Entities.__entities)
            if (Entities.__entities[i]['uuid'] === uuid)
                return Entities.__entities[i];
    },

    getEntityByName: function(name) {
        for (var i in Entities.__entities)
            if (Entities.__entities[i]['name'] === name)
                return Entities.__entities[i];
    }

};

/**
 * Tank visualization
 * @type {{visible_canvas: null, visible_canvas_ctx: null, width: number, height: number, autoSize: boolean, scratch_canvas: null, scratch_canvas_ctx: null, image_canvas: null, image_canvas_ctx: null, image_cache: {}, init: Tank.init, displayEntity: Tank.displayEntity, displayPerception: Tank.displayPerception, images_loading: number, displayImage: Tank.displayImage, flush_requested: boolean, flush: Tank.flush}}
 */
var Tank = {

    visible_canvas: null,
    visible_canvas_ctx : null,
    width: 1000,
    height: 750,
    autoSize: true,
    scratch_canvas: null,
    scratch_canvas_ctx: null,
    image_canvas: null,
    image_canvas_ctx: null,
    image_cache : {},

    enabled: true,

    init: function(){
        Tank.visible_canvas = $('#bobbeltank')[0];
        if (Tank.autoSize) {
            Tank.width = Math.round($('#tank').width());
            Tank.height = Math.round($('#tank').height());
        }
        Tank.visible_canvas.width = Tank.width;
        Tank.visible_canvas.height = Tank.height;
        Tank.visible_canvas_ctx = Tank.visible_canvas.getContext('2d');
        Tank.visible_canvas_ctx.transform(1, 0, 0, -1, 0, Tank.height);

        //setup scratch canvas. This is the canvas to paint on and transfer at the end to real canvas
        Tank.scratch_canvas = $('<canvas/>')[0];
        Tank.scratch_canvas.width = Tank.width;
        Tank.scratch_canvas.height = Tank.height;
        Tank.scratch_canvas_ctx = Tank.scratch_canvas.getContext('2d');

        //setup image canvas. This is the canvas to paint on and transfer at the end to real canvas
        Tank.image_canvas = $('<canvas/>')[0];
        Tank.image_canvas.width = Tank.width;
        Tank.image_canvas.height = Tank.height;
        Tank.image_canvas_ctx = Tank.image_canvas.getContext('2d');

        Log.debug('Tank of size ' + Tank.visible_canvas.width + 'x' + Tank.visible_canvas.height + ' ready');
        if (Tank.autoSize) Log.debug('Tank sized automatically');
    },

    /**
     * Paints an Entity-Object to canvas
     *
     * @param entity Entity-Object
     * @param withPerception if true perception areas are painted
     */
    displayEntity: function(entity, withPerception, withImage) {
        if (!Tank.enabled) return;

        var posX = entity.posX;
        var posY = entity.posY;
        if (posX === null || posY === null) {
            Log.error("Position information incomplete on entity\n" + entity);
            return;
        }

        if (withPerception) {
            for (var sensorTag in entity.sensor_polygons){
                Tank.displayPerception(entity.sensor_polygons[sensorTag], entity.sensor_colors[sensorTag], 1);
            }
        }

        if (withImage) {
            Tank.displayImage(entity.image_src, posX, posY, 20, 20);
        }
    },

    /**
     * Displays sensorPolygon
     * @param sensorPolygon polygon coordinates
     * @param color polygon color
     * @param intensity polygon opacity (1 is full)
     */
    displayPerception: function(sensorPolygon, color, intensity){
        if (!Tank.enabled) return;

        var ctx = Tank.scratch_canvas_ctx;
        ctx.fillStyle = color;
        if (intensity) ctx.globalAlpha=intensity;

        if (!sensorPolygon.length) {
            Log.error('Can not paint invalid sensorPolygon');
            return;
        }
        var lastCoord = sensorPolygon.slice(-1)[0];
        ctx.moveTo(lastCoord[0], lastCoord[1]);
        for (var i in sensorPolygon){
            ctx.lineTo(sensorPolygon[i][0],sensorPolygon[i][1]);
        }
        ctx.closePath();
        ctx.fill();

        if (intensity) ctx.globalAlpha=1;
    },

    images_loading: 0,
    /**
     * Adds image with specified source path to scretch canvas and performs flush after loading if requested
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

    flush_requested: false,
    /**
     * A flush (transver of image from scretch to visible canvas only can be performed if no images are loading
     * If images_loading > 0 transfered image would be incomplete
     * flush_requested is a flag to check wheather there is an outstanding flush request
     */
    flush: function(){
        if (!Tank.enabled) return;

        Tank.flush_requested = true;
        if (!Tank.images_loading) {
            Tank.visible_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.visible_canvas_ctx.beginPath();
            Tank.visible_canvas_ctx.drawImage(Tank.scratch_canvas, 0, 0);
            Tank.scratch_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.scratch_canvas_ctx.beginPath();
            Tank.visible_canvas_ctx.drawImage(Tank.image_canvas, 0, 0);
            Tank.image_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.image_canvas_ctx.beginPath();
            Tank.flush_requested = false;
        }
    },

    toggleEnabled: function() {
        Tank.enabled = !Tank.enabled;
        if (Tank.enabled) {
            Log.info("Visualization ON", 100, 'tank_enabled_state');
        } else {
            Log.info("Visualization OFF", 100, 'tank_enabled_state');
        }
    }
};

/**
 *
 * @type {{__interval_ref: null, __interval_ms: number, __step_count: number, init: Simulator.init, setInterval: Simulator.setInterval, stop: Simulator.stop, performStep: Simulator.performStep}}
 */
var Simulator = {

    __interval_ref: null,
    __interval_ms: 500,
    __step_count: 0,

    init : function(){
        Log.debug('Simulator ready');
    },

    /**
     * Sets simulation to perform a simulationstep all timespan miliseconds
     * @param timespan time between simulation steps
     */
    setInterval : function(timespan){
        Simulator.stop();
        Simulator.__interval_ref = setInterval(Simulator.performStep, timespan);
        Simulator.__interval_ms = timespan;
        Log.debug('Simulator interval changed to ' + Simulator.__interval_ms + 'ms', 5, 'simulator_speed_update');
    },

    /**
     * Stops simulation
     */
    stop : function(){
        if (Simulator.__interval_ref) clearInterval(Simulator.__interval_ref);
        Simulator.__interval_ref = null;
        Simulator.__interval_ms = -1;
    },

    /**
     * Performs a single simulation step
     */
    performStep: function(){
        var begin = new Date();
        //perform step here

        var entities = Entities.getEntities();

        for (var i in entities){
            var entity = entities[i];

            if (Math.random() > 0.5) {
                entity.rotate(10);
            } else {
                entity.rotate(-10);
            }
            entity.move(1);

            Tank.displayEntity(entity, true, true);
        }
        Tank.flush();

        var end = new Date();
        Log.debug('Performing simulation step ' + Simulator.__step_count + ' for ' + (end.getTime() - begin.getTime()) + 'ms', 1, "simulator_performing_step");
        Simulator.__step_count++;
    }
};

/**
 * Handles user interactions with control panel
 * @type {{init: ControlPanel.init}}
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
            Parameters.loadConfig();
        });

        $('#noOutput_btn').click(function(){
            Tank.toggleEnabled();
        });

        ControlPanel.disable();
    },

    disable: function() {
        
    },

    enable: function() {

    }
};

/**
 * Handles JSON-Files reading
 * Make sure config_file and bobbeltank_file exist and if empty at least contain these brackets {}
 * @type {{init: Parameters.init, readFile: Parameters.readFile}}
 */
var Parameters = {

    config_file: 'json/config.json',
    bobbeltank_file: 'bobbeltank.json',

    flags: {},

    init: function(){
        Log.debug("JSON handler ready");
    },

    /**
     * For loading of configuration file
     */
    loadConfig: function() {
        Parameters.readFile(Parameters.config_file, function(json){
            /* do something with config here */

            if (json['Tank'] && json['Tank']['limitsMovement']) {
                Parameters.flags['limitMovementToTankBounds'] = true;
            }

            Parameters.loadBobbelTankFile();
            ControlPanel.enable();
        });
    },

    /**
     * For loading of bobble-file containing entities etc.
     */
    loadBobbelTankFile: function() {
        Parameters.readFile(Parameters.bobbeltank_file, function(json){
            Entities.setEntities(json['Entities'], json['Sensors']);
            if (Parameters.flags['limitMovementToTankBounds']) {
                Entities.setMovementBounds(0, 0, Tank.width, Tank.height);
            }
        });
    },

    /**
     * Loads JSON file from json-folder
     * @param filename name of file. should include extension
     * @param callback function called after asynchronous read. Json is provided as parameter
     */
    readFile: function(filename, callback) {
        $.getJSON(filename+'?antiCache='+Math.random())
            .done(function (json) {
                Log.info('Reading ' + filename);
                if (callback) callback(json);
            }).fail(function (error) {
                if (error && error.responseText) {
                    Log.debug("(Read failed but using fallback)");
                    var json = JSON.parse(error.responseText);
                    if (callback) callback(json);
                } else {
                    Log.error('Can not read ' + filename + '\n' +
                        'The path is not correct or browser prevents reading local files\n' +
                        'If this error occurs with correct path please use a http server');
                    return;
                }
            });
    }
};

/**
 * Logging object. Provides logging output in web app.
 * @type {{hide_debug: boolean, oldLog: null, init: Log.init, info: Log.info, debug: Log.debug, error: Log.error, __addEntry: Log.__addEntry}}
 */
var Log = {

    hide_debug: false,
    oldLog: null,

    /**
     * Initializes application log. Redirects console.log to webpage
     * (do not use console.log anymore. Use Log.debug, Log.info or Log.error instead)
     */
    init: function(){

        Log.oldLog = console.log;

        console.log = function (message) {
            Log.debug(message);
            Log.oldLog.apply(console, arguments);
        };

        window.onerror = function(message, source, lineno, colno, error){
            Log.error('In line ' + lineno + ' of ' + (source.replace(/^.*[\\\/]/, '')) + '\n -> ' + error + '\n -> (' + message + ')', 60);
        }

        console.log('Console redirected to Bobbel log');
    },

    /**
     * Adds message of level info to log
     * @param message log message
     * @param time display time in seconds
     * @param tag a name that can be used to name and then replace a specific message on update (for fast parameters update)
     */
    info: function(message, time, tag){
        Log.__addEntry('<strong>[Info]</strong> ' + message, time, tag);
    },

    /**
     * Adds message of level debug to log
     * @param message log message
     * @param time display time in seconds
     * @param tag a name that can be used to name and then replace a specific message on update (for fast parameters update)
     */
    debug: function(message, time, tag){
        if (!Log.hide_debug) Log.__addEntry('<strong>[Debug]</strong> ' + message, time, tag);
    },

    /**
     * Adds message of level error to log
     * @param message log message
     * @param time display time in seconds
     */
    error: function(message, time, tag){
        Log.__addEntry('<strong style="color:red;">[ERROR] ' + message + '</strong>', time, tag);
    },

    /**
     * Adds new textelement as entry to log. (Is used by info, debug and error function)
     * @param message message string of log entry
     * @param time display time in seconds
     * @param tag a name that can be used to name and then replace a specific message on update (for fast parameters update)
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
 * ------------------------------
 * CLASS DEFINITIONS
 * ------------------------------
 */

/**
 * Entity Class description. Use var foo = new Entity(entity_object, sensors_object)
 * Parameters entity_object a single entity and the sensors description as described in bobbeltank.json
 * (To reference the entity use the unique ID instead of the name)
 * Entities properties are: name, image_src, position, uuid and sensor_polygons.
 * @param entity_object is an single entity object from config with keys name, image, position etc..
 * @constructor adds fields. Property position will stay undefined if invalid
 */
function Entity(entity_object, sensors_object) {
    this.name = entity_object['name'];
    this.image_src = entity_object['image'];
    this.movementRestricted = false;

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
    this.updateSensors();

    //set unique ID
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    this.uuid = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

/**
 * Moves entity along current direction
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
 * Rotates entity depending on degrees (0-360)
 * @param degrees
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
 * Restricts movement of entities to these coordinates. (Handled on move method)
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

        this.sensor_polygons[sensor] = this.__rotated_sensor_perimeters[sensor].map(function(polyEdge, index){
            return [polyEdge[0]+posX, polyEdge[1]+posY]; //move to point
        });
    }
};

/**
 * Overrides default string output for Entity class
 * @returns {string}
 */
Entity.prototype.toString = function(){
    return ' > "'
        + (this.name? this.name: '"name"-property missing!')
        + (this.posX && this.posY? '" at pos [' + this.posX + ', ' + this.posY + ']' : ' invalid "position"-property [' + this.posX +', ' + this.posY + ']')
        + (this.image_src? '': ' without "image" property!')
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
 * @returns {*[]} Coords of rotated point [x,y]
 * @private
 */
Entity.__rotateAroundOrigin = function(pointX, pointY, originX, originY, angle){
    angle = angle * Math.PI / 180.0;
    return [Math.cos(angle) * (pointX-originX) - Math.sin(angle) * (pointY-originY) + originX,
        Math.sin(angle) * (pointX-originX) + Math.cos(angle) * (pointY-originY) + originY]
};

/**
 * EntryPoint to core javascript if document loaded
 * Can be seen as "main-method"
 */
$('document').ready(function(){
    Log.init();
    Tank.init();
    Simulator.init();
    ControlPanel.init();
    Parameters.init();

    Parameters.loadConfig();
});