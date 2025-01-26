document.addEventListener('DOMContentLoaded', () => {
    const reloadButton = document.getElementById('reload');
    const profileImage = document.getElementById('profile__image');
    const imagePathInput = document.getElementById('image__path');
    const nextButton = document.querySelector('.next__button');
    const errorMessage = document.createElement('p');
    errorMessage.style.color = 'red';

    reloadButton.addEventListener('click', () => {
        const imagePath = imagePathInput.value;
        profileImage.src = imagePath;
    });

    nextButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const imagePath = imagePathInput.value;

        if (imagePath) {
            const serviceProviderData = JSON.parse(localStorage.getItem('serviceProviderData'));

            if (!serviceProviderData) {
                errorMessage.textContent = 'As informações básicas estão faltando. Por favor, volte e preencha os campos obrigatórios.';
                document.body.appendChild(errorMessage);
                return;
            }

            serviceProviderData.avatar_path = imagePath;

            console.log('Dados do prestador de serviço (Terceira Tela):', serviceProviderData);

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(serviceProviderData)
                });

                if (response.ok) {
                    window.location.href = './../4-service-provider-success/index.html';
                } else {
                    const errorText = await response.text();
                    errorMessage.textContent = `Falha no cadastro: ${errorText}`;
                    document.body.appendChild(errorMessage);
                }
            } catch (error) {
                console.error('Erro:', error);
                errorMessage.textContent = 'Erro ao conectar com o servidor.';
                document.body.appendChild(errorMessage);
            }
        } else {
            alert('Por favor, insira a URL da imagem.');
        }
    });
});
