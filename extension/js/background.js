// Define a global variable to store the valid URLs
let validUrls = [];
let clientIP = "";

// Load the valid URLs from the JSON file
fetch(chrome.runtime.getURL("./js/valid_urls.json"))
  .then((response) => response.json())
  .then((data) => {
    validUrls = data.valid_urls;
  })
  .catch((error) => console.error("Error loading valid URLs:", error));

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    // Call the function to validate the URL
    await validateTabURL(tabId, changeInfo.url);
  }
});

async function validateTabURL(tabId, url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://")) {
    return;
  }

  // Check if the URL is in the list of valid URLs
  const isValid = validUrls.some((_) => url.includes(_));

  if (!isValid) {
    // Close the tab if it's not valid
    await makePostRequest(url);

    chrome.tabs.remove(tabId, function () {
      console.log("Closed invalid tab: ", url);
    });
  }
}

async function makePostRequest(url) {
  const apiUrl = "https://manvindarsingh.bsite.net/appinfo";

  const userDetails = {
    Id: generateGuid(),
    Date: new Date(),
    AppName: url,
    Summary: "",
    User: clientIP,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userDetails),
      referrer: "",
      referrerPolicy: "no-referrer",
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("POST Response:", data);
  } catch (error) {
    console.error("API Error:", error.message);
  }
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

function generateGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
