// Define a global variable to store the valid URLs
let inValidUrls = [];

// Load the valid URLs from the JSON file
fetch(chrome.runtime.getURL("./js/valid_urls.json"))
  .then((response) => response.json())
  .then((data) => {
    inValidUrls = data.valid_urls;
  })
  .catch((error) => console.error("Error loading valid URLs:", error));

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    // Call the function to validate the URL
    validateTabURL(tabId, changeInfo.url);
  }
});

function validateTabURL(tabId, url) {
  // Check if the URL is in the list of valid URLs
  const isInValid = inValidUrls.some(_ => url.includes(_));

  if (isInValid) {
    // Close the tab if it's not valid
    chrome.tabs.remove(tabId, function () {
      console.log("Closed invalid tab: ", url);
    });
  }
}
