'use strict';

/**
 * EntryPoint to core javascript
 */
$('document').ready(function(){
    Log.init();
    Tank.init();
    Simulator.init();
    ControlPanel.init();
    JSONhandler.init();

    JSONhandler.readFile('config.json');
});

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

        Tank.paint();
        Log.debug('Tank size ' + Tank.canvas.width + 'x' + Tank.canvas.height);
        Log.debug('Tank');
    },

    paint: function(){
        Log.debug('Painting test');

        var bubble = new Image();
        bubble.src = "images/150x150_bubble.png";
        bubble.onload = function() {
            Tank.context.drawImage(bubble,10,10, 20, 20);
            Log.debug('Image loaded');
        };

        Log.debug('Painting done');
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
        Log.debug('Simulator speed changed to ' + Simulator.__interval_ms + 'ms', 5, 'simulator_speed_update');
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
        Log.debug('Performing simulation step ' + Simulator.__step_count, 1, "simulator_performing_step");
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
    }
};

/**
 * Handles JSON-Files reading
 * @type {{init: JSONhandler.init, readFile: JSONhandler.readFile}}
 */
var JSONhandler = {

    json_root: 'json/',

    init: function(){
        Log.debug("JSON handler ready");
    },

    /**
     * Loads JSON file from json-folder
     * @param filename name of file. should include extension
     * @param callback function called after asynchronous read. Json is provided as parameter
     */
    readFile: function(filename, callback) {
        $.get(JSONhandler.json_root + filename)
            .done(function () {
                $.getJSON(JSONhandler.json_root + filename, function(json) {
                    Log.info('Reading ' + JSONhandler.json_root + filename);
                    if (callback) callback(json);
                });

            }).fail(function () {
                Log.error('Can not read ' + JSONhandler.json_root + filename + '\n' +
                    'The path is not correct or browser prevents reading local files\n' +
                    'If this error occurs with correct path please use a http server');
                return;
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