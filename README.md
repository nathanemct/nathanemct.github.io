# Interactive solutions to data sonification challenges - blog

## About

This blog details the milestones in regards to the project "Interactive solutions to data sonification challenges". In this project a data set will be collected using an Arduino and relevant sensors to collect information about a plant's environment. This data will be fed into an RNBO patch to sonfiy it's features and characteristics. This RNBO patch will be exported to JavaScript and a new user interface will be built using the p5.js library.

## Monday 6th February

### Building a test RNBO patch
The first step in this project is to build a test patch in RNBO. The environment is similar to Max but there are some differences which need to be understood, in particular how RNBO uses 'param' objects so that parameters can be accessed by other programs once the patch is exported externally. The other reason to go through this test is to understand what code is produced when the patch is exported. The test patch keeps things very simple: it is effectively a sinewave generator with an ADSR function attached.

<img width="811" alt="Screenshot 2023-02-06 at 16 32 42" src="https://user-images.githubusercontent.com/123555981/217029185-b43a4ef6-c4e2-410b-a5d1-57f04e4b9021.png">


### Exporting patch to JavaScript and hosting on local server
Using the export to JavaScript function, and following the steps outlined in RNBO's help files (https://rnbo.cycling74.com/learn/exporting-to-the-web-export-target) the test patch is exported to JS. Now that the code is available, it needs to be understood, and the RNBO JavaScript API Reference studied (https://rnbo.cycling74.com/js)

<img width="1059" alt="Screenshot 2023-02-06 at 16 38 43" src="https://user-images.githubusercontent.com/123555981/217030738-8ae18475-bafd-495d-87df-a28dd998eb1c.png">

With this the patch is hosted locally and is able to used in browser (https://rnbo.cycling74.com/learn/loading-a-rnbo-device-in-the-browser-js). The attack, decay, sustain and release parameters are available to modify using the in-built sliders that are part of the export's standard user interface. There are also MIDI note buttons which can be clicked in order to play the simple synth. 

<img width="579" alt="Screenshot 2023-02-06 at 16 43 09" src="https://user-images.githubusercontent.com/123555981/217031812-f1a69f4e-7377-45a6-aa81-2df78b5ac8a4.png">

### Creating a rough UI
I have also began sketching out draft ideas for the user interface for the project. The idea is that the user will be able to navigate the web-based app using the arrow keys, and then interact with certain aspects of the sonified data when in contact with shapes in the environment. In the example below a full page canvas has been created. The crosshairs indicate the position of the user in the environment and the red circle indicates an area that can be interacted with. The next step is understanding how the RNBO code can be incorporated into such an initial sketch.


<img width="2560" alt="Screenshot 2023-02-06 at 16 48 36" src="https://user-images.githubusercontent.com/123555981/217033871-82153d09-d335-43a1-b715-af6acfdc4822.png">


### Obtaining relevant sensors
The soil moisture, sunlight, temperature, humidity, and air quality will be monitored using a range of sensors connected to my own Arduino and some sensors that are available externally (i.e the air quality sensors are located on the same streets and the readings are accessible online). The sensors that I currently do not possess (soil moisture and sunlight) are on order. Once these arrive I will create the 'datahub' of all the sensors attached to the Arduino and begin testing to understand what data shapes these produce (although I have a reasonable idea of these shapes already). This will inform how the final data will be sonified in the RNBO patch.


## Monday 20th February
### Setting up the sensors
All the Arduino sensors have arrived from various places (finally). This means that the Arduino can be set up to start collecting the data that will be sonified. There is a sunlight sensor which collects UV, infrared and visible light metrics; a temperature and humidity sensor; and a soil moisture sensor which detects the humidity within the soil itself. All these metrics are vital for healthy plant growth.

The sensors are now connected to the Arduino, which is sending the sensor information to the serial monitor via CoolTerm software. This enables the serial monitor information to be copied and stored elsewhere (currently it is not possible to copy vast amounts of data straight from the Arduino serial monitor for some reason...)

Here is the Arduino set up:

![IMG_5513](https://user-images.githubusercontent.com/123555981/220167690-68775633-dba6-4d57-9ab1-02f2f803b177.jpg)

And here is the data being written to CoolTerm:

![datacollection](https://user-images.githubusercontent.com/123555981/220167893-5e40cde5-8a57-4997-84ce-07b6bb826990.jpg)

## Tuesday 28th February
### Finishing the basic UI and interactive functions

The basic user interface for the project is complete. This will form the basis for the rest of the project and can be expanded from here. When the user moves into the shape on the canvas, they will be able to access the parameters of the RNBO synth. In this basic UI the RNBO JavaScript code has been successfully integrated into the p5 sketch. This means that the basic sinewave generator is able to be played using the A-Z keys on the keyboard, and the ADSR values change when accessing the shape. 

Here is a screen shot of the suqsequent UI and code:

<img width="2407" alt="Screenshot 2023-02-28 at 09 37 23" src="https://user-images.githubusercontent.com/123555981/221814438-23cc7dc6-9e8e-4b12-92aa-6eaba94416a2.png">


## Friday 21st April
### RNBO patching and data collection
The past few weeks have been dedicated to collecting the data for the sonifications and creating the Max and RNBO patches into which the data will flow through. For the former, this has means continuing with the Arduino set up to collect as much data as possible, to ensure a range of different environmental factors are collected - this will in turn create a wider range of sound possibilities in the final application.

In RNBO, a synth has been built which will sonifiy these data types. The actual data is sent in through Max using a 'coll' object, which is then unpacked into sepearate lists relating to the variable type e.g UV Light, Nitrogen Dioxide poulltion levels, Rainfall (mm) etc. Each day's worth of data has around 80 rows, or timestamps, of data. These variables are then scaled to fit into the parameters of the RNBO synth. Following references and texts in relation to sonification, such as the Sonification Handbook, mappings have been decided upon which best reflect the variable and data type. For example, the light data has been mapped to such parameters as time and brightness of timbre.

The patch has been constantly tested within the browser to ensure that audio is smooth and all mappings and audio work correctly.

Here is a screenshot of the completed Max and RNBO patch:

<img width="2560" alt="Screenshot 2023-04-21 at 09 07 40" src="https://user-images.githubusercontent.com/123555981/233582489-a101e553-e9bf-47bc-9096-71b0bf6b09fe.png">

The next stage will be to integrated this completed patch into the JavaScript application and UI previous created. The final idea for the UI has changed somewhat since the last blog post. The idea now is to create a "sound map", in which the user will be able to move around the canvas and constantly hear the changes in the data depending on the location of the crosshair. To achieve this, multiple "snapshots" (or presets) will be created in the RNBO patch. These snapshots will be recalled as presets in the JavaScript code and will be linked to an area within the sound map (or JS canvas/screen). 

