const FORM_URL = "https://form.naver.com/response/yzqQI34B9APhSZ_MgSa_KQ";

function checkAndRun() {
  // 1. 이름, 학과, 요일 설정이 모두 있는지 확인
  chrome.storage.local.get(['myName', 'myDept', 'eatingDays', 'lastSuccessDate'], (res) => {
    // 하나라도 비어있으면 봇 가동 중지
    if (!res.myName || !res.myDept || !res.eatingDays || res.eatingDays.length === 0) {
      console.log("⚠️ 밥봇: 설정 정보가 부족하여 자동 실행을 중단합니다. 팝업에서 정보를 먼저 저장해주세요.");
      return;
    }

    const today = new Date().toLocaleDateString();
    if (res.lastSuccessDate === today) {
      console.log("✅ 밥봇: 오늘 이미 예약 완료했습니다.");
      return;
    }

    chrome.tabs.create({ url: FORM_URL, active: false });
  });
}

chrome.runtime.onStartup.addListener(checkAndRun);
chrome.runtime.onInstalled.addListener(checkAndRun);
chrome.alarms.create("bentoTimer", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(checkAndRun);