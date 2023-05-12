//RNBO code

//variables needed for the rnbo set up function
let device;
let presets = []; 
let activeSquare = undefined;
let parameters;
let volumeGain;
let volumeGainValue = 0;

async function setuprnbo() {
  const patchExportURL = "export/synth.export.json";

  // Create AudioContext
  const WAContext = window.AudioContext || window.webkitAudioContext;
  const context = new WAContext();

  // Create gain node and connect it to audio output
  const outputNode = context.createGain();
  outputNode.connect(context.destination);

  // Fetch the exported patcher
  let response, patcher;
  try {
    response = await fetch(patchExportURL);
    patcher = await response.json();

  //  //loading presets
  //  loadPresets(device, patcher);

    if (!window.RNBO) {
      // Load RNBO script dynamically
      // Note that you can skip this by knowing the RNBO version of your patch
      // beforehand and just include it using a <script> tag
      await loadRNBOScript(patcher.desc.meta.rnboversion);
    }
  } catch (err) {
    const errorContext = {
      error: err,
    };
    if (response && (response.status >= 300 || response.status < 200)) {
      (errorContext.header = `Couldn't load patcher export bundle`),
        (errorContext.description =
          `Check app.js to see what file it's trying to load. Currently it's` +
          ` trying to load "${patchExportURL}". If that doesn't` +
          ` match the name of the file you exported from RNBO, modify` +
          ` patchExportURL in app.js.`);
    }
    if (typeof guardrails === "function") {
      guardrails(errorContext);
    } else {
      throw err;
    }
    return;
  }

  try {
    device = await RNBO.createDevice({ context, patcher });
    loadPresets(device, patcher)

    //so that the volume can be accessed in draw() if needed
    parameters = device.parameters;
    volumeGain = parameters.find((param) => param.name === "volumeGain");
    //volumeGain.value = 0.5;

  } catch (err) {
    if (typeof guardrails === "function") {
      guardrails({ error: err });
    } else {
      throw err;
    }
    return;
  }
  device.node.connect(outputNode);


  document.addEventListener('keydown', event => {
    context.resume();
  });
  
  document.body.onclick = () => {
    context.resume();
  };

}

//this one loads the presets
function loadPresets(device, patcher) {
  let loadedPresets = patcher.presets || [];
  console.log(loadedPresets);
  loadedPresets.forEach((preset) => {
    console.log(`Loading preset ${preset.name}`);
    presets.push(preset);
  });
  let preset = document.getElementById("preset-select");
  if (preset && preset.preset) {
    device.setPreset(preset.preset);
  }
}

function loadRNBOScript(version) {
  return new Promise((resolve, reject) => {
    if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
      throw new Error(
        "Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code."
      );
    }
    const el = document.createElement("script");
    el.src =
      "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" +
      encodeURIComponent(version) +
      "/rnbo.min.js";
    el.onload = resolve;
    el.onerror = function (err) {
      console.log(err);
      reject(new Error("Failed to load rnbo.js v" + version));
    };
    document.body.append(el);
  });
}

//calling the above function
setuprnbo();


//------------------------------------
//RNBO SET UP ABOVE - SET UP, DRAW AND OTHER FUNCTIONS BELOW
//------------------------------------


//bool for making the preset load only once when it is in range
var presetChanged = false;

//loading the background image
var backgroundImage;

//crosshair vars
var crosshairX;
var crosshairY;

//world positional vars
var scrollPosX;
var scrollPosY;
var crosshairWorldX;
var crosshairWorldY;

//creating the square grid
var numRows = 5;
var numColumns = 5;
var squareSize;


//crosshair direction vars
var isLeft;
var isRight;
var isUp;
var isDown;

//setting bounds of the crosshair vars
var minX;
var maxX;
var minY;
var maxY;

//offsetting the canvas measurements
var offsetX = 0;
var offsetY = 0;

//to enable to play midi note
var inRange = true;

//to enable auto play
var isOn = false; 

//to show the data text
var showText = true;

//flag to enable text at start to fade out
var fadeText;
var textOpacity = 250;

//to show the instructions at the start
var showInstructions = true;

//loading a pitch value for the playmidinote function
var pitch = 60;

//setting the size of the canvas
var windowHeightMargin;
var windowWidthMargin;

//for the 'about' section in top right
var url = 'https://github.com/nathanemct/nathanemct.github.io/blob/main/README.md';
var urlX, urlY, urlWidth = 100, urlHeight = 20;

//map for the notes
var noteMap = {
  'a': 60, // C4
  'w': 61, // C#4
  's': 62, // D4
  'e': 63, // D#4
  'd': 64, // E4
  'f': 65, // F4
  't': 66, // F#4
  'g': 67, // G4
  'y': 68, // G#4
  'h': 69, // A4
  'u': 70, // A#4
  'j': 71, // B4
  'k': 72, // C5
  'o': 73, // C#5
  'l': 74, // D5
  'p': 75 // D#5
};

//loading the background and font style
function preload() {
  backgroundImage = loadImage("bg.jpg");
  myFont = loadFont("font.ttf");
}

function setup() {
  //creating the full page canvas, with some taken off so scroll bars don't appear 
  windowWidthMargin = windowWidth;
  windowHeightMargin = windowHeight;

  //no longer in use as using relative width/height
  // offsetX = (windowWidthMargin - windowWidth) / 2;
  // offsetY = (windowHeightMargin - windowHeight) / 2;

  //so no scroll bars appear in full screen
  noScrollBars();

  //creating the cavas full page
  createCanvas(windowWidth, windowHeight);

  //setting the square size relatively
  squareSize = windowWidthMargin / 5;

  //setting the position of the URL in the about section
  urlX = 10;
  urlY = 10;

  //event listener for pressing keyboard key and making midi note
  document.addEventListener('keypress', handleKeyPress);

  //set starting position of the crosshair
  startProgram();

  //setting the scroll position so crosshair can move aganist background
  scrollPosX = (offsetX + (width - numColumns * squareSize) / 2) - squareSize / 2 ;
  scrollPosY = (offsetY + (height - numRows * squareSize) / 2);

  //setting the boundaries for the crosshair, so it won't move out of 5x5 grid
  minX = offsetX + squareSize / 2 + (squareSize * 0.04);
  maxX = offsetX + (numColumns * squareSize)  + (squareSize / 2) - (squareSize * 0.04);
  minY = offsetY + squareSize / 2 + (squareSize * 0.04);
  maxY = offsetY + (numRows * squareSize) + (squareSize / 2) - (squareSize * 0.04);
}

//FUNCTION TO PLAY A MIDI NOTE 
 function handleKeyPress(event) {
   const pitch = noteMap[event.key];
       if (pitch) {
        playNote(pitch);
      }
 }

//FUCTION TO ASSIGN PITCH VALUE TO MIDI NOTE - EDITED FROM RNBOs version
 function playNote(pitch) {

  //CAN ONLY PLAY NOTE IF IN A SQUARE
  if (inRange){

    let midiChannel = 0;

    //format a MIDI message payload, this constructs a MIDI note-on event
    let noteOnMessage = [
      144 + midiChannel, // Code for a note on: 10010000 & MIDI channel (0-15)
      pitch, // MIDI Note
      120, // MIDI Velocity
    ];

    let noteOffMessage = [
      128 + midiChannel, // Code for a note off: 10000000 & MIDI channel (0-15)
      pitch, // MIDI Note
      0, // MIDI Velocity
    ];

    let midiPort = 0;
    //dynamically set the note duration from adsr envelop
    let noteDurationMs = device.parametersById.get("attack") + device.parametersById.get("decay") + device.parametersById.get("release"); 


    //when scheduling an event, use the current audio context time
    //multiplied by 1000 (converting seconds to milliseconds)
    let noteOnEvent = new RNBO.MIDIEvent( 
      device.context.currentTime * 1000, 
      midiPort,
      noteOnMessage
    );
    let noteOffEvent = new RNBO.MIDIEvent( 
      device.context.currentTime * 1000 + noteDurationMs, 
      midiPort,
      noteOffMessage
    );

    device.scheduleEvent(noteOnEvent);
    device.scheduleEvent(noteOffEvent);
  }
}


//------------------------------------
//DRAW FUNCTION
//------------------------------------



function draw() {
  //background image, off set so no blurring at edges of screen
  image(backgroundImage, scrollPosX - 500, scrollPosY -500);

  squareSize = windowWidthMargin / 5;
  
  //drawing the square grid and using push/pop 
  //to make it scroll against the crosshair movement
  push();
  translate(scrollPosX, scrollPosY);

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      let squareX = squareSize * col + squareSize / 2 + offsetX;
      let ssquareY = squareSize * row + squareSize / 2 + offsetY;

      let d = dist(crosshairWorldX, crosshairWorldY, squareX + squareSize / 2, ssquareY + squareSize / 2);

      //calculate the alpha value based on the distance, allows rect to fade in/out
      let alpha = map(d, 0, squareSize, 200, 0);
      
      alpha = constrain(alpha, 0, 200);    

      //set the fill color with the calculated alpha value and draw the square
      fill(250, 240, 255, alpha);
      strokeWeight(0);
      rect(squareX, ssquareY, squareSize, squareSize);
    }
  }
  pop();

  //working out which square the crosshair is in 
  let currentSquare;
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      
      let squareX = squareSize * col + squareSize / 2 + offsetX;
      let ssquareY = squareSize * row + squareSize / 2 + offsetY;
      
      let inSquare = crosshairWorldX > squareX && crosshairWorldX < squareX + squareSize && crosshairWorldY > ssquareY && crosshairWorldY < ssquareY + squareSize;

      if (inSquare) {
        currentSquare = row * numColumns + col + 1;
        
        if(showText)
        {
          drawDataText(currentSquare);
        }
        
        //not used, but useful to have - setting parameters individually if needed
        // if (volumeGain) {
        //   volumeGain.value = volumeGainValue;
        // }
      }
    }
    if (currentSquare !== undefined) {
      break;
    } 
  }

  //setting the preset at the current square 
  if (currentSquare !== undefined && currentSquare !== activeSquare) {
    activeSquare = currentSquare;
    inRange = true;
    loadPresetAtIndex(currentSquare - 1);
    
  } else if (currentSquare === undefined) {
    // the crosshair is not in any square
    inRange = false;
    activeSquare = undefined;
  }

  //making the starting instruction text move vars
  let speed1 = 0.011;
  let speed2 = 0.007
  let amplitude = -6;
  let amplitude2 = 8;

  if (showInstructions) {
    fadeText = false;
    textOpacity = 250;
  } else {
    fadeText = true;
  }
  
  //making instruction fade out using textOpacity var
  if (fadeText) {
    textOpacity = max(0, textOpacity - 2);
    inRange = true;
  }
  
  //setting instruction text arugments
  textSize(windowWidthMargin/70);
  textFont(myFont);
  textAlign(CENTER, TOP);
  fill(5, 5, 5, textOpacity);
  
  //some vars to make the instructions float around at the start
  let yOffset = sin(frameCount * speed1) * amplitude;
  let xOffset = sin(frameCount * speed1 + PI / 2) * amplitude;
  let yOffset2 = sin(frameCount * speed2) * amplitude2;
  let xOffset2 = sin(frameCount * speed2 + PI / 2) * amplitude2;

  //the instructions
  text("growing a plant from seed requires certain environmental conditions", width/2 + xOffset2, height/4 + yOffset2);
  text("listen to the sound of this environment", (width/2 + 100) + xOffset2, height/4 + 50 + yOffset);
  text("use arrow keys to navigate the dataset", (width/2 - 80) + xOffset, height/4 + 90 + yOffset);
  text("use alphabet keys to interact with data", (width/2 + 60) + xOffset, height/4 + 130 + yOffset2);
  
  //drawing the text in the top left to show data/auto play on/off
  textSize(14);
  textFont(myFont);
  fill(5, 5, 5, 250);
  textAlign(LEFT, TOP);

  //url about
  text("about (click)", 10, 10)

  if(showText){
    text("toggle data (z): " + "on", 10, 40);
  }
  else if(!showText){
    text("toggle data (z): " + "off", 10, 40);
  }
  if(isOn){
    text("auto play (space): " + "on", 10, 70);
  }
  else if(!isOn){
    text("auto play (space): " + "off", 10, 70);
  }

  //just seeing which square crosshair is in for testing stage
  //text("Square " + (currentSquare || "None"), 10, 130);


  //------------------------------------
  //REST OF DRAW FUNCTION
  //------------------------------------
  

  //draw the crosshair
  drawCrosshair();

  //logic to make the crosshair move/the background scroll
  if (isLeft && crosshairWorldX > minX) {
    if (crosshairX > width * 0.4) {
      crosshairX -= 3;
    } else {
      scrollPosX += 3;
    }
  }

  if (isRight && crosshairWorldX < maxX) {
    if (crosshairX < width * 0.6) {
      crosshairX += 3;
    } else {
      scrollPosX -= 3;
    }
  }

  if (isUp && crosshairWorldY > minY) {
    if (crosshairY > height * 0.5) {
      crosshairY -= 3;
    } else {
      scrollPosY += 3;
    }
  }

  if (isDown && crosshairWorldY < maxY) {
    if (crosshairY > height * 0.75) {
      crosshairY += 3;
    } else {
      scrollPosY -= 3;
    }
  }

  //update real position of crosshair for collision detection
  crosshairWorldX = (crosshairX - scrollPosX) + offsetX;
  crosshairWorldY = (crosshairY - scrollPosY) + offsetY;
}

//------------------------------------
//OTHER FUNCTIONS
//------------------------------------

// move crosshair using arrow keys, turn on auto play, toggle data text
function keyPressed() {
  
  showInstructions = false;

  if (keyCode == LEFT_ARROW) {
    isLeft = true;
  }
  if (keyCode == RIGHT_ARROW) {
    isRight = true;
  }
  if (keyCode == UP_ARROW) {
    isUp = true;
  }
  if (keyCode == DOWN_ARROW) {
    isDown = true;
  }

  //allows patch to play automatically
  if (keyCode == 32) {
    const autoOn = device.parametersById.get("autoOn");
    isOn = !isOn;
    autoOn.value = isOn ? 1 : 0;
  }

  //swtich to show or hide data text
  if (key == "z") {
    showText = !showText;
  }
}

//supporting keypressed functions
function keyReleased() {

  if (keyCode == LEFT_ARROW) {
    isLeft = false;
  }
  if (keyCode == RIGHT_ARROW) {
    isRight = false;
  }
  if (keyCode == UP_ARROW) {
    isUp = false;
  }
  if (keyCode == DOWN_ARROW) {
    isDown = false;
  }
}

//function to draw the crosshair
function drawCrosshair() {
  fill(5, 5, 5, 200);
  noStroke();
  ellipse(crosshairX, crosshairY, windowWidthMargin/100, windowWidthMargin/100);
  noStroke();
}

//enables url link to work in top left, about section
function mouseClicked() {
  if (mouseX > urlX && mouseX < urlX + urlWidth && mouseY > urlY && mouseY < urlY + urlHeight) {
    window.open(url);
  }
}

//prints out a list of the patcher's presets in the console and loads the preset by index
function loadPresetAtIndex(index) {
  const preset = presets[index];
  if (preset) {
    console.log(`Loading preset ${preset.name}`);
    device.setPreset(preset.preset);
    //must have this catch otherwise program won't run!
  } else {
    console.error(`Invalid preset index: ${index}`);
  }
}

//function to draw preset data text inside a square
function drawDataText(squareIndex) {
  //define the text for each square index, by index
  const texts = [
    ["Text 1", "Text 2", "Text 3", "Text 4", "Text 5"],
    ["day 1", "08:14am", "pollution: high", "seed just planted", "soil humidity: 96%"],
    ["day 1", "09:52am", "NO2: 96.97µg/m3", "seed just watered", "air temp: 18°C"],
    ["day 1", "11:02am", "UV light: 0.05", "infrared light: 122", "air humidity: 58%"],
    ["day 36", "06:06am", "visible light: 0", "NO2: 96.97µg/m3", "PM2.5: 20.84µg/m3"],
    ["day 36", "07:37am", "soil humidity: 73%", "UV light: 0.12", "pollution: very high"],
    ["day 1", "16:52pm", "visible light: 2", "rain/hr: 0.23mm", "PM2.5: 4.53µg/m3"],
    ["day 7", "08:28am", "pollution: low", "rain/hr: 0.55mm", "heavy rainfall"],
    ["day 7", "12:33pm", "rain/hr: 0.27mm", "air temp: 17°C", "NO2: 16.53µg/m3"],
    ["day 36", "06:41am", "PM2.5: 20.84µg/m3", "visible light: 19", "infrared light: 39"],
    ["day 43", "17:06am", "air humidity 60%", "UV light: 0", "air temp: 17°C"],
    ["day 7", "10:48am", "pollution: low", "visible light: 23", "rain/hr: 0.9mm"],
    ["day 7", "15:56pm", "UV light: 0", "infrared light: 2", "soil humidity: 75%"],
    ["day 20", "14:47pm", "becoming seedling", "NO2: 12.52µg/m3", "soil humidity: 85%"],
    ["day 36", "17:46pm", "NO2: 85.63µg/m3", "new leaves", "low light"],
    ["day 43", "08:49am", "very light", "soil humidity: 70%", "visible light: 181"],
    ["day 28", "08:01am", "pollution: medium", "air temp: 14°C", "infrared light: 30"],
    ["day 20", "08:43am", "soil humidity: 85%", "visible light: 87", "rain/hr: 0.39mm"],
    ["day 52", "10:34am", "infrared light: 421", "air temp: 18°C", "plant forming"],
    ["day 20", "16:53pm", "pollution low:", "NO2: 4.19µg/m3", "soil humidity: 85%"],
    ["day 52", "14:11pm", "air temp: 22°C", "air humidity: 59%", "PM2.5: 7.81µg/m3"],
    ["day 28", "08:28am", "air humidity: 61%", "visible light: 38", "pollution: low"],
    ["day 28", "10:14am", "high light", "PM2.5: 12.35µg/m3", "UV light: 0.11"],
    ["day 28", "15:01pm", "pollution: low", "soil humidity: 69%", "air humidity: 61%"],
    ["day 52", "11:37am",  "UV light: 0.22", "air temp: 19°C", "infrared light: 246"],
    ["day 52", "08:28am", "soil humidity 77%", "visible light: 73", "UV light: 0.17"]
  ];

  const squareTexts = texts[squareIndex] || [];

  //calculate the square's position without for loop like before
  const col = (squareIndex - 1) % numColumns;
  const row = Math.floor((squareIndex - 1) / numColumns);
  const squareX = squareSize * col + squareSize / 2 + offsetX + scrollPosX;
  const ssquareY = squareSize * row + squareSize / 2 + offsetY + scrollPosY;
  
  //setting the text properties
  textSize(windowWidthMargin/100);
  fill(5, 5, 5, 180);
  textFont(myFont);
  textAlign(CENTER, CENTER);

  //draw the floating texts, use sin and cos to make the text move in circles/float
  for (let i = 0; i < squareTexts.length; i++) {
    //calculate individual random movements for each text instance
    const randomOffsetX = squareSize / 5 * Math.sin((frameCount + i * 100) * 0.007);
    const randomOffsetY = squareSize / 5 * Math.cos((frameCount + i * 100) * 0.010);

    const textX = squareX + squareSize / 2 + randomOffsetX;
    const textY = ssquareY + squareSize / 2 + randomOffsetY;

    //drawing the text at its position
    text(squareTexts[i], textX, textY);
  }
}

//function containing code for the start of the program
function startProgram() {
  //set starting position of the crosshair
  crosshairX = width / 2;
  crosshairY = height * 0.75;

  //boolean variables to control the movement of the crosshair
  isLeft = false;
  isRight = false;
  isUp = false;
  isDown = false;
}

//not allowing scrollbars for full page
function noScrollBars() {
  const style = document.createElement('style');
  style.innerHTML = `
    body {
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

//allowing window to be resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
