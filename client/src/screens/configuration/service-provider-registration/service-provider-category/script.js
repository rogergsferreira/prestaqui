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

nextButton.addEventListener('click', async (event) => {
  event.preventDefault();
  const checkboxes = document.querySelectorAll('.dropdown-menu input[type="checkbox"]');
  const selectedCategories = [];

  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedCategories.push(checkbox.value);
    }
  });

  if (selectedCategories.length > 0) {
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');

    if (!userId) {
      alert('Usuário não identificado. Por favor, faça login novamente.');
      window.location.href = './../../../../../public/index.html';
      return;
    }

    const data = {
      userId: userId,
      categories: selectedCategories
    };

    try {
      const response = await fetch('http://localhost:3000/api/user/add-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Categorias registradas com sucesso:', result);
        window.location.href = './../service-provider-success/index.html'; // Redireciona para a página de sucesso
      } else {
        alert('Erro ao registrar categorias: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao registrar categorias:', error);
      alert('Erro ao registrar categorias. Tente novamente mais tarde.');
    }

  } else {
    alert('Por favor, selecione pelo menos uma categoria.');
  }
});
