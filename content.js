chrome.storage.local.get(['myDept', 'myName', 'myPhone', 'eatingDays', 'userType', 'specificDates'], (userData) => {
  if (!userData.myName || userData.myName.trim() === "") return;

  const botInterval = setInterval(() => {
    // 1. 성공 감지 및 달력 V 체크 처리
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
          specific = specific.filter(d => d !== mealDateKey); // 특정일 리스트에서 제거

          chrome.storage.local.set({ 
            bookedDates: booked, 
            specificDates: specific,
            lastSuccessDate: new Date().toLocaleDateString() 
          }, () => {
            const toast = document.createElement('div');
            toast.innerText = `✅ 밥봇: [${mealDateKey}] 예약 완료!`;
            Object.assign(toast.style, { position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', background:'#03c75a', color:'white', padding:'15px', borderRadius:'8px', zIndex:'9999', fontWeight:'bold' });
            document.body.appendChild(toast);
            setTimeout(() => window.close(), 2000);
          });
        });
        clearInterval(botInterval);
        return;
    }

    // 2. 입력 폼 로직 (루틴 + 특정일 병합 계산)
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

        // 대상 날짜가 아니면 안전하게 닫기
        if (!isRoutine && !isSpecific) {
          console.log("대상 날짜 아님. 종료.");
          clearInterval(botInterval);
          window.close();
          return;
        }
      }

      // 정보 주입
      const forceInput = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); };
      forceInput(inputs[0], userData.myDept);
      forceInput(inputs[1], userData.myName);
      forceInput(inputs[2], userData.myPhone);

      // 클릭 이벤트
      const clickBtn = (t) => {
        const el = document.evaluate(`//*[contains(text(), '${t}')]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (el) { let curr = el; while(curr && typeof curr.click !== 'function') curr = curr.parentElement; if(curr) curr.click(); }
      };

      clickBtn(userData.userType || "재학생");
      clickBtn("예");
      clickBtn("설문 추가 참여");
      
      const subBtn = document.evaluate("//*[text()='제출' or text()='보내기']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (subBtn) { let s = subBtn; while(s && typeof s.click !== 'function') s = s.parentElement; if(s) s.click(); }
    }
  }, 1000);
});