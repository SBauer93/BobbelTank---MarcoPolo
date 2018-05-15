## Members

<dl>
<dt><a href="#bobbel_entities">bobbel_entities</a></dt>
<dd><p>List of Bobbel entities
[{bobbel_1},{bobbel_2},{bobbel_3},...]</p>
<p>Every Bobbel can have the following properties:</p>
<p> name is a name you define
 image an image path to a small round image
 position start coordinates
 direction direction of bobbel 0-360 degree. 0 is looking along x-axis, 90 along y-axis etc...
 color displays a colored ring around a bobbel
 perception list of sensor-tags defined in bobbel_sensors</p>
<p> example</p>
<pre><code> {
      name: &quot;Malotzki&quot;,
      image: &quot;images/150x150_bubble.png&quot;,
      color: &quot;cyan&quot;,
      position : [10,80],
      perceptions : [&quot;pirate&quot;],
      direction : 20
  }
</code></pre></dd>
<dt><a href="#bobbel_sensors">bobbel_sensors</a></dt>
<dd><p>Sensor definitions. Sensors are referenced by an sensor tag (used to attach sensors to bobbels)</p>
<pre><code> {
     sensortag_1: {sensor_desc_1},
     sensortag_2: {sensor_desc_2},
     sensortag_3: {sensor_desc_3}
 }
</code></pre><p>Every Sensor has the follogin properties</p>
<p> perimeter   defines the sensor polygon (list of points) around an entity
             The entity can be seen at position (0,0) Looking to direction 0 (along x-axis)
             All points defined for sensor polygon are in relation to this entity
 color       in which sensor is displayed</p>
<pre><code> see: {                                         // sensor has tag see
     perimeter: [[0,0], [40,20], [40,-20]],     // spans a triangle from entity (0,0) forward to X 40 and span -20 to 20
     color : &quot;#FFDD00&quot;                          // is displayed yellow
 }
</code></pre></dd>
<dt><a href="#simulator_parameters">simulator_parameters</a> : <code>Object</code></dt>
<dd><p>Parameters for simulator
You can define your own background image, set entities movement limitations or define log level (debug, info, error)
If not limited the entities don&#39;t stop at simulators borders</p>
</dd>
</dl>

<a name="bobbel_entities"></a>

## bobbel_entities
List of Bobbel entities[{bobbel_1},{bobbel_2},{bobbel_3},...]Every Bobbel can have the following properties: name is a name you define image an image path to a small round image position start coordinates direction direction of bobbel 0-360 degree. 0 is looking along x-axis, 90 along y-axis etc... color displays a colored ring around a bobbel perception list of sensor-tags defined in bobbel_sensors example     {          name: "Malotzki",          image: "images/150x150_bubble.png",          color: "cyan",          position : [10,80],          perceptions : ["pirate"],          direction : 20      }

**Kind**: global variable  
<a name="bobbel_sensors"></a>

## bobbel_sensors
Sensor definitions. Sensors are referenced by an sensor tag (used to attach sensors to bobbels)     {         sensortag_1: {sensor_desc_1},         sensortag_2: {sensor_desc_2},         sensortag_3: {sensor_desc_3}     }Every Sensor has the follogin properties perimeter   defines the sensor polygon (list of points) around an entity             The entity can be seen at position (0,0) Looking to direction 0 (along x-axis)             All points defined for sensor polygon are in relation to this entity color       in which sensor is displayed     see: {                                         // sensor has tag see         perimeter: [[0,0], [40,20], [40,-20]],     // spans a triangle from entity (0,0) forward to X 40 and span -20 to 20         color : "#FFDD00"                          // is displayed yellow     }

**Kind**: global variable  
<a name="simulator_parameters"></a>

## simulator_parameters : <code>Object</code>
Parameters for simulatorYou can define your own background image, set entities movement limitations or define log level (debug, info, error)If not limited the entities don't stop at simulators borders

**Kind**: global variable  
