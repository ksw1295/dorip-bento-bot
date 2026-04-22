chrome.storage.local.get(['myDept', 'myName', 'myPhone', 'eatingDays', 'userType', 'specificDates'], (userData) => {
  if (!userData.myName || userData.myName.trim() === "") return;

  let isProcessing = false; // 🚦 중복 실행을 막기 위한 자물쇠 변수 추가

  const botInterval = setInterval(() => {
    // 🚦 자물쇠가 잠겨있으면(대기 중이면) 봇 작동 일시 정지
    if (isProcessing) return;

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
          specific = specific.filter(d => d !== mealDateKey);

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

    // 2. 이미 제출했던 과거 폼 화면 감지 시 넘어가기
    const resubmitBtn = document.evaluate("//*[contains(text(), '설문 추가 참여')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (resubmitBtn) {
      let curr = resubmitBtn;
      while(curr && typeof curr.click !== 'function') curr = curr.parentElement;
      if(curr) curr.click();
      return;
    }

    // 3. 입력 폼 로직
    const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], textarea, input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="submit"])');
    
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
          alert("🤖 밥봇: 오늘 폼은 예약(루틴/특정일) 설정한 날짜가 아니어서 봇이 작업을 중단하고 창을 닫습니다.");
          window.close();
          return;
        }
      }

      // 📝 1단계: 정보부터 싹 다 입력
      const forceInput = (el, v) => { 
        el.value = v; 
        el.dispatchEvent(new Event('input', {bubbles:true})); 
        el.dispatchEvent(new Event('change', {bubbles:true})); 
      };
      
      forceInput(inputs[0], userData.myDept);
      forceInput(inputs[1], userData.myName);
      forceInput(inputs[2], userData.myPhone);

      // 🚦 2단계: 입력 완료 후 자물쇠 잠그기 (중복 입력 방지)
      isProcessing = true; 
      console.log("정보 입력 완료! 사용자가 확인할 수 있도록 1.5초 대기합니다...");

      // 🕒 3단계: 1.5초(1500ms) 대기 후 버튼 클릭 및 제출
      setTimeout(() => {
        const clickBtn = (t) => {
          const el = document.evaluate(`//*[text()='${t}' or contains(text(), '${t}')]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (el) { 
            let curr = el; 
            while(curr && typeof curr.click !== 'function') curr = curr.parentElement; 
            if(curr) curr.click(); 
          }
        };

        clickBtn(userData.userType || "재학생");
        clickBtn("예");
        
        const subBtn = document.evaluate("//*[text()='제출' or text()='보내기']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (subBtn) { 
          let s = subBtn; 
          while(s && typeof s.click !== 'function') s = s.parentElement; 
          if(s) s.click(); 
        }

        // 제출 눌렀으니 다시 자물쇠 풀기 (성공 화면 감지를 위해)
        isProcessing = false; 
      }, 1500); // <-- 대기 시간 조절 (1000 = 1초, 1500 = 1.5초)
    }
  }, 1000);
});