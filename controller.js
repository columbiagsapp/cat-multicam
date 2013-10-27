// Config


var Spacebrew = require('./sb-1.3.0').Spacebrew,
	sb,
	config = require("./machine"),
	captions = require("./captions"),
	frame_rate = 5000, //take a picture every X ms
	fs = require("fs");


// the amount of cameras in each group
var group_camera_count = [];
group_camera_count[0] = 4;
group_camera_count[1] = 4;
group_camera_count[2] = 4;
group_camera_count[3] = 4;

var group_interval_id = [];		// store the setTimeout interval
var frame_count = [];			// the current frame for each group

// file storage locations
var files_location = "files/";
var filepath = "./" + files_location;
var hosted_path = "http://api.sitetosite.co/modules/cat-multicam/" + files_location;


// SPACEBREW SETUP --------------------------------

sb = new Spacebrew.Client( config.server, config.name, config.description );  // create spacebrew client object


// Spacebrew Publishing for camera Group 0
sb.addPublish("0 group capture camera 0", "boolean", "false");		// publish the serialized binary image data
sb.addPublish("0 group capture camera 1", "boolean", "false");		// publish the serialized binary image data
sb.addPublish("0 group capture camera 2", "boolean", "false");		// publish the serialized binary image data
sb.addPublish("0 group capture camera 3", "boolean", "false");		// publish the serialized binary image data

sb.addPublish("0 group frame", "message");		// image and script in JSON message

// Spacebrew Subscribing
sb.addSubscribe( "0 group image", "binary" );	// listens for images coming in from camera
sb.addSubscribe( "0 group start", "boolean");	// start group 0


// spacebrew default commands
sb.onBooleanMessage = onBooleanMessage;
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
}


function tick( group ){
	//if first frame, fire immediately, else start timer at frame_rate
	if(frame_count[ group ] == 0){
		var command_name = group + " group capture camera " + (frame_count[ group ] % group_camera_count[ group ]);

		console.log( '\n\ntick() sending command_name: ' + command_name + "\n\n");
		sb.send( command_name, "boolean", "true");

		// increment frame counter for this group
		frame_count[ group ]++;
	}else{
		group_interval_id[ group ] = setTimeout( function(){

			var command_name = group + " group capture camera " + (frame_count[ group ] % group_camera_count[ group ]);

			console.log( 'tick() sending command_name: ' + command_name );
			sb.send( command_name, "boolean", "true");

			// increment frame counter for this group
			frame_count[ group ]++;
		}, frame_rate );
	}
}


function saveImage( group, value, cap ){
	console.log("calling saveImage()");
	var json_value = JSON.parse( value );

    var b64_buf = new Buffer(json_value.binary, 'base64').toString('binary');
    var buf = new Buffer(b64_buf, 'binary');

    //pause to let buffer populate
    setTimeout(function(){
    	console.log('saveImage: '+ filepath + json_value.filename );

    	fs.writeFile(filepath + json_value.filename, buf, 'binary', function(err){
      		if(err){
	      		console.log("saveImage() threw error: " + err);
	      		console.log("making directory " + filepath + " and retrying");

	      		fs.mkdir(filepath, function(){
	      			//call again after directory has been made
	      			saveImage( group, value, cap );
	      		});
	      	}else{
	      		console.log(filepath + json_value.filename + ' written');
		        console.log('sending image_url: ' + hosted_path + json_value.filename);
		        console.log('sending caption: ' + cap);

		        var message = {
		        	image_url: hosted_path + json_value.filename,
		        	caption: cap
		        };

		        var command_name = group + " group frame";

		        sb.send( command_name, "message", JSON.stringify( message ) );

		        tick( group );
	      	} 
    	});
    }, 2000);
}


function onCustomMessage( name, value, type){
	var group,
		cap;

	switch(name){
		case "0 group image":
			group = 0;
			cap = captions.group_0[ frame_count[ group ] ];
			break;
		case "1 group image":
			group = 1;
			cap = captions.group_1[ frame_count[ group ] ];
			break;
		case "2 group image":
			group = 2;
			cap = captions.group_2[ frame_count[ group ] ];
			break;
		case "3 group image":
			group = 3;
			cap = captions.group_3[ frame_count[ group ] ];
			break;
	}

	saveImage( group, value, cap );
}


// listens for CAT client to tell controller app to begin to take snapshots
function onBooleanMessage( name, value){
	var group;

	switch(name){
		case "0 group start":
			console.log('0 group start called');
			group = 0;
			break;
		case "1 group start":
			group = 1;
			break;
		case "2 group start":
			group = 2;
			break;
		case "3 group start":
			group = 3;
			break;
	}

	frame_count[ group ] = 0;
	tick( group );
}
