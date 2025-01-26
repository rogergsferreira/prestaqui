const dropdown = document.querySelector('.dropdown');
const button = document.querySelector('.dropdown-btn');
const menu = document.querySelector('.dropdown-menu');

button.addEventListener('click', () => {
  dropdown.classList.toggle('active');
});

window.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});