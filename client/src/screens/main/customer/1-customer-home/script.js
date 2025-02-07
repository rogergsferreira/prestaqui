document.addEventListener('DOMContentLoaded', () => {

    function loadUserInfo() {
        const userType = localStorage.getItem('userType');
        const userId = localStorage.getItem('userId');
        const email = localStorage.getItem('email');

        if (userId && userType) {
            fetch(`http://localhost:3000/api/user/get-user/${userId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro HTTP! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(user => {
                    document.getElementById('user__name').textContent = user.name;
                    document.getElementById('user__profile').src = user.avatar_path || 'https://robohash.org/default';

                    loadScheduling(userId);
                })
                .catch(error => console.error('Erro ao carregar as informações do usuário:', error));
        } else {
            window.location.href = '../../../../../public/index.html';
        }
    }

    function loadScheduling(userId) {
        fetch(`http://localhost:3000/api/services/get-services/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const schedulingContainer = document.querySelector('.scheduling__container');
                schedulingContainer.innerHTML = '';

                data.forEach(scheduling => {
                    const schedulingCard = document.createElement('div');
                    schedulingCard.classList.add('scheduling');

                    // Definir a cor de fundo do card com base no status
                    let cardColor = '';
                    switch (scheduling.status) {
                        case 'Em busca':
                            cardColor = 'orange';
                            schedulingCard.classList.add('card__embusca');
                            break;
                        case 'Agendado':
                            cardColor = 'blue';
                            schedulingCard.classList.add('card__agendado');
                            break;
                        case 'Em andamento':
                            cardColor = 'gray';
                            schedulingCard.classList.add('card__emandamento');
                            break;
                        default:
                            cardColor = 'white';
                    }

                    schedulingCard.style.backgroundColor = cardColor;

                    // Montar o conteúdo do card
                    schedulingCard.innerHTML = `
                        <h3>#${scheduling.id} - ${scheduling.title}</h3>
                        <div class="service__provider__info">
                            <h4>Prestador: </h4>
                            <div>${scheduling.provider_name || 'Aguardando prestador'}</div>
                            ${scheduling.provider_phone ? `<a href="https://wa.me/${scheduling.provider_phone}" target="_blank">
                                <img src="../../../assets/img/whatsapp-logo.png" alt="Whatsapp">
                            </a>` : ''}
                        </div>
                        <h4>Descrição: <span>${scheduling.service_description}</span></h4>
                        <h4>Status: </h4>
                        <span class="${scheduling.status.toLowerCase()}">${scheduling.status}</span>
                        <h4>Categoria:</h4>
                        <div class="category">
                            <div class="${scheduling.category_name ? scheduling.category_name.toLowerCase() : ''}">${scheduling.category_name ? scheduling.category_name.toUpperCase() : ''}</div>
                        </div>
                        ${['Em busca', 'Agendado'].includes(scheduling.status) ? `<button class="scheduling__cancel" data-id="${scheduling.id}" data-status="${scheduling.status}">CANCELAR SERVIÇO</button>` : ''}
                        ${scheduling.status === 'Em andamento' ? `<button class="scheduling__complete" onclick="completeScheduling(${scheduling.id})">CONCLUIR SERVIÇO</button>` : ''}
                    `;

                    // Adicionar o card ao container
                    schedulingContainer.appendChild(schedulingCard);

                    // Adicionar event listener ao botão de cancelar, se existir
                    const cancelButton = schedulingCard.querySelector('.scheduling__cancel');
                    if (cancelButton) {
                        cancelButton.addEventListener('click', () => {
                            const schedulingId = cancelButton.getAttribute('data-id');
                            const status = cancelButton.getAttribute('data-status');

                            // Verificar se o status permite o cancelamento
                            if (['Agendado', 'Em busca'].includes(status)) {
                                if (confirm('Tem certeza que deseja cancelar este serviço?')) {
                                    cancelScheduling(schedulingId);
                                }
                            } else {
                                alert('Este serviço não pode ser cancelado no status atual.');
                            }
                        });
                    }
                });
            })
            .catch(error => console.error('Erro ao carregar os agendamentos:', error));
    }

    // script.js

    function cancelScheduling(schedulingId) {
        fetch(`http://localhost:3000/api/services/cancel-service/${schedulingId}`, {
            method: 'PUT'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Agendamento cancelado com sucesso!');
                    loadScheduling(localStorage.getItem('userId'));
                } else {
                    alert('Erro ao cancelar agendamento: ' + (data.message || 'Erro desconhecido.'));
                }
            })
            .catch(error => {
                console.error('Erro ao cancelar agendamento:', error);
                alert('Ocorreu um erro ao cancelar o agendamento.');
            });
    }




    function completeScheduling(schedulingId) {
        fetch(`http://localhost:3000/api/services/complete-service/${schedulingId}`, {
            method: 'PUT'
        })
            .then(response => response.ok ? alert('Serviço marcado como concluído!') : alert('Erro ao concluir serviço'))
            .catch(error => console.error('Erro ao concluir serviço:', error))
            .finally(() => loadScheduling(localStorage.getItem('userId')));
    }

    function goToNewSchedulingPage() {
        window.location.href = '../4-new-scheduling/index.html';
    }

    document.querySelector('.new__scheduling').onclick = goToNewSchedulingPage;

    loadUserInfo();

});

// JavaScript para manipular o filtro de status

document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.querySelector(".dropdown");
    const button = document.querySelector(".dropdown-btn");
    const menu = document.querySelector(".dropdown-menu");
    const radios = document.querySelectorAll(".dropdown-menu input[type='radio']");

    // Abrir e fechar o menu ao clicar no botão
    button.addEventListener("click", function () {
        let expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", !expanded);
        dropdown.classList.toggle("open");
    });

    // Fechar o menu ao selecionar uma opção
    radios.forEach(radio => {
        radio.addEventListener("change", function () {
            setTimeout(() => {
                button.textContent = document.querySelector(`label[for="${this.id}"]`).textContent;
                dropdown.classList.remove("open");
                button.setAttribute("aria-expanded", "false");

                // Filtrar os agendamentos com base no status selecionado
                filterScheduling(this.value);
            }, 150);
        });
    });

    // Fechar o dropdown ao clicar fora dele
    document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target) && dropdown.classList.contains('open')) {
            dropdown.classList.remove("open");
            button.setAttribute("aria-expanded", "false");
        }
    });
});

// Função para filtrar os agendamentos com base no status
function filterScheduling(status) {
    const schedulingCards = document.querySelectorAll('.scheduling__container .scheduling');

    schedulingCards.forEach(card => {
        const cardStatus = card.querySelector('span').textContent.trim();

        if (status === 'todos' || cardStatus.toLowerCase() === status.toLowerCase()) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// JavaScript para o menu hambúrguer

const hamburguerMenu = document.getElementById('hamburguer-menu');

const navItems = document.getElementById('nav-items');
const main = document.querySelector('main');

const navItem = document.querySelectorAll('.nav-item');

const closeButton = document.getElementById('close__button');

hamburguerMenu.addEventListener('click', () => {
    navItems.classList.toggle('active');
    hamburguerMenu.classList.toggle('active');
    main.classList.toggle('active');
});

navItem.forEach(item => item.addEventListener('click', () => {
    const navItemsIsActive = navItems.classList.contains('active');

    if (navItemsIsActive) {
        navItems.classList.remove('active');
        hamburguerMenu.classList.remove('active');
        main.classList.remove('active');
    }
}));

closeButton.addEventListener('click', () => {
    navItems.classList.remove('active');
    hamburguerMenu.classList.remove('active');
    main.classList.remove('active');
});
