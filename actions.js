var data;
var timer;
var synth = window.speechSynthesis;
var utterThis = new SpeechSynthesisUtterance("They didn't code me well enough to understand that.");

// var speech_voices;
// voices = synth.getVoices();
// speech.voice = voices.filter(function(voice) { return voice.name == 'Google US English Female'; })[0];

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("Action Js Called")
    data = request.data;
    console.log(request)
    console.log(data)
    console.log(data["offline"])
    console.log(typeof data["offline"])
    if (data["offline"] == true) {
      console.log("OFFLINE")
      sendResponse({ type: "test" });
      selectOfflineIntent(data)
    } else {
      var query = data["query"];
      var topScoringIntent = data["topScoringIntent"]
      sendResponse({ type: "test" });
      selectIntent(query, topScoringIntent)
    }
  }
);

// for every action, excute some javascript
var intents = ["scroll_up", "scroll_down", "stop", "new_tab", "go_back", "go_forward", "click_link", "close_tab", "navigate", "look_up", "open", "search", "tweet", "page_up", "page_down"];

var scrollUp = function () {
  stop();
  console.log("I'm trying to scroll up");
  timer = setInterval(function () { window.scrollBy(0, -1) }, 8);
};

var scrollDown = function () {
  stop();
  console.log("I'm trying to scroll down");
  timer = setInterval(function () { window.scrollBy(0, 1) }, 8);
};

var pageUp = function () {
  stop();
  console.log("I'm trying to scroll up");
  window.scrollBy(0, -200)
};

var pageDown = function () {
  stop();
  console.log("I'm trying to scroll down");
  window.scrollBy(0, 200);
};

var stop = function () {
  clearInterval(timer);
}

var newTab = function () {
  console.log("I'm trying to scroll new tab");
  openinnewtab("http://www.google.com");
};

var goBack = function () {
  console.log("I'm trying to go back");
  window.history.back();
};

var goForward = function () {
  console.log("I'm trying to go forward");
  window.history.forward();
};

var clickLink = function () {
  console.log("I'm trying to click link");
  var query = "";
  if (data.result.resolvedQuery.indexOf(" about ") != -1) {
    console.log(data.result.resolvedQuery.split(" about ")[1]);
    organizeArray(data.result.resolvedQuery.split(" about ")[1]);
  }
  else if (data.result.resolvedQuery.indexOf(" on ") != -1) {
    organizeArray(data.result.resolvedQuery.split(" on ")[1])
  }
  else if (data.result.resolvedQuery.indexOf(" the ") != -1) {
    organizeArray(data.result.resolvedQuery.split(" the ")[1])
  }
  else if (data.result.resolvedQuery.indexOf(" where ") != -1) {
    organizeArray(data.result.resolvedQuery.split(" where ")[1])
  }
  else {
    console.log(data.result.resolvedQuery);
    organizeArray(data.result.resolvedQuery);
  }
};

var closeTab = function () {
  console.log("I'm trying to close tab");
  window.close();
};

var navigate = function () {
  console.log("I'm trying to navigate to a site")
  console.log(data);
  if (data.result.parameters.url.length > 0) {
    openWebsite(data.result.parameters.url);
  }
  else {
    openWebsite(data.result.parameters.any);
  }
};

var openWebsiteOrSearch = function () {
  console.log("open website or google search")
  console.log(data)
  if (data["entities"] != undefined && data["entities"].length > 0) {
    var entityObj = data["entities"][0]
    var entity = entityObj["entity"].toLowerCase()
    if (entityObj["type"].length > 0) {
      var shouldShowUrl = false
      var link = ""
      var type = entityObj["type"].toLowerCase()
      if (type == "search") {
        link = "http://www.google.com/search?q="+entity
        shouldShowUrl = true
      } else if (type == "url") {
        if (entity.startsWith("http")) {
            link = entity
        } else {
          entity = entity.replace(/\s/g,'')
          link = "https://www."+entity
        }

        shouldShowUrl = true
      } 
      if (shouldShowUrl) {
        openinnewtab(link);
      }
    }
  }
}

var lookUp = function () {
  console.log("trying to look up");
  for (var term in data.result.parameters) {
    if (data.result.parameters[term].length > 0) {
      console.log(data.result.parameters[term]);
      window.location.href = "http://google.com/search?q=" + data.result.parameters[term];
    }
    else {
      if (data.result.resolvedQuery.indexOf(" for ") != -1)
        window.location.href = "http://google.com/search?q=" + data.result.resolvedQuery.split(" for ")[1];
      else if (data.result.resolvedQuery.indexOf(" about ") != -1)
        window.location.href = "http://google.com/search?q=" + data.result.resolvedQuery.split(" about ")[1];
      else if (data.result.resolvedQuery.indexOf(" search ") != -1)
        window.location.href = "http://google.com/search?q=" + data.result.resolvedQuery.split(" search ")[1];
      else if (data.result.resolvedQuery.indexOf(" look up ") != -1)
        window.location.href = "http://google.com/search?q=" + data.result.resolvedQuery.split(" look up ")[1];
      else
        console.log("sorry I couldn't hear that, could you say that again?");
    }
  }
}

function openinnewtab(url) {
  var win = window.open(url, '_blank');
  win.focus();
}

var openTwitter = function() {
  console.log("open twitter")
  console.log(data)
  if (data["entities"].length > 0) {
    var entityObj = data["entities"][0]
    var entity = entityObj["entity"].toLowerCase()
    if (entityObj["type"].length > 0) {
      var shouldShowUrl = false
      var link = ""
      var type = entityObj["type"].toLowerCase()
      if (type == "search") {
        link = "https://twitter.com/intent/tweet?text="+entity
        shouldShowUrl = true
      }
      if (shouldShowUrl) {
        openinnewtab(link);
      }
    }
  }
}

var functions = [scrollUp, scrollDown, stop, newTab, goBack, goForward, clickLink, closeTab, navigate, lookUp, openWebsiteOrSearch, openWebsiteOrSearch, openTwitter, pageUp, pageDown];

function selectIntent(query, topScroringIntent) {
  if (topScroringIntent["score"] < 0.4) {
    return
  }
  var intent = topScroringIntent["intent"];
  var foundFunction = false;
  console.log("Online intent called")
  for (var i = 0; i < intents.length; i++) {
    if ((intent == intents[i])) {
      foundFunction = true;
      functions[i]();
    }
  }
}

function selectOfflineIntent(data) {
  var intent = data["query"];
  var foundFunction = false;
  console.log("Offline intent called")
  for (var i = 0; i < intents.length; i++) {
    if ((intent == intents[i])) {
      foundFunction = true;
      functions[i]();
    }
  }
  // if (foundFunction == false)
    // synth.speak(utterThis);
}
