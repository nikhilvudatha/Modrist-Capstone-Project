const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
//const TOKEN_PATH = 'token.json';
const TOKEN_PATH = 'token.json';

//add an email for demo
var contactEmail = 'mamatoya@asu.edu';

//RUN HERE
demo(0);
//OPTIONS
//0 - listAllEvents
//1 - contactNextEvent
//2 - createEvent

// Load client secrets from a local file.
function demo(option){
	var callback;
	switch(option){
		case 0:
			callback = listEvents;
			break;
		case 1:
			callback = contactNextEvent;
			break;
		case 2:
			callback = createEvent;
			break;
		default:
			console.log('Pick a valid option.');
			process.exit(0);
	}
	fs.readFile('../credentials.json', (err, content) => {
	  if (err) return console.log('Error loading client secret file:', err);
	  // Authorize a client with credentials, then call the Google Calendar API.
	  authorize(JSON.parse(content), callback);
	});
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        if (event.attendees){
        	console.log(event.summary);
			for (const attendee in event.attendees) {
				console.log('\t',event.attendees[attendee].email, event.attendees[attendee].responseStatus);
			}
		}
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

function listAllEvents(auth){
	const calendar = google.calendar({version: 'v3', auth});
	var calendarItem = calendar.events.list({
	    calendarId: 'primary',
	    timeMin: (new Date()).toISOString(),
	    singleEvents: true,
	    orderBy: 'startTime',
	    //updatedMin: (new Date().toISOString()),
	  }, (err, res) => {
	    if (err) return console.log('The API returned an error: ' + err);
	    const events = res.data.items;
	    console.log(res.data);
	    //NOTES: can iterate per item and get all
	    //		 or printing just data -> pagination + tokens
	    //if (events.length) {
	      //console.log('Upcoming events:');
	      //events.map((event, i) => {
	        //const start = event.start.dateTime || event.start.date;
	        //console.log(`${start} - ${event.summary}`);
	    	  //console.log("EVENT " + i)
	    	  //console.log(event)
	      //});
	    //} else {
	    //  console.log('No upcoming events found.');
	    //}
	  });
}
function contactNextEvent(auth){
	const calendar = google.calendar({version: 'v3', auth});
	calendar.events.list({
	    calendarId: 'primary',
	    timeMin: (new Date()).toISOString(),
	    q: contactEmail,
	    maxResults: 1,
	    singleEvents: true,
	    orderBy: 'startTime',
	  }, (err, res) => {
	    if (err) return console.log('The API returned an error: ' + err);
	    const events = res.data.items;
	    if (events.length) {
	      console.log('Upcoming event with ' + contactEmail + ':');
	      events.map((event, i) => {
	        //const start = event.start.dateTime || event.start.date;
	        //console.log(`${start} - ${event.summary}`);
	    	  console.log(event);
	      });
	    } else {
	      console.log('No upcoming events found.');
	    }
	  });
}
function createEvent(auth){
	const calendar = google.calendar({version: 'v3', auth});
	var date = new Date();
	var month = date.getMonth()+1;
	var day = date.getDate()+1;
	var event = {
			'summary': 'Test Event via API',
			'description': 'testing, can ignore',
			'start':{
				'dateTime': '2020-' + month +'-' + day+'T13:00:00-07:00',
				'timeZone': 'America/Phoenix'
			},
			end:{
				'dateTime': '2020-' + month +'-' + day+'T13:30:00-07:00',
				'timeZone': 'America/Phoenix',
			},
			'attendees':[
				{'email': contactEmail},
			],
	};
	calendar.events.insert({
		auth: auth,
		calendarId: 'primary',
		resource: event,
	}, function(err, event){
		if(err){
			console.log('There was an error contacting the Calendar service: ' + err);
			return;
		}
		console.log('Event created:' + event.data.htmlLink);
	});
}
