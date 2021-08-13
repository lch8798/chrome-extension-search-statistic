chrome.runtime.onInstalled.addListener(async () => {
  // create tab to index page when install chrome extension
  // const url = chrome.runtime.getURL("index.html");
  // console.log(`index.html url is ${url}`);
  // const tab = await chrome.tabs.create({ url });
  // console.log('create tab!', tab);

  // init storage
  const DEFAULT_BACKGROUND_COLOR = "#ddd";
  chrome.storage.sync.set({ color: DEFAULT_BACKGROUND_COLOR });
});
