# Bobble-Tank

A little web-based simulator for cognitive multi agent interactions. Runs out of the box. Just open index.html in your web-browser.
![](doc/ScreenShot.png)

## Overview
This simulator can be used to implement little entities with sensors in a simple 2D-World.

It has a tiny user api and configuration interface. The whole rest of the project is focused on simplicity and heavy documentation.

Feel free to try the default setup and implement some easy behaviors.

### Files
The project contains the following files..

* **doc/**		Documentation Folder
* **images/**	Folder containing Images
* **lib/**		Used libraries, such as jquery, bootstrap etc.
* **bobbeltank.core.css**	Simulators default stylesheet
* **bobbeltank.core.js**	Simulators default functionality
* **bobbeltank.js** Your javascript entry-point to add functionality
* **properties.js** Your javascript entry-point to configure parameters
* **index.html** HTML-Webpage for Layout

For you mostly relevant are:

1. **properties.js** Here you can define bobbels position, direction etc. here and attach sensors. Sensors are defined here as well. At the end you can set simulation parameters. [properties.js documentation](doc/properties.md)
2. **bobbeltank.js** This file contains functions that are called by the simulation process. Relevant information are provided as parameters. You can add your own functionality into these function-bodies. [bobbeltank.js documentation](doc/bobbeltank.md)

If you want to use additonal core functionality like painting things, change html layout etc. you can use (and if necessary rewrite) the core-files. [bobbeltank.core.js documentation](doc/bobbeltank.core.md)

Two hints:

1. This project uses [live.js](http://livejs.com). If you use a web-server such as *mamp* to host this project and deactivate our browser cache (mostly somewhere in debug mode). Page refreshes automatically if you change something
2. This project uses [PolyK](http://polyk.ivank.net). And the Entities provide their sensor polygons also automatically as polyk sensor polygons. If you do polygon calculations, you can use this library.