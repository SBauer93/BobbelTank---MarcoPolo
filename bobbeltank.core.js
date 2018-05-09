'use strict';

/**
 * ------------------------------
 * CLASS DEFINITIONS
 * ------------------------------
 */

/**
 * Entity Class description. Use var foo = new Entity(entity_object) for example from config
 * (To reference the entity use the unique ID instead of the name)
 * Entities properties are: name, image_src, position and uuid.
 * @param entity_object is an single entity object from config with keys name, image, position etc..
 * @constructor adds fields. Property position will stay undefined if invalid
 */
function Entity(entity_object) {
    this.name = entity_object['name'];
    this.image_src = entity_object['image'];

    //only sets position if input pos is array with length 2
    var pos = entity_object['position']
    if (Array.isArray(pos) && pos.length === 2) {
        this.position = pos;
        this.posX = pos[0];
        this.posY = pos[1];
    }

    //set unique ID
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    this.uuid = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
/**
 * Overrides default string output for objects of Entity class
 * @returns {string}
 */
Entity.prototype.toString = function(){
    return ' > "'
        + (this.name? this.name: '"name"-property missing!')
        + (this.position? '" at pos [' + this.posX + ', ' + this.posY + ']' : ' invalid "position"-property [' + this.position + ']')
        + (this.image_src? '': ' without "image" property!');
};

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

    setEntities: function(input_list){
        Entities.__entities = [];

        if (input_list.length) {

            var logMsg = 'Updated entity list to:';
            for (var i in input_list) {
                var entity = new Entity(input_list[i]);
                logMsg += '\n' + entity;
                Entities.__entities.push(entity);
                Tank.paint(entity);
            }
            Log.debug(logMsg);
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

    canvas: null,
    context : null,
    width: 1000,
    height: 750,

    init: function(){
        Tank.canvas = $('#bobbeltank')[0];
        Tank.canvas.width = Tank.width;
        Tank.canvas.height = Tank.height;
        Tank.context = Tank.canvas.getContext('2d');
        Tank.clear();

        Log.debug('Tank of size ' + Tank.canvas.width + 'x' + Tank.canvas.height + ' ready');
    },

    paint: function(entity){
        var imgSrc = entity.image_src;
        var posX = entity.posX;
        var posY = entity.posY;
        if (!imgSrc || !posX || !posY) {
            Log.error("Painting information incomplete on entity\n" + entity);
            return;
        }

        var bubble = new Image();
        bubble.src = imgSrc;
        bubble.onload = function() {
            Tank.context.drawImage(bubble, posX, posY, 20, 20);
        };
    },

    /**
     * Clears canvas completely
     */
    clear: function(){
        Tank.context.clearRect(0, 0, Tank.width, Tank.height)
        Log.debug('Cleaned up tank');
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
 * @type {{init: JSONhandler.init, readFile: JSONhandler.readFile}}
 */
var JSONhandler = {

    config_file: 'json/config.json',

    init: function(){
        Log.debug("JSON handler ready");
    },

    loadConfig: function() {
        JSONhandler.readFile(JSONhandler.config_file, function(json){
            Entities.setEntities(json.Entities);
            ControlPanel.enable();
        });
    },

    /**
     * Loads JSON file from json-folder
     * @param filename name of file. should include extension
     * @param callback function called after asynchronous read. Json is provided as parameter
     */
    readFile: function(filename, callback) {
        $.getJSON(filename)
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

        console.log('Logging active');
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