//TIP: If you disable caching in webbrowser. Live.js reloads page on any changes of these files automatically
'use strict';

/**
 * Called once after Program loaded or if "Restart" pressed
 * Adds Entities defined in properties.js to Simulator
 *      EntityCollection.setEntities(bobbel_entities, bobbel_sensors);
 *
 * You can perform additional actions for startup here if you with
 */
var load_bobbel_data = function(){

    /** place init code here **/

    EntityCollection.setEntities(bobbel_entities, bobbel_sensors);

    /** or here **/

    Log.info('Initialization done!');
};

/**
 * Called in preparation of every Simulation step
 * @param entity_list list of all entities that are included to simulation
 * @param step_count number of simulation step
 */
var perform_simulation_step_initialization = function(entity_list, step_count){

};

/**
 * Called during Simulation step for every entity in Simulation
 *
 * Entity's states are contained in it's properties. You can read and persistently chang properties during simulation
 *        (example use: entity.name)
 *
 *          {
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
 *          }
 *
 *        Entity has included functions helping you to move and rotate an entity
 *
 *          entity.move(distance_in_px) // moves towards current direction and updates sensor_polygons
 *          entity.rotate(degree)       // (0-360) rotates direction counterclockwise (-degree clockwise) and updates sensors
 *          entity.updateSensors()      // if you change posX, posY or direction yourself this updates sensorpolygons for you
 *          entity.toString()           // overrides default string output method providing some debug info if necessary
 *
 *
 *
 * Perceptions-Object looks like this
 *
 *          {
 *              sensortag_1: [perceived_entity_object_1, perceived_entity_object_2, perceived_entity_object_3, ...],
 *              sensortag_2: ...
 *          }
 *
 * @param entity reference to current entity object
 * @param perceptions object mapping sensornames to lists of perceived entities or null if empty*
 * @param step_count number of simulation step
 */
var perform_simulation_step_on_entity = function(entity, perceptions, step_count){

    if (perceptions) {
        for (var sensor in perceptions) {
            var names = [];
            for (var index in perceptions[sensor]){
                names.push(perceptions[sensor][index]['name']);
            }
        }
        Log.debug(entity.name + " " + sensor + "'s [" + names+']' , 3, entity.uuid+sensor);
    }

    if (!perceptions) {
        if (Math.random() > 0.5) {
            entity.rotate(10);
        } else {
            entity.rotate(-10);
        }
        entity.move(1);
    }
};

/**
 * Called for finalization at the end of every simulation step. Changes to visualization are performed afterwards
 * @param entity_list list of all entities
 * @param step_count number of simulation step
 * @param duration time simulation took
 */
var perform_simulation_step_finalization = function(entity_list, step_count, duration) {
    Log.debug('Performed simulation step ' + step_count + ' for ' + duration + 'ms', 1, "simulator_performing_step");
}