/**
 * List of Bobbel entities
 * [{bobbel_1},{bobbel_2},{bobbel_3},...]
 *
 * Every Bobbel can have the following properties:
 *
 *  name is a name you define
 *  image an image path to a small round image
 *  position start coordinates
 *  direction direction of bobbel 0-360 degree. 0 is looking along x-axis, 90 along y-axis etc...
 *  color displays a colored ring around a bobbel
 *  perception list of sensor-tags defined in bobbel_sensors
 *
 *  example
 *      {
 *           name: "Malotzki",
 *           image: "images/150x150_bubble.png",
 *           color: "cyan",
 *           position : [10,80],
 *           perceptions : ["pirate"],
 *           direction : 20
 *       }
 *
 * @type {*[]}
 */
var bobbel_entities =

    [
        {
            name: "Wilson",
            image: "images/150x150_bubble.png",
            position : [1,40],
            perceptions : ["see", "feel"]
        }, {
            name: "Malotzki",
            image: "images/150x150_bubble.png",
            color: "cyan",
            position : [10,80],
            perceptions : ["pirate"],
            direction : 20
        }, {
            name: "PEWPEW",
            image: "images/150x150_bubble.png",
            position : [100,20],
            perceptions : ["see"],
            direction : 50
        }, {
            name: "Hannah",
            image: "images/150x150_bubble.png",
            color: "pink",
            position : [200,375],
            perceptions : ["see", "hear", "feel"],
            direction : 260
        }, {
            name: "Bobbel",
            image: "images/150x150_bubble.png",
            color: "green",
            position : [200,375],
            perceptions : ["see", "hear", "feel"],
            direction : 0
        }
    ];




/**
 * Sensor definitions. Sensors are referenced by an sensor tag (used to attach sensors to bobbels)
 * { sensortag_1: {sensor_desc_1}, sensortag_2: {sensor_desc_2}, sensortag_3: {sensor_desc_3},...}
 *
 * Every Sensor has the follogin properties
 *
 *  perimeter   defines the sensor polygon (list of points) around an entity
 *              The entity can be seen at position (0,0) Looking to direction 0 (along x-axis)
 *              All points defined for sensor polygon are in relation to this entity
 *  color in which sensor is displayed
 *
 *  example
 *      see: {                                      // sensor has tag see
 *       perimeter: [[0,0], [40,20], [40,-20]],     // spans a triangle from entity (0,0) forward to X 40 and span -20 to 20
 *       color : "#FFDD00"                          // is displayed yellow
 *   }
 *
 *
 * @type {{see: {perimeter: *[], color: string}, hear: {perimeter: *[], color: string}, feel: {perimeter: *[], color: string}, pirate: {perimeter: *[], color: string}}}
 */
var bobbel_sensors = {

    see: {
        perimeter: [[0,0], [40,20], [40,-20]],
        color : "#FFDD00"
    },
    hear: {
        perimeter: [[-20,20], [20,20], [20,-20], [-20,-20]],
        color : "#FFDD00"
    },
    feel: {
        perimeter: [[0,0],[60, 30], [60, 15], [0, 0], [60, -15], [60, -30]],
        color : "#FFDD00"
    },
    pirate: {
        perimeter: [[0,0],[15, 30], [15, -10]],
        color : "#FFDD00"
    },
    rod: {
        perimeter: [[0,0],[-20,40],[-10,55], [10,55],[20,45],[30,20], [200,20], [220,10], [220,-10], [200,-20], [10,-20], [0,-30],[-10,-10],],
        color : "pink"
    }
};





/**
 * Parameters for simulator
 * You can define your own background image or set entities movement limitations
 * If not limited the entities don't stop at simulators borders
 * @type {{tank: {background_image: string}, entities: {limit_movement_to_tank_boundaries: boolean}}}
 */
var simulator_parameters = {

    tank: {
        background_image: 'images/milky-way-2695569_960_720'
    },

    entities: {
        limit_movement_to_tank_boundaries: true
    }
};

