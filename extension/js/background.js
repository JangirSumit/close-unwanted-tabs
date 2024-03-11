// Define a global variable to store the valid URLs
let validUrls = [];
let clientIP = "";

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    // Call the function to validate the URL
    validateTabURL(tabId, changeInfo.url);
  }
});

function validateTabURL(tabId, url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://")) {
    return;
  }

  // Check if the URL is in the list of valid URLs
  function generateGuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  const userDetails = {
    Id: generateGuid(),
    Date: getDateTime(),
    AppName: url,
    Summary: "",
    User: clientIP,
  };

  // Close the tab if it's not valid
  sendMessageToContentScript(tabId, userDetails, url);
}

function getDateTime() {
  const date = new Date();
  // Ensure the input is a valid Date object
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Invalid Date';
  }

  // Get individual components of the date
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Format the date and time
  const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

  return formattedDateTime;
}

function makeApiCall() {
  const ipGeolocationApiUrl = "https://ipinfo.io/json"; // Example IP Geolocation API

  fetch(ipGeolocationApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("IP Geolocation Response:", data);

      // Access the IP details from the response
      clientIP = data.ip;
      const city = data.city;
      const region = data.region;
      const country = data.country;

      // Use the IP details as needed
      console.log(
        `IP Address: ${clientIP}, City: ${city}, Region: ${region}, Country: ${country}`
      );
    })
    .catch((error) => {
      console.error("API Error:", error.message);
    });
}

// Call the IP Geolocation API when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  makeApiCall();
});

// Function to send a message to the content script
function sendMessageToContentScript(tabId, message, urlToCheck) {
  chrome.tabs.sendMessage(tabId, {
    action: "updateData",
    data: message,
    urlToCheck: urlToCheck,
  });
}

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "isValidUrl") {
    console.log(message, sender);
    const isValid = message.data;

    if (!isValid) {
      console.log("in valid URL");

      chrome.tabs.remove(sender.tab.id, function () {
        console.log("Closed invalid tab: ", sender.tab.url);
      });
    }
  }
});
