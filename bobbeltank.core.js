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
                Tank.displayEntity(entity, true);
            }
            Log.debug(logMsg);
            Tank.refresh();
        } else {
            Log.debug("Updated entity list to empty list");
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
 * The living space for simulated entities
 * @type {{canvas: null, context: null, width: number, height: number, init: Tank.init, paint: Tank.paint, clear: Tank.clear}}
 */
var Tank = {

    visible_canvas: null,
    visible_canvas_ctx : null,
    width: 1000,
    height: 750,
    autoSize: true,
    scratch_canvas: null,
    scratch_canvas_ctx: null,

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

        //setup scratch canvas. This is the canvas to paint on and transver at the end to real canvas
        Tank.scratch_canvas = $('<canvas/>')[0];
        Tank.scratch_canvas.width = Tank.width;
        Tank.scratch_canvas.height = Tank.height;
        Tank.scratch_canvas_ctx = Tank.scratch_canvas.getContext('2d');

        Log.debug('Tank of size ' + Tank.visible_canvas.width + 'x' + Tank.visible_canvas.height + ' ready');
        if (Tank.autoSize) Log.debug('Tank sized automatically');
    },

    /**
     * Paints an Entity-Object to canvas
     *
     * @param entity Entity-Object
     * @param withPerception if true perception areas are painted
     */
    displayEntity: function(entity, withPerception) {
        var imgSrc = entity.image_src;
        var posX = entity.posX;
        var posY = entity.posY;
        if (!imgSrc || !posX || !posY) {
            Log.error("Painting information incomplete on entity\n" + entity);
            return;
        }

        var ctx = Tank.scratch_canvas_ctx;

        if (entity.image_cache) {
            Tank.scratch_canvas_ctx.drawImage(entity.image_cache, posX-10, posY-10, 20, 20);
        } else if (entity.image_src) {
            Tank.loadImage(imgSrc, posX, posY, 20, 20);
        }

        if (withPerception) {
            for (var sensorTag in entity.sensor_polygons){
                var coords = entity.sensor_polygons[sensorTag];
                ctx.fillStyle = entity.sensor_colors[sensorTag];

                if (!coords.length) {
                    Log.error('Can not paint invalid coords for ' + sensorTag);
                    return;
                }
                var lastCoord = coords.slice(-1)[0];
                ctx.moveTo(lastCoord[0], lastCoord[1]);
                for (var i in coords){
                    ctx.lineTo(coords[i][0],coords[i][1]);
                }
                ctx.closePath();
            }
            ctx.fill();
        }
    },

    images_loading: 0,
    /**
     * Adds image with specified source path to scretch canvas and performs refresh after loading if requested
     * @param source path to image
     * @param posX position of image
     * @param posY position of image
     * @param sizeX size in pixel of image
     * @param sizeY size in pixel of image
     */
    loadImage: function(source, posX, posY, sizeX, sizeY){
        Tank.images_loading++;
        var image = new Image();
        image.src = source;
        image.onload = function() {
            Tank.scratch_canvas_ctx.drawImage(image, posX-10, posY-10, sizeX, sizeY);
            Tank.images_loading--;
            if (Tank.refresh_requested) Tank.refresh();
        };
    },

    refresh_requested: false,
    /**
     * A refresh (transver of image from scretch to visible canvas only can be performed if no images are loading
     * If images_loading > 0 transfered image would be incomplete
     * refresh_requested is a flag to check wheather there is an outstanding refresh request
     */
    refresh: function(){
        Tank.refresh_requested = true;
        if (!Tank.images_loading) {
            Tank.visible_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.visible_canvas_ctx.beginPath();
            Tank.visible_canvas_ctx.drawImage(Tank.scratch_canvas, 0, 0);
            Tank.scratch_canvas_ctx.clearRect(0,0,Tank.width, Tank.height);
            Tank.scratch_canvas_ctx.beginPath();
            Tank.refresh_requested = false;
        }
    }
};

/**
 * Handles simulation process
 * @type {{__interval: null, __interval_ms: number, init: Simulator.init, setInterval: Simulator.setInterval, stop: Simulator.stop, performStep: Simulator.performStep}}
 */
var Simulator = {

    __interval: null,
    __interval_ms: -1,
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
        Simulator.__interval = setInterval(Simulator.performStep, timespan);
        Simulator.__interval_ms = timespan
        Log.debug('Simulator interval changed to ' + Simulator.__interval_ms + 'ms', 5, 'simulator_speed_update');
    },

    /**
     * Stops simulation
     */
    stop : function(){
        if (Simulator.__interval) clearInterval(Simulator.__interval);
        Simulator.__interval = null;
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

            entity.posX += 5;
            entity.updateSensors();

            Tank.displayEntity(entity, true);
        }
        Tank.refresh();

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
 * @type {{init: JSONhandler.init, readFile: JSONhandler.readFile}}
 */
var JSONhandler = {

    config_file: 'json/config.json',
    bobbeltank_file: 'bobbeltank.json',

    init: function(){
        Log.debug("JSON handler ready");
    },

    /**
     * For loading of configuration file
     */
    loadConfig: function() {
        JSONhandler.readFile(JSONhandler.config_file, function(json){
            /* do something with config here */

            JSONhandler.loadBobbelTankFile();
            ControlPanel.enable();
        });
    },

    /**
     * For loading of bobble-file containing entities etc.
     */
    loadBobbelTankFile: function() {
        JSONhandler.readFile(JSONhandler.bobbeltank_file, function(json){
            Entities.setEntities(json['Entities'], json['Sensors']);
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
    this.sensor_colors = {};
    for (var tag_i in perceptionTags) {
        var tag = perceptionTags[tag_i];
        if (sensors_object[tag]){
            this.__sensor_perimeters[tag] = sensors_object[tag]['perimeter'];
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

    var image_src = entity_object['image'];
    if (image_src) {
        var img = new Image();
        var alias = this;
        img.onload = function(){
            alias.image_cache = img;
        }
        img.src = image_src;
    }
}


Entity.__rotateAroundOrigin = function(pointX, pointY, originX, originY, angle){
    angle = angle * Math.PI / 180.0;
    return [Math.cos(angle) * (pointX-originX) - Math.sin(angle) * (pointY-originY) + originX,
        Math.sin(angle) * (pointX-originX) + Math.cos(angle) * (pointY-originY) + originY]

};


/**
 * Updates entities sensor_polygons etc. according to position and direction properties
 */
Entity.prototype.updateSensors = function(){
    var posX = this.posX;
    var posY = this.posY;
    var direction = this.direction;

    for (var sensor in this.__sensor_perimeters){
        this.sensor_polygons[sensor] = this.__sensor_perimeters[sensor].map(function(polyEdge, index){
            var newPolyEdge = [polyEdge[0]+posX, polyEdge[1]+posY]; //move to point
            if (direction) {
                newPolyEdge = Entity.__rotateAroundOrigin(newPolyEdge[0], newPolyEdge[1], posX, posY, direction);
            }
            return newPolyEdge;
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
 * EntryPoint to core javascript if document loaded
 * Can be seen as "main-method"
 */
$('document').ready(function(){
    Log.init();
    Tank.init();
    Simulator.init();
    ControlPanel.init();
    JSONhandler.init();

    JSONhandler.loadConfig();
});