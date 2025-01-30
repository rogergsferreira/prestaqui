const dropdown = document.querySelector('.dropdown');
const button = document.querySelector('.dropdown-btn');
const menu = document.querySelector('.dropdown-menu');
const nextButton = document.querySelector('.next__button');

button.addEventListener('click', () => {
  dropdown.classList.toggle('active');
});

window.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

nextButton.addEventListener('click', (event) => {
  event.preventDefault();
  const checkboxes = document.querySelectorAll('.dropdown-menu input[type="checkbox"]');
  const selectedCategories = [];

  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedCategories.push(checkbox.value);
    }
  });

  if (selectedCategories.length > 0) {
    const serviceProviderData = JSON.parse(localStorage.getItem('serviceProviderData'));

    if (!serviceProviderData) {
      alert('Por favor, preencha as informações básicas primeiro.');
      return;
    }

    serviceProviderData.categories = selectedCategories;
    localStorage.setItem('serviceProviderData', JSON.stringify(serviceProviderData));

    console.log('Categorias Selecionadas:', selectedCategories);
    window.location.href = './../3-service-provider-profile/index.html';
  } else {
    alert('Por favor, selecione pelo menos uma categoria.');
  }
});
