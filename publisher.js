// Config


var Spacebrew = require('./sb-1.3.0').Spacebrew,
	sb,
	config = require("./machine"),
	timeDelay = 1000,
	deviceID = 1,
	fs = require("fs");






// SPACEBREW SETUP --------------------------------

sb = new Spacebrew.Client( config.server, config.name, config.description );  // create spacebrew client object


// Spacebrew Publishing
sb.addPublish("capture1", "binary");		// publish the serialized binary image data
sb.addPublish("capture2", "binary");		// publish the serialized binary image data
sb.addPublish("capture3", "binary");		// publish the serialized binary image data
sb.addPublish("capture4", "binary");		// publish the serialized binary image data

sb.addPublish("imageLocation", "string");   // publish the location of the most recent image stored.

// Spacebrew Subscribing
sb.addSubscribe("recieveImg", "binary.png");	// listens for images coming in from camera



// spacebrew default commands
sb.onCustomMessage = onCustomMessage;	
sb.onOpen = onOpen;

// connect to spacbrew
sb.connect();  





// FUNCTIONS  ------------------------------------

/*
 * Function that is called when Spacebrew connection is established
 */

function onOpen() {
	console.log( "Connected through Spacebrew as: " + sb.name() + "." );

	// start timer 
	timer();

}


function onCustomMessage( name, value, type){
	//Parse Image name
	var cameraID = name.substring(0);
	console.log( "Image data recieved from camera " + cameraID + ".");
	
	
	//Process and write images
	//
	var imgdir = cameraID;
	fs.writeFile(imgdir, value, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log(name + " saved");
    }
}); 

}


// Is a timer for calling the various PI Cameras
function timer() {
	console.log('timer started');    

	// activate timer
	setInterval( function(){ capturePicture(deviceID)}, timeDelay );

    

}


function capturePicture(device) {
	// Connects to RasPi-cam and takes picture
	console.log(device);

	// send capture binary to camera
	// sb.send(name,type,value);

	sb.send(device, "Boolean", true );

}

