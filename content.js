chrome.storage.local.get(['myDept', 'myName', 'myPhone', 'eatingDays', 'userType'], (userData) => {
  // 🛑 안전 장치: 이름이나 학과 정보가 없으면 봇 즉시 종료
  if (!userData.myName || userData.myName === "" || !userData.myDept) {
    console.log("🚨 밥봇 중단: 사용자 정보가 설정되지 않았습니다.");
    return;
  }

  const botInterval = setInterval(() => {
    // Phase 1: 성공 감지 (식사 날짜 기준으로 달력에 기록)
    if (document.body.innerText.includes("답변이 제출되었습니다") || document.body.innerText.includes("신청을 완료하였습니다")) {
        const titleMatch = document.body.innerText.match(/(\d+)월\s*(\d+)일/);
        const now = new Date();
        let mealDateKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
        
        if (titleMatch) {
            mealDateKey = `${now.getFullYear()}-${parseInt(titleMatch[1])}-${parseInt(titleMatch[2])}`;
        }

        chrome.storage.local.get(['bookedDates'], (res) => {
          let dates = res.bookedDates || [];
          if (!dates.includes(mealDateKey)) {
            dates.push(mealDateKey);
            chrome.storage.local.set({ 
              bookedDates: dates, 
              lastSuccessDate: new Date().toLocaleDateString() 
            }, () => {
                setTimeout(() => window.close(), 2500);
            });
          } else { window.close(); }
        });
        clearInterval(botInterval);
        return;
    }

    // Phase 2: 입력 폼 로직 (식사 요일 판별 포함)
    const inputs = document.querySelectorAll('input[type="text"], input[type="tel"]');
    if (inputs.length >= 3) {
      const titleMatch = document.body.innerText.match(/(\d+)월\s*(\d+)일/);
      if (titleMatch) {
        const targetDay = new Date(new Date().getFullYear(), parseInt(titleMatch[1])-1, parseInt(titleMatch[2])).getDay();
        // 내가 선택한 요일이 아니면 창 닫기
        if (!userData.eatingDays.includes(targetDay)) {
          clearInterval(botInterval);
          window.close();
          return;
        }
      }

      // 실제 정보 주입
      const forceInput = (el, v) => {
        el.value = v;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
      };

      forceInput(inputs[0], userData.myDept);
      forceInput(inputs[1], userData.myName);
      forceInput(inputs[2], userData.myPhone);

      const clickBtn = (t) => {
        const el = document.evaluate(`//*[contains(text(), '${t}')]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (el) {
          let curr = el;
          while(curr && typeof curr.click !== 'function') curr = curr.parentElement;
          if(curr) curr.click();
        }
      };

      clickBtn(userData.userType || "재학생");
      clickBtn("예");
      clickBtn("설문 추가 참여");
      
      const subBtn = document.evaluate("//*[text()='제출' or text()='보내기']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (subBtn) {
        let s = subBtn;
        while(s && typeof s.click !== 'function') s = s.parentElement;
        if(s) s.click();
      }
    }
  }, 1000);
});