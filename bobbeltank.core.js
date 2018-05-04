'use strict';

$('document').ready(function(){
    Log.init();

    Log.debug('Initialization done');
});





/**
 * Logging object. Provides logging output in web app.
 * Output Log.info, Log.debug and Log.error in code to output information
 * @type {{hide_debug: boolean, oldLog: null, init: Log.init, info: Log.info, debug: Log.debug, error: Log.error, getTimeString: Log.getTimeString, __addEntry: Log.__addEntry}}
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
            Log.info(message);
            Log.oldLog.apply(console, arguments);
        };

        console.log('Logging ready!');
    },

    info: function(message, time){
        this.__addEntry('<strong>[Info]</strong> ' + message, time);
    },

    debug: function(message, time){
        if (!this.hide_debug) this.__addEntry('<strong>[Debug]</strong> ' + message, time);
    },

    error: function(message, time){
        this.__addEntry('<strong>[ERROR] ' + message + '</strong>', time);
    },

    /**
     * Adds new textelement as entry to log
     * @param message message string of log entry
     * @param time time to show
     * @private
     */
    __addEntry: function(message, time) {

        var d = new Date();
        message =
            '[' + ("0" + d.getHours()).slice(-2) +
            ':' + ("0" + d.getMinutes()).slice(-2) +
            ':' + ("0" + d.getSeconds()).slice(-2) +
            '] ' + message ;

        var logEntry = $('<div/>');
        logEntry.html(message.replace(/(\r\n|\n\r|\r|\n)/g,'<br>'));
        logEntry.addClass('log-entry');
        $('#controlpanel_log').prepend(logEntry);

        //removes log entry after 'time' seconds
        if (!time) time = 10000;
        setTimeout(function(){
            logEntry.fadeOut(500, function(){logEntry.remove()});
        }, time);
    }
};