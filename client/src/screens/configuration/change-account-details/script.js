document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('update-profile-form');
    const categoriesSection = document.getElementById('categories-section');
    const dropdown = document.querySelector('.dropdown');
    const button = document.querySelector('.dropdown-btn');
    const menu = document.querySelector('.dropdown-menu');
    const checkboxes = document.querySelectorAll('.dropdown-menu input[type="checkbox"]');
    let userId;
    let userType;

    userId = localStorage.getItem('userId');
    userType = localStorage.getItem('userType');

    if (!userId || !userType) {
        alert('Usuário não identificado. Por favor, faça login novamente.');
        window.location.href = '/../../../../public/index.html';
        return;
    }

    // exibir a seção de categorias se o userType for 'service_provider'
    if (userType === 'service_provider') {
        categoriesSection.style.display = 'block';
        fetchCategories();
    } else {
        categoriesSection.style.display = 'none';
    }

    button?.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });

    window.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // preencher o formulário com os dados atuais do usuário
    async function fetchUserData() {
        try {
            const response = await fetch(`http://localhost:3000/api/user/get-user/${userId}`);
            if (response.ok) {
                const userData = await response.json();
                document.getElementById('email').value = userData.email;
                document.getElementById('name').value = userData.name;
                document.getElementById('phone').value = userData.phone;
                document.getElementById('cep').value = userData.cep;
                document.getElementById('state').value = userData.state;
                document.getElementById('city').value = userData.city;
                document.getElementById('neighborhood').value = userData.neighborhood;
                document.getElementById('street_address').value = userData.street_address;
                document.getElementById('complement').value = userData.complement;
                document.getElementById('avatar_path').value = userData.avatar_path || '';
            } else {
                console.error('Erro ao obter dados do usuário');
            }
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetch(`http://localhost:3000/api/user/get-categories/${userId}`);
            if (response.ok) {
                const categoriesData = await response.json();
                const userCategories = categoriesData.categories;
                checkboxes.forEach(checkbox => {
                    if (userCategories.includes(checkbox.value)) {
                        checkbox.checked = true;
                    }
                });
            } else {
                console.error('Erro ao obter categorias do usuário');
            }
        } catch (error) {
            console.error('Erro ao obter categorias do usuário:', error);
        }
    }

    fetchUserData();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newEmail = document.getElementById('email').value;
        const newPassword = document.getElementById('password').value;
        const newName = document.getElementById('name').value;
        const newPhone = document.getElementById('phone').value;
        const newCep = document.getElementById('cep').value;
        const newState = document.getElementById('state').value;
        const newCity = document.getElementById('city').value;
        const newNeighborhood = document.getElementById('neighborhood').value;
        const newStreetAddress = document.getElementById('street_address').value;
        const newComplement = document.getElementById('complement').value;
        const newAvatarPath = document.getElementById('avatar_path').value;

        const updatedData = {};

        if (newEmail) updatedData.newEmail = newEmail;
        if (newPassword) updatedData.newPassword = newPassword;
        if (newName) updatedData.newName = newName;
        if (newPhone) updatedData.newPhone = newPhone;
        if (newCep) updatedData.newCep = newCep;
        if (newState) updatedData.newState = newState;
        if (newCity) updatedData.newCity = newCity;
        if (newNeighborhood) updatedData.newNeighborhood = newNeighborhood;
        if (newStreetAddress) updatedData.newStreetAddress = newStreetAddress;
        if (newComplement) updatedData.newComplement = newComplement;
        if (newAvatarPath) updatedData.newAvatarPath = newAvatarPath;

        if (userType === 'service_provider') {
            const selectedCategories = [];
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedCategories.push(checkbox.value);
                }
            });
            updatedData.categories = selectedCategories;
        }

        if (Object.keys(updatedData).length === 0) {
            alert('Por favor, preencha pelo menos um campo para atualizar.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/user/update-user/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                alert('Dados atualizados com sucesso!');
                // atualzia localStorage se o email foi alterado
                if (updatedData.newEmail) {
                    localStorage.setItem('email', updatedData.newEmail);
                }
            } else {
                const errorText = await response.text();
                alert('Erro ao atualizar os dados: ' + errorText);
            }
        } catch (error) {
            console.error('Erro ao atualizar os dados:', error);
            alert('Erro ao atualizar os dados. Tente novamente mais tarde.');
        }
    });
});
