//TIP: If you disable caching in webbrowser. Live.js reloads page on any changes of these files automatically
'use strict';

/**
 * @author Robin Nicolay <robin.nicolay@uni-rostock.de>
 */

/**
 * List of Bobbel entities
 * [{bobbel_1},{bobbel_2},{bobbel_3},...]
 *
 * Every Bobbel can have the following properties:
 *
 *  name is a name you define
 *  image an image path to a small round image (the default bubble is from https://www.freeiconspng.com/img/44340)
 *  position start coordinates
 *  direction direction of bobbel 0-360 degree. 0 is looking along x-axis, 90 along y-axis etc...
 *  color displays a colored ring around a bobbel
 *  perception list of sensor-tags defined in bobbel_sensors
 *
 *  example
 *
 *      {
 *           name: "Malotzki",
 *           image: "images/150x150_bubble.png",
 *           color: "cyan",
 *           position : [10,80],
 *           perceptions : ["pirate"],
 *           direction : 20
 *       }
 *
 */
var bobbel_entities =

    [
        {
            name: "Wilson",
            image: "images/150x150_bubble.png",
            position: [20, 20],
            direction: 0,
            perceptions : ["see", "hear", "feel"],
            color: "black"
        }, {
            name: "Mouse",
            image: "images/150x150_bubble.png",
            position: [35, 22],
            direction: 0,
            perceptions : [],
            color: "black"
        }, {
            name: "Malotzki",
            image: "images/150x150_bubble.png",
            color: "cyan",
            perceptions : ["pirate"],
            direction : 20
        }, {
            name: "Hannah",
            image: "images/150x150_bubble.png",
            color: "pink",
            position : [200,375],
            perceptions : ["see"],
            direction : 0
        }, {
            name: "Captain Bobbel",
            image: "images/150x150_bubble.png",
            color: "red",
            perceptions : ["see", "hear", "feel"]
        }, {
            name: "Spock Bobbel",
            image: "images/150x150_bubble.png",
            color: "blue",
            perceptions : ["see", "hear", "feel"]
        }, {
            name: "O'Brian Bobbel",
            image: "images/150x150_bubble.png",
            color: "yellow",
            perceptions : ["see", "hear", "feel"]
        }
    ];




/**
 * Sensor definitions. Sensors are referenced by an sensor tag (used to attach sensors to bobbels)
 *
 *      {
 *          sensortag_1: {sensor_desc_1},
 *          sensortag_2: {sensor_desc_2},
 *          sensortag_3: {sensor_desc_3}
 *      }
 *
 * Every Sensor has the follogin properties
 *
 *  perimeter   defines the sensor polygon (list of points) around an entity
 *              The entity can be seen at position (0,0) Looking to direction 0 (along x-axis)
 *              All points defined for sensor polygon are in relation to this entity
 *  color       in which sensor is displayed
 *
 *      see: {                                         // sensor has tag see
 *          perimeter: [[0,0], [40,20], [40,-20]],     // spans a triangle from entity (0,0) forward to X 40 and span -20 to 20
 *          color : "#FFDD00"                          // is displayed yellow
 *      }
 *
 */
var bobbel_sensors = {

    see: {
        perimeter: [[0,0], [50,-20], [50,20]],
        color : "orange"
    },
    hear: {
        perimeter: [[-20,20], [20,20], [20,-20], [-20,-20]],
        color : "orange"
    },
    feel: {
        perimeter: [[0,0],[60, 30], [60, 15], [0, 0], [60, -15], [60, -30]],
        color : "orange"
    },
    pirate: {
        perimeter: [[0,0],[15, 30], [15, -10]],
        color : "orange"
    }
};


/**
 * Parameters for simulator
 * You can define your own background image, set entities movement limitations or define log level (debug, info, error)
 * If not limited the entities don't stop at simulators borders
 * @type {{tank: {background_image: string}, entities: {limit_movement_to_tank_boundaries: boolean}}}
 */
var simulator_parameters = {

    tank: {
        background_image: 'images/default_background.jpg',
        width: 800,                                             // can specify own tank with
        height: 600,                                            // can specify own tank height
        auto_size: true,                                        // if true tank size adjusted by web page size
        disable: false                                          // if you prefer you can start without visualization by default
    },

    entities: {
        limit_movement_to_tank_boundaries: true,                 // if true entities are only allowed to move inside tank
        set_position_randomly_if_undefined: true,                // if you don't define position property its set randomly
        set_direction_randomly_if_undefined: true                // if you don't define a direction property its set randomly
    },

    log: {
        level: "debug"                                          // can be changed to debug, info, error
    }
};

