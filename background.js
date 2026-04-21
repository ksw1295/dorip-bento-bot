const FORM_URL = "https://form.naver.com/response/yzqQI34B9APhSZ_MgSa_KQ";

function checkAndRun() {
  chrome.storage.local.get(['myName', 'eatingDays', 'specificDates', 'lastSuccessDate'], (res) => {
    // 최소 정보(이름)가 없으면 실행 안 함
    if (!res.myName) return;

    const today = new Date().toLocaleDateString();
    if (res.lastSuccessDate === today) return;

    chrome.tabs.create({ url: FORM_URL, active: false });
  });
}

chrome.runtime.onStartup.addListener(checkAndRun);
chrome.runtime.onInstalled.addListener(checkAndRun);
chrome.alarms.create("bentoTimer", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(checkAndRun);