## Classes

<dl>
<dt><a href="#Entity">Entity</a></dt>
<dd></dd>
</dl>

## Objects

<dl>
<dt><a href="#Tank">Tank</a> : <code>object</code></dt>
<dd><p>Tank is the visualisation component of the simulator.</p>
<p>Tank provides different canvas elements.
 visible_canvas  is visible canvas. Should not be used directly. It is updated on Tank.flush() with content of scratch_canvas and image_canvas
 scratch_canvas  is a non visible canvas element. Is used during single paint processes. Its content is transfered to visible_canvas on Tank.flush()
 image_canvas    is a non visible canvas element. Is used during single paint operations by user and image loading processes.
                 Its content is transfered to visible_canvas on Tank.flush() as top layer</p>
</dd>
<dt><a href="#Simulator">Simulator</a> : <code>object</code></dt>
<dd><p>Simulator is the runner component. It handles action invervalls, start, stop and performs simulation steps</p>
</dd>
<dt><a href="#ControlPanel">ControlPanel</a> : <code>object</code></dt>
<dd><p>Handles user input with web controls</p>
</dd>
<dt><a href="#Log">Log</a> : <code>object</code></dt>
<dd><p>Logging object. Provides logging output in web app.</p>
</dd>
<dt><a href="#EntityCollection">EntityCollection</a> : <code>object</code></dt>
<dd><p>Handles all Entities in the system. Some kind of entity database where the bobbels live</p>
</dd>
</dl>

<a name="Entity"></a>

## Entity
**Kind**: global class  

* [Entity](#Entity)
    * [new Entity(entity_object, sensors_object)](#new_Entity_new)
    * [.move(distance)](#Entity+move)
    * [.rotate(degrees)](#Entity+rotate)
    * [.setMovementBounds(minX, minY, maxX, maxY)](#Entity+setMovementBounds)
    * [.updateSensors()](#Entity+updateSensors)
    * [.getPerceptions(perceivable_positions_list, perceivable_objects_list)](#Entity+getPerceptions) ⇒ <code>String</code>
    * [.toString()](#Entity+toString) ⇒ <code>string</code>

<a name="new_Entity_new"></a>

### new Entity(entity_object, sensors_object)
/**
Entity Class description. Use var foo = new Entity(entity_object, sensors_object)
(To reference the entity use the unique ID instead of the name)
Entities properties are:

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


| Param | Description |
| --- | --- |
| entity_object | is an single entity object from properties.js with keys name, image, position etc.. |
| sensors_object |  |

<a name="Entity+move"></a>

### entity.move(distance)
Moves entity distance px along current direction

**Kind**: instance method of [<code>Entity</code>](#Entity)  

| Param |
| --- |
| distance | 

<a name="Entity+rotate"></a>

### entity.rotate(degrees)
Rotates entity degrees (0-360). Positive degrees rotates counterclockwise negative clockwise

**Kind**: instance method of [<code>Entity</code>](#Entity)  

| Param | Description |
| --- | --- |
| degrees | in deg 0-360 |

<a name="Entity+setMovementBounds"></a>

### entity.setMovementBounds(minX, minY, maxX, maxY)
Restricts movement of entities to these coordinates. (Verified in move() and updateSensors() method)

**Kind**: instance method of [<code>Entity</code>](#Entity)  

| Param |
| --- |
| minX | 
| minY | 
| maxX | 
| maxY | 

<a name="Entity+updateSensors"></a>

### entity.updateSensors()
Updates entities sensor_polygons etc. according to position and direction properties

**Kind**: instance method of [<code>Entity</code>](#Entity)  
<a name="Entity+getPerceptions"></a>

### entity.getPerceptions(perceivable_positions_list, perceivable_objects_list) ⇒ <code>String</code>
Returns perceptions of Entitie's sensors. 
It needs two lists with same length. Based on a list of perceivable positions it returns object with same index
If nothing is perceived returns null

perceptions
     
     {
         sensorname_1: [
             {
                 "entity": //reference to perceived object
                 "position" // position of perceived object
                 "distance" // distance to perceived object
                 "direction" // direction to perceived object (corresponding to own direction)
             }, {
                 ...
             }, 
             ...
         ],
         sensorname_2: [...],
         ...
     }

**Kind**: instance method of [<code>Entity</code>](#Entity)  

| Param | Type | Description |
| --- | --- | --- |
| perceivable_positions_list | <code>array</code> | list of perceivable positions |
| perceivable_objects_list | <code>array</code> | list of objects at these positions |

<a name="Entity+toString"></a>

### entity.toString() ⇒ <code>string</code>
Overrides default string output for Entity class

**Kind**: instance method of [<code>Entity</code>](#Entity)  
<a name="Tank"></a>

## Tank : <code>object</code>
Tank is the visualisation component of the simulator.

Tank provides different canvas elements.
 visible_canvas  is visible canvas. Should not be used directly. It is updated on Tank.flush() with content of scratch_canvas and image_canvas
 scratch_canvas  is a non visible canvas element. Is used during single paint processes. Its content is transfered to visible_canvas on Tank.flush()
 image_canvas    is a non visible canvas element. Is used during single paint operations by user and image loading processes.
                 Its content is transfered to visible_canvas on Tank.flush() as top layer

**Kind**: global namespace  

* [Tank](#Tank) : <code>object</code>
    * [.init()](#Tank.init)
    * [.displayEntity(entity)](#Tank.displayEntity)
    * [.displayPerception(sensorPolygon, color)](#Tank.displayPerception)
    * [.displayEntityColor(color, posX, posY, radius)](#Tank.displayEntityColor)
    * [.displayImage(source, posX, posY, sizeX, sizeY)](#Tank.displayImage)
    * [.displayCoords()](#Tank.displayCoords)
    * [.flush()](#Tank.flush)
    * [.setBackground(path)](#Tank.setBackground)

<a name="Tank.init"></a>

### Tank.init()
Called on page ready. Initializes Tank's properties and canvas objects

**Kind**: static method of [<code>Tank</code>](#Tank)  
<a name="Tank.displayEntity"></a>

### Tank.displayEntity(entity)
Prints a complete entity with perceptions, color and image to canvas (if not prevented by Tank.show... properties)
Prints to scratch_canvas (to be visible Tank.flush() has to be performed)

**Kind**: static method of [<code>Tank</code>](#Tank)  

| Param | Description |
| --- | --- |
| entity | an entity object |

<a name="Tank.displayPerception"></a>

### Tank.displayPerception(sensorPolygon, color)
Prints a sensor- (or normal) Polygon to canvas (if not prevented by Tank.show... properties)
Prints to scratch_canvas (to be visible Tank.flush() has to be performed)

**Kind**: static method of [<code>Tank</code>](#Tank)  

| Param | Description |
| --- | --- |
| sensorPolygon | Polygon list of points [[x,y], [x,y], [x,y], ... ] |
| color | fill color |

<a name="Tank.displayEntityColor"></a>

### Tank.displayEntityColor(color, posX, posY, radius)
Prints a colored circle (used to highlight entities) at given position to canvas (if not prevented by Tank.show... properties)
Prints to scratch_canvas (to be visible Tank.flush() has to be performed)

**Kind**: static method of [<code>Tank</code>](#Tank)  

| Param | Description |
| --- | --- |
| color | colorcode |
| posX | x-pos |
| posY | y-pos |
| radius | radius of circle in px |

<a name="Tank.displayImage"></a>

### Tank.displayImage(source, posX, posY, sizeX, sizeY)
Adds image with specified source path to image_canvas.
For better performance image data is cached in Tank.image_cache
If images are loading (can happen delayed) the Tank.flush() is redirected to finished image loading

**Kind**: static method of [<code>Tank</code>](#Tank)  

| Param | Description |
| --- | --- |
| source | path to image |
| posX | position of image |
| posY | position of image |
| sizeX | size in pixel of image |
| sizeY | size in pixel of image |

<a name="Tank.displayCoords"></a>

### Tank.displayCoords()
Displays coords on visible canvas corners.
Is called during Tank.flush automatically during cleanup if not prevented by Tank.show.. properties

**Kind**: static method of [<code>Tank</code>](#Tank)  
<a name="Tank.flush"></a>

### Tank.flush()
A flush performs following tasks (can be delayed if still images are loading)
Cleans visible canvas
Transfers content from image- and scretch- canvas to visible canvas
Cleans image- and scratch- canvas to be ready for new content

!Important make sure you request flush() only if you are done painting on scratch- and image-canvas (ex. end of complete simulation step)
All content beeing on visible canvas will be removed before flush. All content on scratch- and image-canvas will be removed after flush

**Kind**: static method of [<code>Tank</code>](#Tank)  
<a name="Tank.setBackground"></a>

### Tank.setBackground(path)
Sets tank background to given path

**Kind**: static method of [<code>Tank</code>](#Tank)  

| Param |
| --- |
| path | 

<a name="Simulator"></a>

## Simulator : <code>object</code>
Simulator is the runner component. It handles action invervalls, start, stop and performs simulation steps

**Kind**: global namespace  

* [Simulator](#Simulator) : <code>object</code>
    * [.setInterval(timespan)](#Simulator.setInterval)
    * [.stop()](#Simulator.stop)
    * [.performStep()](#Simulator.performStep)

<a name="Simulator.setInterval"></a>

### Simulator.setInterval(timespan)
Sets simulation to perform a simulation step all timespan milliseconds

**Kind**: static method of [<code>Simulator</code>](#Simulator)  

| Param | Description |
| --- | --- |
| timespan | time between simulation steps in ms |

<a name="Simulator.stop"></a>

### Simulator.stop()
Stops simulation interval (pause no reset)

**Kind**: static method of [<code>Simulator</code>](#Simulator)  
<a name="Simulator.performStep"></a>

### Simulator.performStep()
****************************************
******************************************
Performs a single simulation step and calls user functions in bobbeltank.js
******************************************
****************************************

**Kind**: static method of [<code>Simulator</code>](#Simulator)  
<a name="ControlPanel"></a>

## ControlPanel : <code>object</code>
Handles user input with web controls

**Kind**: global namespace  
<a name="ControlPanel.setVisDisabled"></a>

### ControlPanel.setVisDisabled(disabled)
Sets user controls to disabled visualisation

**Kind**: static method of [<code>ControlPanel</code>](#ControlPanel)  

| Param |
| --- |
| disabled | 

<a name="Log"></a>

## Log : <code>object</code>
Logging object. Provides logging output in web app.

**Kind**: global namespace  

* [Log](#Log) : <code>object</code>
    * [.init()](#Log.init)
    * [.setLogLevel(logLevel)](#Log.setLogLevel)
    * [.info(message, time, tag)](#Log.info)
    * [.debug(message, time, tag)](#Log.debug)
    * [.error(message, time, tag)](#Log.error)

<a name="Log.init"></a>

### Log.init()
Initializes application log. Redirects console.log to web page
(do not use console.log anymore. Use Log.debug, Log.info or Log.error instead)

**Kind**: static method of [<code>Log</code>](#Log)  
<a name="Log.setLogLevel"></a>

### Log.setLogLevel(logLevel)
Sets log levels
debug shows all messages
info hides debug messages
error hides debug and info messages. error are displayed only

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Description |
| --- | --- |
| logLevel | can be debug, info or error |

<a name="Log.info"></a>

### Log.info(message, time, tag)
Adds message of level info to log

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Description |
| --- | --- |
| message | log message |
| time | display time in seconds |
| tag | a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates) |

<a name="Log.debug"></a>

### Log.debug(message, time, tag)
Adds message of level debug to log

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Description |
| --- | --- |
| message | log message |
| time | display time in seconds |
| tag | a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates) |

<a name="Log.error"></a>

### Log.error(message, time, tag)
Adds message of level error to log

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Description |
| --- | --- |
| message | log message |
| time | display time in seconds |
| tag | a message. New message with tag replace former message with same tag (like a own chanel for fast parameter updates) |

<a name="EntityCollection"></a>

## EntityCollection : <code>object</code>
Handles all Entities in the system. Some kind of entity database where the bobbels live

**Kind**: global namespace  

* [EntityCollection](#EntityCollection) : <code>object</code>
    * [.setEntities(input_entities, sensors)](#EntityCollection.setEntities)
    * [.addEntity(input_entity, sensors)](#EntityCollection.addEntity) ⇒ [<code>Entity</code>](#Entity)
    * [.removeEntityAtIndex(index)](#EntityCollection.removeEntityAtIndex)
    * [.removeEntityWithUUID(uuid)](#EntityCollection.removeEntityWithUUID) ⇒ <code>\*</code>
    * [.setMovementBounds(minX, minY, maxX, maxY)](#EntityCollection.setMovementBounds)
    * [.clearMovementBounds()](#EntityCollection.clearMovementBounds)
    * [.getEntities()](#EntityCollection.getEntities) ⇒ <code>Array</code>
    * [.getPositions()](#EntityCollection.getPositions) ⇒ <code>Array</code>
    * [.getPerceivedEntities(own_pos, polyk_polygons_object)](#EntityCollection.getPerceivedEntities) ⇒ <code>null</code>
    * [.getEntityByIndex(index)](#EntityCollection.getEntityByIndex) ⇒ <code>\*</code>
    * [.getEntityByUUID(uuid)](#EntityCollection.getEntityByUUID) ⇒ <code>\*</code>

<a name="EntityCollection.setEntities"></a>

### EntityCollection.setEntities(input_entities, sensors)
Adds entities and sensor information as defined in properties.js to data model
Generates an instance of Entity.class for every entity in properties.js

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  

| Param | Description |
| --- | --- |
| input_entities | list of Entities as defined in properties.js |
| sensors | sensor-object as defined in properties.js |

<a name="EntityCollection.addEntity"></a>

### EntityCollection.addEntity(input_entity, sensors) ⇒ [<code>Entity</code>](#Entity)
Adds a single entity to the end of the EntitiesCollection list. Additionally (!) returns a reference to Entity-Object

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  
**Returns**: [<code>Entity</code>](#Entity) - additionally returns this reference. Entity is already added  

| Param | Description |
| --- | --- |
| input_entity | single input entry as defined in properties.js |
| sensors | sensor definition as defined in properties.js |

<a name="EntityCollection.removeEntityAtIndex"></a>

### EntityCollection.removeEntityAtIndex(index)
Removes Entity from List with index

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  

| Param |
| --- |
| index | 

<a name="EntityCollection.removeEntityWithUUID"></a>

### EntityCollection.removeEntityWithUUID(uuid) ⇒ <code>\*</code>
Removes Entity having this uuid

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  

| Param |
| --- |
| uuid | 

<a name="EntityCollection.setMovementBounds"></a>

### EntityCollection.setMovementBounds(minX, minY, maxX, maxY)
Transfers movement boundaries (such as tank size) into all entities

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  

| Param | Description |
| --- | --- |
| minX | boundary position |
| minY | boundary position |
| maxX | boundary position |
| maxY | boundary position |

<a name="EntityCollection.clearMovementBounds"></a>

### EntityCollection.clearMovementBounds()
Removes all boundaries from entities

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  
<a name="EntityCollection.getEntities"></a>

### EntityCollection.getEntities() ⇒ <code>Array</code>
Returns list of entity objects [{entity_1},{entity_2},{entity_3},...]

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  
<a name="EntityCollection.getPositions"></a>

### EntityCollection.getPositions() ⇒ <code>Array</code>
Returns list of positions for all entities [[x,y],[x,y],[x,y],...]

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  
<a name="EntityCollection.getPerceivedEntities"></a>

### EntityCollection.getPerceivedEntities(own_pos, polyk_polygons_object) ⇒ <code>null</code>
Gets set of perception polygons (have to be in wired polyk format provided by Entity-Object)

polyk_polygons_object
     {
         sensorname_1: [polyk_coords],
         sensorname_2: [polyk_coords],
         sensorname_n: [polyk_coords]
     }

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  
**Returns**: <code>null</code> - perceived object {sensorname_1: [list_of_perceived_entities],sensorname_2: [list_of_perceived_entities],..} or null if empty  

| Param | Description |
| --- | --- |
| own_pos | position of Entity-Object itself. (Would perceive itself otherwise) |
| polyk_polygons_object | sensor polygon in polyk format provided by Entity |

<a name="EntityCollection.getEntityByIndex"></a>

### EntityCollection.getEntityByIndex(index) ⇒ <code>\*</code>
Helper function

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  

| Param |
| --- |
| index | 

<a name="EntityCollection.getEntityByUUID"></a>

### EntityCollection.getEntityByUUID(uuid) ⇒ <code>\*</code>
If you need to get an entity by uuid

**Kind**: static method of [<code>EntityCollection</code>](#EntityCollection)  

| Param |
| --- |
| uuid | 

