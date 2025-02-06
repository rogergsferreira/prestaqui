document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const nextButton = document.querySelector('.next__button');

    // Preencher os campos com os dados do localStorage se existirem
    const serviceProviderData = JSON.parse(localStorage.getItem('serviceProviderData'));
    if (serviceProviderData) {
        document.getElementById('email').value = serviceProviderData.email || '';
        document.getElementById('password').value = serviceProviderData.password || '';
        document.getElementById('name').value = serviceProviderData.name || '';
        document.getElementById('cellphone').value = serviceProviderData.phone || '';
        document.getElementById('cep').value = serviceProviderData.cep || '';
        document.getElementById('state').value = serviceProviderData.state || '';
        document.getElementById('city').value = serviceProviderData.city || '';
        document.getElementById('neighborhood').value = serviceProviderData.neighborhood || '';
        document.getElementById('address').value = serviceProviderData.street_address || '';
        document.getElementById('additional__info').value = serviceProviderData.complement || '';
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
        const streetAddress = document.getElementById('address').value;
        const complement = document.getElementById('additional__info').value;

        if (email && password && name && phone && cep && state && city && neighborhood && streetAddress) {
            const newServiceProviderData = {
                email,
                password,
                name,
                phone,
                cep,
                state,
                city,
                neighborhood,
                streetAddress,
                complement,
                userType: 'service_provider'
            };

            localStorage.setItem('serviceProviderData', JSON.stringify(newServiceProviderData));
            console.log('Informação do Prestador de Serviço (Primeira Tela):', newServiceProviderData);
            window.location.href = './../2-service-provider-category/index.html';
        } else {
            alert('Por favor, preencha todos os campos obrigatórios.');
        }
    });
});
