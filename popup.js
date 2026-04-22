document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('calendar-grid');

  function updateUI() {
    chrome.storage.local.get(['myDept', 'myName', 'myPhone', 'eatingDays', 'bookedDates', 'userType', 'specificDates'], (res) => {
      if (res.userType) document.getElementById('userType').value = res.userType;
      if (res.myDept) document.getElementById('myDept').value = res.myDept;
      if (res.myName) document.getElementById('myName').value = res.myName;
      if (res.myPhone) document.getElementById('myPhone').value = res.myPhone;
      if (res.eatingDays) {
        document.querySelectorAll('.day-check').forEach(el => {
          el.checked = res.eatingDays.includes(parseInt(el.value));
        });
      }
      renderCalendar(res.bookedDates || [], res.specificDates || [], res.eatingDays || []);
    });
  }

  function renderCalendar(booked, specific, routine) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    document.getElementById('cal-month').innerText = `${month + 1}월 달력`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    grid.innerHTML = '';
    ['일','월','화','수','목','금','토'].forEach(h => grid.innerHTML += `<div class="day-header">${h}</div>`);
    for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;

    for (let d = 1; d <= lastDate; d++) {
      const dateKey = `${year}-${month + 1}-${d}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      
      const dayEl = document.createElement('div');
      const isToday = d === now.getDate() && month === now.getMonth();
      const isBooked = booked.includes(dateKey);
      const isManual = specific.includes(dateKey);
      const isRoutine = routine.includes(dayOfWeek);

      dayEl.className = `day ${isBooked ? 'booked' : ''} ${isManual ? 'manual' : ''} ${isRoutine ? 'routine' : ''} ${isToday ? 'today' : ''}`;
      dayEl.innerText = d;

      // 달력 클릭 시: 파란색 토글 (즉시 자동 저장)
      dayEl.onclick = () => {
        chrome.storage.local.get(['specificDates'], (data) => {
          let sDates = data.specificDates || [];
          if (sDates.includes(dateKey)) {
            sDates = sDates.filter(s => s !== dateKey);
          } else {
            sDates.push(dateKey);
          }
          chrome.storage.local.set({ specificDates: sDates }, updateUI);
        });
      };
      grid.appendChild(dayEl);
    }
  }

  // 전체 저장 버튼
  document.getElementById('save-btn').addEventListener('click', () => {
    const days = Array.from(document.querySelectorAll('.day-check:checked')).map(el => parseInt(el.value));
    chrome.storage.local.set({
      userType: document.getElementById('userType').value,
      myDept: document.getElementById('myDept').value,
      myName: document.getElementById('myName').value,
      myPhone: document.getElementById('myPhone').value,
      eatingDays: days
    }, () => {
      alert("✅ 모든 설정이 저장되었습니다!");
      updateUI(); // 저장 후 루틴 요일 달력 테두리 갱신
    });
  });

  // 즉시 실행 버튼
  document.getElementById('run-btn').addEventListener('click', () => {
    chrome.storage.local.get(['myName', 'myDept'], (res) => {
      if (!res.myName || res.myName.trim() === "" || !res.myDept) {
        alert("🚨 먼저 이름과 학과를 입력하고 [설정 저장]을 눌러주세요!");
        return;
      }
      chrome.tabs.create({ url: "https://form.naver.com/response/yzqQI34B9APhSZ_MgSa_KQ" });
    });
  });

  updateUI();
});