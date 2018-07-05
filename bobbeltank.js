/* global EntityCollection, bobbel_sensors, bobbel_entities, Log, Tank, Simulator, Entity */

//TIP: If you disable caching in webbrowser. Live.js reloads page on any changes of these files automatically
'use strict';

/**
 * @author Robin Nicolay <robin.nicolay@uni-rostock.de>
 */

/**
 * This function is called by Simulator automatically when program loaded or if "Restart" pressed
 *
 * Adds Entities defined in properties.js to Simulator
 *      EntityCollection.setEntities(bobbel_entities, bobbel_sensors);
 * and adds Edges defined in properties.js to Simulator
 *      EdgeCollection.setEdges(bobbel_edges);
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
 * This function is not meant to be called by you. Called in preparation of every Simulation step
 * Perform preparation steps here if you like

 * @param entity_list list of all entities that are included to simulation
 * @param step_count number of simulation step
 *
 */
var perform_simulation_step_initialization = function(entity_list, step_count){

};

/**
 * This function is not meant to be called by you. It is called automatically during Simulation step for every Entity-Object in EntityCollection
 * Perform you simulation code for every entity here!
 *
 * @param entity reference to current Entity-Object (see README.md)
 * @param perceptions object mapping sensornames to lists of perceived entities or null if empty (see README.md)
 * @param step_count number of simulation step
 */
var perform_simulation_step_on_entity = function(entity, perceptions, step_count){
    
    var marcoCoolDown = 250;
	var marcoHearRange = 300;
	var poloHearRange = 250;
	
    var marcoFac = 20;
    var poloFac = 25
    
    var marcoUncertainty = Math.random() > 0.5 ? Math.random() * marcoFac : -Math.random() * marcoFac;
    var poloUncertainty = Math.random() > 0.5 ? Math.random() * poloFac : -Math.random() * poloFac;  
	
	//Shout Marco-Polo
	
	if(entity.shouts) {
		if(entity.hasShouted)
			entity.hasShouted = false;
		else
			entity.shouts = false;
	}
	if(entity.isCatcher && Simulator.__last_marko + marcoCoolDown < step_count) {
        entity.shouts = true;
        Log.debug('MARCO ! (at ' + step_count + ')');
		entity.hasShouted = true;
        entity.nodeOfInterest = null;
		Simulator.__last_marko = step_count;
	}
	
    if (perceptions) {
		var closest_node = null;
        for (var sensor in perceptions) {
            var perception_log = [];
            for (var index in perceptions[sensor]){
				if (sensor == 'hear') {
					var perception = perceptions[sensor][index];

					if (perception['type'] === 'Entity-Object') {
						perception_log.push(("(" + perceptions[sensor][index]['object']['name']
							+ " dist " + Math.round(perceptions[sensor][index]['distance'])
							+ " " + Math.round(perceptions[sensor][index]['direction'])+ "°)"));
						
						if(perceptions[sensor][index]['object']['shouts'] == true) {
							if(!entity.isCatcher) {		// Target
								if (perceptions[sensor][index]['object']['isCatcher']) {
									Log.debug('POLO !');
									entity.shouts = true;
									entity.hasShouted = true;
									if (perceptions[sensor][index]['distance'] < poloHearRange) {
                                        var posX = perceptions[sensor][index]['object']['posX'];
                                        var posY = perceptions[sensor][index]['object']['posY'];

                                        var est_pos = entity.roughPosition(posX, posY, marcoFac, poloFac);
                                        entity.setPosNodeOfInterest(est_pos[0], est_pos[1]);
                                    }
									else
										entity.nodeOfInterest = null;
                                }
							} else					// Catcher
                                if ((closest_node === null || closest_node['distance'] > perceptions[sensor][index]['distance'] + marcoUncertainty ) 
                                        && perceptions[sensor][index]['distance'] + marcoUncertainty < marcoHearRange)
                                    closest_node = perceptions[sensor][index];
						}
					}

					if (perception['type'] === 'Edge-Object'){
						var intersectionsList = perceptions[sensor][index]['sensor_intersections'];
						if (intersectionsList.length === 2) {
							Tank.displayEdge(intersectionsList[0], intersectionsList[1], 'yellow');
						}
						perception_log.push(("(" + perceptions[sensor][index]['object']['name'] + ") "));
					}
				}
				if (entity.isCatcher && sensor === 'feel') {
                    var perception = perceptions[sensor][index];
                    if (perception['type'] === 'Entity-Object') {
                        Log.error(entity.name + " catches " + perception['object']['name'] + " !!");

                        Simulator.stop();
                        Simulator.__step_count = 0;
						Simulator.__last_marko = -1000;
                        load_bobbel_data();
                    }
				}
				if (!entity.isCatcher && sensor === 'see') {
                    var perception = perceptions[sensor][index];
                    if (perception['type'] === 'Entity-Object' && perceptions[sensor][index]['object']['isCatcher']) {
                        Log.debug(entity.name + " sees " + perception['object']['name'] + " !!");
						entity.setPosNodeOfInterest(perceptions[sensor][index]['object']['posX'], perceptions[sensor][index]['object']['posY']);
                    }
				}
            }
            // Log.debug(entity.name + " " + sensor + "'s [" + perception_log+']' , 3, entity.uuid+sensor+'name');
        }
        if(entity.isCatcher && closest_node != null 
            && (entity.nodeOfInterest === null 
                || Entity.__distanceBetweenTwoPoints(entity.posX, entity.posY, entity.nodeOfInterest[0], entity.nodeOfInterest[1]) > closest_node['distance'])) {
                    var pos = entity.roughPosition(closest_node['object']['posX'], closest_node['object']['posY'], marcoFac, poloFac);
                    entity.setPosNodeOfInterest(pos[0], pos[1]);
		}
    }

    // TODO: when hitting the tank barriers, the bobbel tend to "stick" to the wall
    // Alternatively, they could reverse their direction and move away from the wall

    if (!perceptions) {
        if (Math.random() > 0.5) {
            entity.rotate(5);
        } else {
            entity.rotate(-5);
        }
        entity.move(4);
    } else if (entity.isCatcher) {
        if (entity.nodeOfInterest != null) {
			var rot_delta = entity.getDirDelta();
			entity.rotate(rot_delta);
            entity.move(4);
			if(entity.movementRestricted) {
				EntityCollection.checkFishOutOfWater();
				if(entity.isCatcher)						//Check if Round continues
					entity.nodeOfInterest = null;
        } else {
            if (Math.random() > 0.5) {
                entity.rotate(5);
            } else {
                entity.rotate(-5);
            }
            entity.move(4);
        }
    } else if (!entity.isCatcher) {  
        if (entity.nodeOfInterest != null) {
			var rot_delta = entity.getDirDelta();
            if (Math.random() > 0.5)                entity.rotate(rot_delta + Math.random()*5);
            else
                entity.rotate(rot_delta - Math.random()*5);
            entity.move(4);
        } else {
            if (Math.random() > 0.5) {
                entity.rotate(5);
            } else {
                entity.rotate(-5);
            }
            entity.move(4);   
        } 
    }
};/**
 * This function is not meant to be called by you. It is called automatically for finalization at the end of every simulation step. Changes to visualization are performed afterwards
 * Perform you finalization code here if you like!
 *
 * @param entity_list list of all entities
 * @param step_count number of simulation step
 * @param duration time simulation took
 */
var perform_simulation_step_finalization = function(entity_list, step_count, duration) {
    Log.debug('Performed simulation step ' + step_count + ' for ' + duration + 'ms', 1, "simulator_performing_step");
};