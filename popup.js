document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('calendar-grid');
  
  chrome.storage.local.get(['myDept', 'myName', 'myPhone', 'eatingDays', 'bookedDates', 'userType'], (res) => {
    if (res.userType) document.getElementById('userType').value = res.userType;
    if (res.myDept) document.getElementById('myDept').value = res.myDept;
    if (res.myName) document.getElementById('myName').value = res.myName;
    if (res.myPhone) document.getElementById('myPhone').value = res.myPhone;
    if (res.eatingDays) res.eatingDays.forEach(d => {
      document.querySelector(`.day-check[value="${d}"]`).checked = true;
    });
    renderCalendar(res.bookedDates || []);
  });

  function renderCalendar(bookedDates) {
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
      const dateKey = `${year}-${month + 1}-${d}`; // 통일된 날짜 키
      const isBooked = bookedDates.includes(dateKey);
      grid.innerHTML += `<div class="day ${isBooked ? 'booked' : ''} ${d === now.getDate() ? 'today' : ''}">${d}</div>`;
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
});