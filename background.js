chrome.browserAction.onClicked.addListener(function () {
  chrome.browserAction.setIcon({path: "icons/blue.png"});
  console.log("hello world");

  var intents = ["scroll_up", "scroll_down", "stop", "new_tab", "go_back", "go_forward", "click_link", "close_tab", "navigate", "look_up", "open", "search", "tweet", "stop_listen"];
  // permissions
  navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      {
        video: false,
        audio: true
      },
      function (stream) { /* do something */ },
      function (error) { /* do something */ }
    );
  } else {
    alert('Sorry, the browser you are using doesn\'t support getUserMedia');
  }

  var audio = new Audio('ding.mp3');
  var end = new Audio('woosh.mp3');
  var toggle = false;
  var recognition = new webkitSpeechRecognition();
  var BobActivated = false;
  var BobTimer;
  if ('webkitSpeechRecognition' in window) {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en";
    var final_transcript = '';
    var interim_transcript = '';
    recognition.start();

    recognition.onspeechstart = function (event) {
      start_timestamp = event.timeStamp;
    };

    recognition.onresult = function (event) {
      var final = "";
      var interim = "";
      var intent = "";

      for (var i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // log the latest phrase
          transcript = (event.results[i][0].transcript).toLowerCase()
          // check if program called
          console.log(transcript)
          if (BobActivated) {
            clearTimeout(BobTimer);
            BobTimer = setTimeout(function () { 
              BobActivated = false; 
              chrome.browserAction.setIcon({path: "icons/blue.png"});
            }, 10000);
            intent = getIntent(transcript);
          } else if (transcript == "ok jack") {
            chrome.tts.speak('Jack is in your service', { 'lang': 'en-IN', 'voiceName': 'Veena' });
            chrome.browserAction.setIcon({path: "icons/red.png"});
            console.log("Ok Jack called");
            audio.play();
            BobActivated = true;
            toggle = true;
            BobTimer = setTimeout(function () { 
              chrome.browserAction.setIcon({path: "icons/blue.png"});
              BobActivated = false;
             }, 10000);
          }
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
    };

    recognition.onend = function () {
      recognition.start();
    };

    recognition.onerror = function (event) {
      if (event.error == 'no-speech') {
        console.log('info_no_speech');
        if (BobActivated && toggle) {
          toggle = false;
          end.play();
        }
      }
      if (event.error == 'audio-capture') {
        console.log('info_no_microphone');
      }
      if (event.error == 'not-allowed') {
        if (event.timeStamp - start_timestamp < 100) {
          console.log('info_blocked');
        } else {
          console.log('info_denied');
        }
      }
    };
  }

  function getIntent(query) {
    if (intents.indexOf(query) != -1) {
      console.log("Offline intent should called")
        offlineGetIntent(query)
        return
    } 
    console.log("Api calling here");
    console.log("Query " + query);
    var baseUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3f5eefd0-9fed-432e-847b-d652ce6c0279?verbose=true&timezoneOffset=0&subscription-key=892ccd33cd564895a423023ebfe57ef6&q=";
    baseUrl += query
    $.ajax({
      type: "GET",
      url: baseUrl,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
        console.log(data)
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

          if (isStopListeningCommand(data)) {
            chrome.tts.speak('See you soon', { 'lang': 'en-IN', 'voiceName': 'Veena' });
            BobActivated = false
            chrome.browserAction.setIcon({path: "icons/blue.png"});
          } else {
            chrome.tabs.sendMessage(tabs[0].id, {data:data}, function(response) {
              if(response.type == "test"){
                console.log('test received');
              }
            });
          }
        });
      },
      error: function() {
        return("Internal Server Error");
      }
    });
  }


  function offlineGetIntent(query) {
    data = { query: query, lang: "en", offline: true}
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      var tabURL = tabs[0].url;
      var tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabs[0].id, { data: data }, function (response) {
        if (response.type == "test") {
        }
      });
    });
  }
});


function isStopListeningCommand(data){
  var query = data["query"];
  var topScoringIntent = data["topScoringIntent"]
  if (topScoringIntent["score"] < 0.5) {
    return false
  }
  var intent = topScoringIntent["intent"];
  if (intent == "stop_listen") {
    return true
  }
  return false
}