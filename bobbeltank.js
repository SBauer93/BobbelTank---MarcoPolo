/**
 * Called once after Program loaded or if "Restart" pressed
 *
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
 * Called during Simulation step for every entity
 * @param entity current entity object
 * @param perceptions current perceptions
 *          {
 *              sensortag_1: [perceived_entity_object_1, perceived_entity_object_2, perceived_entity_object_3, ...],
 *              sensortag_2: ...
 *          }
 *
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