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
    document.getElementById('cal-month').innerText = `${month + 1}월 식사 일정`;
    
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

      // 날짜 클릭 시 특정 날짜 토글
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

  document.getElementById('save-btn').addEventListener('click', () => {
    const days = Array.from(document.querySelectorAll('.day-check:checked')).map(el => parseInt(el.value));
    chrome.storage.local.set({
      userType: document.getElementById('userType').value,
      myDept: document.getElementById('myDept').value,
      myName: document.getElementById('myName').value,
      myPhone: document.getElementById('myPhone').value,
      eatingDays: days
    }, () => alert("설정이 저장되었습니다!"));
  });

  updateUI();
});