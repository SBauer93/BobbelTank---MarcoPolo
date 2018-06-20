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

function choosePositions(seed, sign) {
    var random = Math.floor(Math.random() * 15);
    return sign === 1 ? seed + random : seed - random;
}

var bobbel_entities =

    [
        {
            name: "Wilson",
            image: "images/150x150_bubble.png",
            position: [choosePositions(130, 1), choosePositions(130, 1)],
            direction: 0,
            perceptions : ["see", "hear", "feel"],
            color: "black"
        }, {
            name: "Mouse",
            image: "images/150x150_bubble.png",
            position: [choosePositions(130, 1), choosePositions(800, 1)],
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
            name: "Captain Bobbel",
            image: "images/150x150_bubble.png",
            position: [choosePositions(1300, 0), choosePositions(800, 0)],
            color: "red",
            perceptions : ["see", "hear", "feel"]
        }, {
            name: "Spock Bobbel",
            image: "images/150x150_bubble.png",
            position: [choosePositions(500, 1), choosePositions(400, 0)],
            color: "blue",
            perceptions : ["see", "hear", "feel"]
        }, {
            name: "O'Brian Bobbel",
            image: "images/150x150_bubble.png",
            position: [choosePositions(300, 0), choosePositions(600, 1)],
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
 *  color       in which sensor is displayed. If no color is defined sensor is invisible (but active)
 *
 *
 *  Example:
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
 * Edge definition list. Edge can be defined with perimeters start and endpoint. They are placed in environment and perceived by entities
 *
 *  [
 *      {
 *           perimeter: [[120,0], [120,400]],
 *           color : "red",
 *           name: "left_edge"
 *       },
 *      {
 *           ...
 *       }
 *   ]
 *
 *   Every Edge has the properties perimeter (start and endpoint), color and name
 *
 */
var bobbel_edges = [
    {
        perimeter: [[120,120], [1300,120]],
        color : "red",
        name: "top_edge"
    },{
        perimeter: [[120,120], [120,800]],
        color : "red",
        name: "left_edge"
    },{
        perimeter: [[1300,120], [1300,800]],
        color : "red",
        name: "right_gate_edge"
    },{
        perimeter: [[120,800], [1300,800]],
        color : "red",
        name: "bottom_edge"
    }
];


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

