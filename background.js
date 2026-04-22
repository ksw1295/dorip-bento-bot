const FORM_URL = "https://form.naver.com/response/yzqQI34B9APhSZ_MgSa_KQ";

function checkAndRun() {
  chrome.storage.local.get(['myName', 'lastSuccessDate'], (res) => {
    if (!res.myName || res.myName.trim() === "") return;

    const today = new Date().toLocaleDateString();
    if (res.lastSuccessDate === today) return;

    chrome.tabs.create({ url: FORM_URL, active: false });
  });
}

// 크롬 켰을 때와 타이머 작동 시에만 실행 (onInstalled 삭제함)
chrome.runtime.onStartup.addListener(checkAndRun);
chrome.alarms.create("bentoTimer", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(checkAndRun);