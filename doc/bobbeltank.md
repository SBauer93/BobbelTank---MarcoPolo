## Functions

<dl>
<dt><a href="#load_bobbel_data">load_bobbel_data()</a></dt>
<dd><p>Called once after Program loaded or if &quot;Restart&quot; pressed
Adds Entities defined in properties.js to Simulator
     EntityCollection.setEntities(bobbel_entities, bobbel_sensors);</p>
<p>You can perform additional actions for startup here if you with</p>
</dd>
<dt><a href="#perform_simulation_step_initialization">perform_simulation_step_initialization(entity_list, step_count)</a></dt>
<dd><p>Called in preparation of every Simulation step</p>
</dd>
<dt><a href="#perform_simulation_step_on_entity">perform_simulation_step_on_entity(entity, perceptions, step_count)</a></dt>
<dd><p>Called during Simulation step for every entity in Simulation</p>
<p>Entity&#39;s states are contained in it&#39;s properties. You can read and persistently chang properties during simulation
       (example use: entity.name)</p>
<pre><code>     {
         name:                   string name of an entity provided in properties.js
         img_src:                image path provided in properties.js
         color:                  color provided in properties.js
         posX:                   number with X-coordinate. If changed directly call entity.updateSensors() to update polygons
         posY:                   number with Y-coordinate. If changed directly call entity.updateSensors() to update polygons
         direction:              rotation of entity in degrees (0-360) 0 is along x-axis 90 along y-axis ... If changed directly call entity.updateSensors() to update polygons
         sensor_colors:          object providing sensor color for every sensor. Use entity.sensor_colors[&lt;sensorname&gt;]
         sensor_polygons:        object contains calculated sensor polygons around entity based on current position and direction Use entity.sensor_polygons[&lt;sensorname&gt;]
         uuid:                   generated unique-id. Use to reference entity instead of name-property if you use same name for multiple entities
         movementRestricted:     true if entities movement is restricted into boundaries (tank for example). false else
         restrictedXmin          number if movement restricted. null else
         restrictedXmax          number if movement restricted. null else
         restrictedYmin          number if movement restricted. null else
         restrictedYmax          number if movement restricted. null else
         polyk_sensor_polygons:  same object as sensor_polygons but in other format needed by library PolyK
                                 PolyK is included in this project and helps with polygon-functions
                                 See (http://polyk.ivank.net/?p=documentation) for documentation
     }

   Entity has included functions helping you to move and rotate an Entity-Object

     entity.move(distance_in_px) // moves towards current direction and updates sensor_polygons
     entity.rotate(degree)       // (0-360) rotates direction counterclockwise (-degree clockwise) and updates sensors
     entity.updateSensors()      // if you change posX, posY or direction yourself this updates sensorpolygons for you
     entity.getPerceptions(pos_list, obj_list) // Determines for positions if they are perceived by entity. Returns object with same index from obj_list, position, distance, direction ...
     entity.toString()           // overrides default string output method providing some debug info if necessary

   Entity has included static functions helping you to perform some coordinate calculations

     Entity.__rotateAroundOrigin(x, y, originX, originY, angle)      // returns rotated point with x,y around origin
     Entity.__distanceBetweenTwoPoints(x1, y1, x2, y2)               // returns distance between two points
     Entity.__angleBetweenPoints(x1, y1, x2, y2)                     // returns direction between xy1 and xy2 in degrees
     Entity.__pointInPolygon(x, y, polygon)                          // returns true if x,y are inside polygon [[x,y],[x,y],...]
</code></pre><p>Perceptions-Object looks like this</p>
<pre><code>     {
         sensortag_1: [perceived_entity_object_1, perceived_entity_object_2, perceived_entity_object_3, ...],
         sensortag_2: ...
     }

with perceived_entity_object_n
     {
         position: [x,y],
         distance: number,
         orientation: number in relation to own position
         entity: {...} reference to perceived entity
     }
</code></pre></dd>
<dt><a href="#perform_simulation_step_finalization">perform_simulation_step_finalization(entity_list, step_count, duration)</a></dt>
<dd><p>Called for finalization at the end of every simulation step. Changes to visualization are performed afterwards</p>
</dd>
</dl>

<a name="load_bobbel_data"></a>

## load_bobbel_data()
Called once after Program loaded or if "Restart" pressed
Adds Entities defined in properties.js to Simulator
     EntityCollection.setEntities(bobbel_entities, bobbel_sensors);

You can perform additional actions for startup here if you with

**Kind**: global function  
<a name="perform_simulation_step_initialization"></a>

## perform_simulation_step_initialization(entity_list, step_count)
Called in preparation of every Simulation step

**Kind**: global function  

| Param | Description |
| --- | --- |
| entity_list | list of all entities that are included to simulation |
| step_count | number of simulation step |

<a name="perform_simulation_step_on_entity"></a>

## perform_simulation_step_on_entity(entity, perceptions, step_count)
Called during Simulation step for every entity in Simulation

Entity's states are contained in it's properties. You can read and persistently chang properties during simulation
       (example use: entity.name)

         {
             name:                   string name of an entity provided in properties.js
             img_src:                image path provided in properties.js
             color:                  color provided in properties.js
             posX:                   number with X-coordinate. If changed directly call entity.updateSensors() to update polygons
             posY:                   number with Y-coordinate. If changed directly call entity.updateSensors() to update polygons
             direction:              rotation of entity in degrees (0-360) 0 is along x-axis 90 along y-axis ... If changed directly call entity.updateSensors() to update polygons
             sensor_colors:          object providing sensor color for every sensor. Use entity.sensor_colors[<sensorname>]
             sensor_polygons:        object contains calculated sensor polygons around entity based on current position and direction Use entity.sensor_polygons[<sensorname>]
             uuid:                   generated unique-id. Use to reference entity instead of name-property if you use same name for multiple entities
             movementRestricted:     true if entities movement is restricted into boundaries (tank for example). false else
             restrictedXmin          number if movement restricted. null else
             restrictedXmax          number if movement restricted. null else
             restrictedYmin          number if movement restricted. null else
             restrictedYmax          number if movement restricted. null else
             polyk_sensor_polygons:  same object as sensor_polygons but in other format needed by library PolyK
                                     PolyK is included in this project and helps with polygon-functions
                                     See (http://polyk.ivank.net/?p=documentation) for documentation
         }

       Entity has included functions helping you to move and rotate an Entity-Object

         entity.move(distance_in_px) // moves towards current direction and updates sensor_polygons
         entity.rotate(degree)       // (0-360) rotates direction counterclockwise (-degree clockwise) and updates sensors
         entity.updateSensors()      // if you change posX, posY or direction yourself this updates sensorpolygons for you
         entity.getPerceptions(pos_list, obj_list) // Determines for positions if they are perceived by entity. Returns object with same index from obj_list, position, distance, direction ...
         entity.toString()           // overrides default string output method providing some debug info if necessary
         
       Entity has included static functions helping you to perform some coordinate calculations
       
         Entity.__rotateAroundOrigin(x, y, originX, originY, angle)      // returns rotated point with x,y around origin
         Entity.__distanceBetweenTwoPoints(x1, y1, x2, y2)               // returns distance between two points
         Entity.__angleBetweenPoints(x1, y1, x2, y2)                     // returns direction between xy1 and xy2 in degrees
         Entity.__pointInPolygon(x, y, polygon)                          // returns true if x,y are inside polygon [[x,y],[x,y],...]

Perceptions-Object looks like this

         {
             sensortag_1: [perceived_entity_object_1, perceived_entity_object_2, perceived_entity_object_3, ...],
             sensortag_2: ...
         }

    with perceived_entity_object_n
         {
             position: [x,y],
             distance: number,
             orientation: number in relation to own position
             entity: {...} reference to perceived entity
         }

**Kind**: global function  

| Param | Description |
| --- | --- |
| entity | reference to current entity object |
| perceptions | object mapping sensornames to lists of perceived entities or null if empty* |
| step_count | number of simulation step |

<a name="perform_simulation_step_finalization"></a>

## perform_simulation_step_finalization(entity_list, step_count, duration)
Called for finalization at the end of every simulation step. Changes to visualization are performed afterwards

**Kind**: global function  

| Param | Description |
| --- | --- |
| entity_list | list of all entities |
| step_count | number of simulation step |
| duration | time simulation took |

