/* global EntityCollection, bobbel_sensors, bobbel_entities, Log, Tank, Simulator, Entity */

//TIP: If you disable caching in webbrowser. Live.js reloads page on any changes of these files automatically
'use strict';

/**
 * @author Robin Nicolay <robin.nicolay@uni-rostock.de>
 */

/**
 * This function is not meant to be called by you. It is called automatically once after Program loaded or if "Restart" pressed
 
 * Adds Entities defined in properties.js to Simulator
 *      EntityCollection.setEntities(bobbel_entities, bobbel_sensors);
 *
 * You can perform additional actions for startup here if you wish
 */
var load_bobbel_data = function(){

    /** place init code here **/

    EntityCollection.setEntities(bobbel_entities, bobbel_sensors);
    EdgeCollection.setEdges(bobbel_edges);

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
 * This function is not meant to be called by you. It is called automatically during Simulation step for every Entity-Object in EntityCollection
 *
 * @param entity reference to current Entity-Object (see README.md)
 * @param perceptions object mapping sensornames to lists of perceived entities or null if empty (see README.md)
 * @param step_count number of simulation step
 */
var perform_simulation_step_on_entity = function(entity, perceptions, step_count){
    
    if (perceptions) {
        for (var sensor in perceptions) {
            var perception_log = [];
            for (var index in perceptions[sensor]){

                var perception = perceptions[sensor][index];

                if (perception['type'] === 'Entity-Object')
                    perception_log.push(("(" + perceptions[sensor][index]['object']['name']
                        + " dist " + Math.round(perceptions[sensor][index]['distance'])
                        + " " + Math.round(perceptions[sensor][index]['direction'])+ "°)"));

                if (perception['type'] === 'Edge-Object'){
                    var intersectionsList = perceptions[sensor][index]['sensor_intersections'];
                    if (intersectionsList.length === 2) {
                        Tank.displayEdge(intersectionsList[0], intersectionsList[1], 'yellow');
                    }
                    perception_log.push(("(" + perceptions[sensor][index]['object']['name'] + ") "));
                }

            }
            Log.debug(entity.name + " " + sensor + "'s [" + perception_log+']' , 3, entity.uuid+sensor+'name');
        }
    }

    if (!perceptions) {
        if (Math.random() > 0.5) {
            entity.rotate(5);
        } else {
            entity.rotate(-5);
        }
        entity.move(1);
    } else {
        if (Math.random() > 0.5) {
            entity.rotate(20);
        } else {
            entity.rotate(-20);
        }
    }
};

/**
 * This function is not meant to be called by you. It is called automatically for finalization at the end of every simulation step. Changes to visualization are performed afterwards
 * @param entity_list list of all entities
 * @param step_count number of simulation step
 * @param duration time simulation took
 */
var perform_simulation_step_finalization = function(entity_list, step_count, duration) {
    Log.debug('Performed simulation step ' + step_count + ' for ' + duration + 'ms', 1, "simulator_performing_step");
};