## Functions

<dl>
<dt><a href="#load_bobbel_data">load_bobbel_data()</a></dt>
<dd><p>This function is not meant to be called by you. It is called automatically once after Program loaded or if &quot;Restart&quot; pressed
Adds Entities defined in properties.js to Simulator
     EntityCollection.setEntities(bobbel_entities, bobbel_sensors);</p>
<p>You can perform additional actions for startup here if you wish</p>
</dd>
<dt><a href="#perform_simulation_step_initialization">perform_simulation_step_initialization(entity_list, step_count)</a></dt>
<dd><p>Called in preparation of every Simulation step</p>
</dd>
<dt><a href="#perform_simulation_step_on_entity">perform_simulation_step_on_entity(entity, perceptions, step_count)</a></dt>
<dd><p>This function is not meant to be called by you. It is called automatically during Simulation step for every Entity-Object in EntityCollection</p>
</dd>
<dt><a href="#perform_simulation_step_finalization">perform_simulation_step_finalization(entity_list, step_count, duration)</a></dt>
<dd><p>This function is not meant to be called by you. It is called automatically for finalization at the end of every simulation step. Changes to visualization are performed afterwards</p>
</dd>
</dl>

<a name="load_bobbel_data"></a>

## load_bobbel_data()
This function is not meant to be called by you. It is called automatically once after Program loaded or if "Restart" pressed
Adds Entities defined in properties.js to Simulator
     EntityCollection.setEntities(bobbel_entities, bobbel_sensors);

You can perform additional actions for startup here if you wish

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
This function is not meant to be called by you. It is called automatically during Simulation step for every Entity-Object in EntityCollection

**Kind**: global function  

| Param | Description |
| --- | --- |
| entity | reference to current Entity-Object (see README.md) |
| perceptions | object mapping sensornames to lists of perceived entities or null if empty (see README.md) |
| step_count | number of simulation step |

<a name="perform_simulation_step_finalization"></a>

## perform_simulation_step_finalization(entity_list, step_count, duration)
This function is not meant to be called by you. It is called automatically for finalization at the end of every simulation step. Changes to visualization are performed afterwards

**Kind**: global function  

| Param | Description |
| --- | --- |
| entity_list | list of all entities |
| step_count | number of simulation step |
| duration | time simulation took |

