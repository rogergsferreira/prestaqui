document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const nextButton = document.querySelector('.next__button');

    // Preencher os campos com os dados do localStorage se existirem
    const customerData = JSON.parse(localStorage.getItem('customerData'));
    if (customerData) {
        document.getElementById('email').value = customerData.email || '';
        document.getElementById('password').value = customerData.password || '';
        document.getElementById('name').value = customerData.name || '';
        document.getElementById('cellphone').value = customerData.phone || '';
        document.getElementById('cep').value = customerData.cep || '';
        document.getElementById('state').value = customerData.state || '';
        document.getElementById('city').value = customerData.city || '';
        document.getElementById('neighborhood').value = customerData.neighborhood || '';
        document.getElementById('street_address').value = customerData.street_address || '';
        document.getElementById('additional__info').value = customerData.complement || '';
    }

    nextButton.addEventListener('click', (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const phone = document.getElementById('cellphone').value;
        const cep = document.getElementById('cep').value;
        const state = document.getElementById('state').value;
        const city = document.getElementById('city').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const street_address = document.getElementById('street_address').value;
        const complement = document.getElementById('additional__info').value;

        if (email && password && name && phone && cep && state && city && neighborhood && street_address) {
            const newCustomerData = {
                email,
                password,
                name,
                phone,
                cep,
                state,
                city,
                neighborhood,
                street_address,
                complement
            };

            localStorage.setItem('customerData', JSON.stringify(newCustomerData));
            console.log('Informação do Cliente (Primeira Tela):', newCustomerData); // Adiciona um console.log
            window.location.href = './../2-customer-profile/index.html';
        } else {
            alert('Por favor, preencha todos os campos obrigatórios.');
        }
    });
});
