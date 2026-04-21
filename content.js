chrome.storage.local.get(['myDept', 'myName', 'myPhone', 'eatingDays', 'userType', 'specificDates'], (userData) => {
  if (!userData.myName || userData.myName === "") return;

  const botInterval = setInterval(() => {
    // 1. 성공 감지 및 데이터 업데이트
    if (document.body.innerText.includes("답변이 제출되었습니다") || document.body.innerText.includes("신청을 완료하였습니다")) {
        const titleMatch = document.body.innerText.match(/(\d+)월\s*(\d+)일/);
        const now = new Date();
        let mealDateKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
        
        if (titleMatch) {
            mealDateKey = `${now.getFullYear()}-${parseInt(titleMatch[1])}-${parseInt(titleMatch[2])}`;
        }

        chrome.storage.local.get(['bookedDates', 'specificDates'], (res) => {
          let booked = res.bookedDates || [];
          let specific = res.specificDates || [];
          
          if (!booked.includes(mealDateKey)) booked.push(mealDateKey);
          // 특정 날짜로 예약 성공했다면 해당 리스트에서 삭제
          specific = specific.filter(d => d !== mealDateKey);

          chrome.storage.local.set({ 
            bookedDates: booked, 
            specificDates: specific,
            lastSuccessDate: new Date().toLocaleDateString() 
          }, () => {
            setTimeout(() => window.close(), 2500);
          });
        });
        clearInterval(botInterval);
        return;
    }

    // 2. 입력 폼 로직
    const inputs = document.querySelectorAll('input[type="text"], input[type="tel"]');
    if (inputs.length >= 3) {
      const titleMatch = document.body.innerText.match(/(\d+)월\s*(\d+)일/);
      if (titleMatch) {
        const year = new Date().getFullYear();
        const month = parseInt(titleMatch[1]);
        const day = parseInt(titleMatch[2]);
        const dateKey = `${year}-${month}-${day}`;
        const dayOfWeek = new Date(year, month - 1, day).getDay();

        const isRoutine = (userData.eatingDays || []).includes(dayOfWeek);
        const isSpecific = (userData.specificDates || []).includes(dateKey);

        if (!isRoutine && !isSpecific) {
          console.log("대상 날짜 아님. 종료.");
          clearInterval(botInterval);
          window.close();
          return;
        }
      }

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